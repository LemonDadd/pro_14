import Taro from '@tarojs/taro';
import type {
  Baby,
  BabyEvent,
  GrowthRecord,
  AppSettings,
} from '@/types';
import { LocalStorageAdapter } from './local.adapter';
import { ApiStorageAdapter } from './api.adapter';
import type {
  StorageAdapter,
  CreateBabyInput,
  UpdateBabyInput,
  CreateEventInput,
  UpdateEventInput,
  CreateGrowthRecordInput,
  UpdateGrowthRecordInput,
  UpdateSettingsInput,
  ListEventsOptions,
  ListGrowthOptions,
  FullSnapshot,
} from './types';

export type WriteMode = 'api-first' | 'local-first';
export type ReadMode = 'local-only' | 'local-then-refresh';

const PENDING_QUEUE_KEY = 'babycare_pending_ops';
const MAX_RETRY = 3;

interface PendingOperation {
  id: string;
  entity: 'baby' | 'event' | 'growthRecord' | 'settings';
  action: 'create' | 'update' | 'delete';
  entityId?: string;
  data?: any;
  retryCount: number;
  createdAt: number;
}

interface HybridAdapterOptions {
  writeMode?: WriteMode;
  readMode?: ReadMode;
  onError?: (err: Error, operation: string) => void;
  onWriteFallback?: (operation: string) => void;
  onRefresh?: () => void;
}

export class HybridStorageAdapter implements StorageAdapter {
  readonly name = 'hybrid';

  readonly local: LocalStorageAdapter;
  readonly api: ApiStorageAdapter;

  private options: Required<HybridAdapterOptions>;

  private isOnline = true;
  private isAuthenticated = false;

  private refreshPromise: Promise<FullSnapshot | null> | null = null;

  constructor(options: HybridAdapterOptions = {}) {
    this.local = new LocalStorageAdapter();
    this.api = new ApiStorageAdapter();
    this.options = {
      writeMode: 'api-first',
      readMode: 'local-then-refresh',
      onError: () => {},
      onWriteFallback: () => {},
      onRefresh: () => {},
      ...options,
    };
  }

  setNetworkStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.flushPendingQueue().catch((e) => {
        console.warn('[HybridAdapter] flush queue failed:', e);
      });
    }
  }

  setAuthStatus(isAuthenticated: boolean) {
    this.isAuthenticated = isAuthenticated;
  }

  private shouldUseApi(): boolean {
    return this.isAuthenticated && this.isOnline;
  }

  private getPendingQueue(): PendingOperation[] {
    try {
      const data = Taro.getStorageSync(PENDING_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private savePendingQueue(queue: PendingOperation[]) {
    Taro.setStorageSync(PENDING_QUEUE_KEY, JSON.stringify(queue));
  }

  private enqueuePending(op: Omit<PendingOperation, 'id' | 'retryCount' | 'createdAt'> & { data?: any }) {
    const queue = this.getPendingQueue();
    const item: PendingOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      retryCount: 0,
      createdAt: Date.now(),
      ...op,
    };
    queue.push(item);
    this.savePendingQueue(queue);
    console.log('[HybridAdapter] enqueued pending op:', item.action, item.entity);
  }

  async flushPendingQueue(): Promise<number> {
    if (!this.shouldUseApi()) return 0;

    const queue = this.getPendingQueue();
    if (queue.length === 0) return 0;

    let successCount = 0;
    const remaining: PendingOperation[] = [];

    for (const op of queue) {
      try {
        await this.executeOpOnApi(op);
        successCount++;
        console.log('[HybridAdapter] pending op succeeded:', op.action, op.entity);
      } catch (e: any) {
        op.retryCount++;
        if (op.retryCount < MAX_RETRY) {
          remaining.push(op);
        } else {
          console.warn('[HybridAdapter] pending op dropped after retries:', op.action, op.entity, e.message);
        }
      }
    }

    this.savePendingQueue(remaining);
    if (successCount > 0) {
      this.options.onRefresh();
    }
    return successCount;
  }

  private async executeOpOnApi(op: PendingOperation): Promise<any> {
    switch (`${op.action}:${op.entity}`) {
      case 'create:baby':
        return this.api.createBaby(op.data);
      case 'update:baby':
        return this.api.updateBaby(op.entityId!, op.data);
      case 'delete:baby':
        return this.api.deleteBaby(op.entityId!);

      case 'create:event':
        return this.api.createEvent(op.data);
      case 'update:event':
        return this.api.updateEvent(op.entityId!, op.data);
      case 'delete:event':
        return this.api.deleteEvent(op.entityId!);

      case 'create:growthRecord':
        return this.api.createGrowthRecord(op.data);
      case 'update:growthRecord':
        return this.api.updateGrowthRecord(op.entityId!, op.data);
      case 'delete:growthRecord':
        return this.api.deleteGrowthRecord(op.entityId!);

      case 'update:settings':
        return this.api.updateSettings(op.data);

      default:
        throw new Error(`Unknown operation: ${op.action}:${op.entity}`);
    }
  }

  private async writeWithFallback<T>(
    operation: string,
    entity: 'baby' | 'event' | 'growthRecord' | 'settings',
    action: 'create' | 'update' | 'delete',
    entityId: string | undefined,
    data: any,
    apiFn: () => Promise<T>,
    localFn: () => Promise<T>,
    syncToLocal?: (apiResult: T) => Promise<void>,
  ): Promise<T> {
    if (!this.shouldUseApi()) {
      return localFn();
    }

    try {
      const result = await apiFn();
      if (syncToLocal) {
        try { await syncToLocal(result); } catch {}
      } else {
        try { await localFn(); } catch {}
      }
      return result;
    } catch (e: any) {
      console.warn(`[HybridAdapter] API ${operation} failed, fallback to local:`, e.message);
      this.options.onWriteFallback(operation);

      const localResult = await localFn();

      this.enqueuePending({
        entity,
        action,
        entityId,
        data,
      });

      return localResult;
    }
  }

  // ===== Babies =====

  async listBabies(): Promise<Baby[]> {
    return this.local.listBabies();
  }

  async getBaby(id: string): Promise<Baby | null> {
    return this.local.getBaby(id);
  }

  async createBaby(input: CreateBabyInput): Promise<Baby> {
    return this.writeWithFallback(
      'createBaby',
      'baby',
      'create',
      undefined,
      input,
      () => this.api.createBaby(input),
      async () => {
        const local = await this.local.createBaby(input);
        return local;
      },
    );
  }

  async updateBaby(id: string, input: UpdateBabyInput): Promise<Baby> {
    return this.writeWithFallback(
      'updateBaby',
      'baby',
      'update',
      id,
      input,
      () => this.api.updateBaby(id, input),
      () => this.local.updateBaby(id, input),
    );
  }

  async deleteBaby(id: string): Promise<void> {
    await this.writeWithFallback(
      'deleteBaby',
      'baby',
      'delete',
      id,
      undefined,
      async () => { await this.api.deleteBaby(id); },
      async () => { await this.local.deleteBaby(id); },
    );
  }

  async setCurrentBaby(id: string): Promise<Baby> {
    return this.writeWithFallback(
      'setCurrentBaby',
      'baby',
      'update',
      id,
      { setCurrent: true },
      () => this.api.setCurrentBaby(id),
      () => this.local.setCurrentBaby(id),
    );
  }

  // ===== Events =====

  async listEvents(options?: ListEventsOptions): Promise<BabyEvent[]> {
    return this.local.listEvents(options);
  }

  async getEvent(id: string): Promise<BabyEvent | null> {
    return this.local.getEvent(id);
  }

  async createEvent(input: CreateEventInput): Promise<BabyEvent> {
    return this.writeWithFallback(
      'createEvent',
      'event',
      'create',
      undefined,
      input,
      () => this.api.createEvent(input),
      () => this.local.createEvent(input),
    );
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<BabyEvent> {
    return this.writeWithFallback(
      'updateEvent',
      'event',
      'update',
      id,
      input,
      () => this.api.updateEvent(id, input),
      () => this.local.updateEvent(id, input),
    );
  }

  async deleteEvent(id: string): Promise<void> {
    await this.writeWithFallback(
      'deleteEvent',
      'event',
      'delete',
      id,
      undefined,
      async () => { await this.api.deleteEvent(id); },
      async () => { await this.local.deleteEvent(id); },
    );
  }

  // ===== Growth Records =====

  async listGrowthRecords(options?: ListGrowthOptions): Promise<GrowthRecord[]> {
    return this.local.listGrowthRecords(options);
  }

  async getGrowthRecord(id: string): Promise<GrowthRecord | null> {
    return this.local.getGrowthRecord(id);
  }

  async createGrowthRecord(input: CreateGrowthRecordInput): Promise<GrowthRecord> {
    return this.writeWithFallback(
      'createGrowthRecord',
      'growthRecord',
      'create',
      undefined,
      input,
      () => this.api.createGrowthRecord(input),
      () => this.local.createGrowthRecord(input),
    );
  }

  async updateGrowthRecord(id: string, input: UpdateGrowthRecordInput): Promise<GrowthRecord> {
    return this.writeWithFallback(
      'updateGrowthRecord',
      'growthRecord',
      'update',
      id,
      input,
      () => this.api.updateGrowthRecord(id, input),
      () => this.local.updateGrowthRecord(id, input),
    );
  }

  async deleteGrowthRecord(id: string): Promise<void> {
    await this.writeWithFallback(
      'deleteGrowthRecord',
      'growthRecord',
      'delete',
      id,
      undefined,
      async () => { await this.api.deleteGrowthRecord(id); },
      async () => { await this.local.deleteGrowthRecord(id); },
    );
  }

  // ===== Settings =====

  async getSettings(): Promise<AppSettings> {
    return this.local.getSettings();
  }

  async updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
    return this.writeWithFallback(
      'updateSettings',
      'settings',
      'update',
      undefined,
      input,
      () => this.api.updateSettings(input),
      () => this.local.updateSettings(input),
    );
  }

  // ===== Batch =====

  async exportAll(): Promise<FullSnapshot> {
    if (this.shouldUseApi()) {
      try {
        return await this.api.exportAll();
      } catch (e) {
        console.warn('[HybridAdapter] exportAll from API failed, use local:', e);
      }
    }
    return this.local.exportAll();
  }

  async importAll(snapshot: FullSnapshot): Promise<{
    importedBabies: number;
    importedEvents: number;
    importedGrowthRecords: number;
    skippedConflicts: number;
  }> {
    if (this.shouldUseApi()) {
      try {
        const result = await this.api.importAll(snapshot);
        await this.refreshFromCloud();
        return result;
      } catch (e) {
        console.warn('[HybridAdapter] importAll to API failed, fallback local:', e);
      }
    }
    return this.local.importAll(snapshot);
  }

  // ===== Refresh from cloud =====

  async refreshFromCloud(force = false): Promise<FullSnapshot | null> {
    if (!this.shouldUseApi()) {
      return null;
    }
    if (this.refreshPromise && !force) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const remote = await this.api.exportAll();
        await this.local.importAll(remote);
        this.options.onRefresh();
        console.log('[HybridAdapter] refreshed from cloud:',
          remote.babies.length, 'babies,',
          remote.events.length, 'events'
        );
        return remote;
      } catch (e: any) {
        console.warn('[HybridAdapter] refreshFromCloud failed:', e.message);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ===== Health =====

  async isAvailable(): Promise<boolean> {
    return this.local.isAvailable();
  }

  getPendingCount(): number {
    return this.getPendingQueue().length;
  }
}
