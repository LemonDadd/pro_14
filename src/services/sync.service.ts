import Taro from '@tarojs/taro';
import { syncApi } from '@/api';
import { authService } from './auth.service';
import type { Baby, BabyEvent, GrowthRecord, AppSettings } from '@/types';

const LAST_SYNC_AT_KEY = 'babycare_last_sync_at';
const DEBOUNCE_MS = 3000;

export type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'error' | 'conflict';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: number;
  pendingCount: number;
  error?: string;
}

interface Snapshot {
  babies: Baby[];
  events: BabyEvent[];
  growthRecords: GrowthRecord[];
  settings: AppSettings;
}

class SyncService {
  private state: SyncState = { status: 'idle', pendingCount: 0 };
  private listeners: Array<(state: SyncState) => void> = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSnapshot: Snapshot | null = null;
  private isProcessing = false;

  getState(): SyncState {
    return { ...this.state };
  }

  setState(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  subscribe(listener: (state: SyncState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  captureSnapshot(snapshot: Snapshot) {
    this.lastSnapshot = snapshot;
  }

  hasSnapshot(): boolean {
    return !!this.lastSnapshot;
  }

  markDirty(snapshot: Snapshot) {
    if (!authService.isAuthenticated()) {
      return;
    }
    this.captureSnapshot(snapshot);
    this.setState({ pendingCount: this.state.pendingCount + 1 });

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.autoPush();
    }, DEBOUNCE_MS);
  }

  private async autoPush() {
    if (!authService.isAuthenticated() || this.isProcessing || !this.lastSnapshot) {
      return;
    }

    try {
      await this.pushToCloud();
    } catch (e: any) {
      console.warn('[Sync] auto push failed, will retry later:', e.message);
    }
  }

  async pushToCloud(): Promise<{ imported: number; skipped: number } | null> {
    if (!authService.isAuthenticated()) {
      return null;
    }
    if (!this.lastSnapshot) {
      this.setState({ status: 'idle' });
      return null;
    }
    if (this.isProcessing) {
      return null;
    }

    this.isProcessing = true;
    this.setState({ status: 'pushing', error: undefined });

    try {
      const { babies, events, growthRecords, settings } = this.lastSnapshot;
      const res = await syncApi.importData({
        babies: babies.map((b) => ({ ...b })),
        events: events.map((e) => ({ ...e })),
        growthRecords: growthRecords.map((g) => ({ ...g })),
        settings,
      });

      const totalImported =
        res.importedBabies + res.importedEvents + res.importedGrowthRecords;

      Taro.setStorageSync(LAST_SYNC_AT_KEY, Date.now());
      this.setState({
        status: 'idle',
        lastSyncAt: Date.now(),
        pendingCount: 0,
      });

      console.log(
        `[Sync] Push success: +${totalImported} imported, ${res.skippedConflicts} skipped`
      );
      return { imported: totalImported, skipped: res.skippedConflicts };
    } catch (e: any) {
      const errMsg = e.message || '同步失败';
      this.setState({ status: 'error', error: errMsg });
      console.error('[Sync] Push failed:', errMsg);
      throw e;
    } finally {
      this.isProcessing = false;
    }
  }

  async pullFromCloud(): Promise<Snapshot | null> {
    if (!authService.isAuthenticated()) {
      return null;
    }
    if (this.isProcessing) {
      return null;
    }

    this.isProcessing = true;
    this.setState({ status: 'pulling', error: undefined });

    try {
      const remote = await syncApi.exportData();
      const snapshot: Snapshot = {
        babies: remote.babies,
        events: remote.events,
        growthRecords: remote.growthRecords,
        settings: remote.settings,
      };

      Taro.setStorageSync(LAST_SYNC_AT_KEY, Date.now());
      this.lastSnapshot = snapshot;
      this.setState({
        status: 'idle',
        lastSyncAt: Date.now(),
      });

      console.log(
        `[Sync] Pull success: ${snapshot.babies.length} babies, ${snapshot.events.length} events`
      );
      return snapshot;
    } catch (e: any) {
      const errMsg = e.message || '拉取失败';
      this.setState({ status: 'error', error: errMsg });
      console.error('[Sync] Pull failed:', errMsg);
      throw e;
    } finally {
      this.isProcessing = false;
    }
  }

  mergeSnapshots(local: Snapshot, remote: Snapshot, mode: 'localFirst' | 'remoteFirst' = 'remoteFirst'): Snapshot {
    const mergeById = <T extends { id: string }>(localArr: T[], remoteArr: T[]): T[] => {
      const map = new Map<string, T>();
      const first = mode === 'localFirst' ? localArr : remoteArr;
      const second = mode === 'localFirst' ? remoteArr : localArr;
      first.forEach((x) => map.set(x.id, x));
      second.forEach((x) => {
        if (!map.has(x.id)) map.set(x.id, x);
      });
      return Array.from(map.values());
    };

    return {
      babies: mergeById(local.babies, remote.babies),
      events: mergeById(local.events, remote.events),
      growthRecords: mergeById(local.growthRecords, remote.growthRecords),
      settings: mode === 'remoteFirst' && remote.settings ? remote.settings : local.settings,
    };
  }

  getLastSyncAt(): number | null {
    try {
      const v = Taro.getStorageSync(LAST_SYNC_AT_KEY);
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  }

  retryPending() {
    if (this.state.pendingCount > 0) {
      this.autoPush();
    }
  }
}

export const syncService = new SyncService();
