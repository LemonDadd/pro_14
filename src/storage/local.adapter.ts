import type {
  Baby,
  BabyEvent,
  GrowthRecord,
  AppSettings,
} from '@/types';
import {
  getBabies,
  saveBabies,
  getEvents,
  saveEvents,
  getGrowthRecords,
  saveGrowthRecords,
  getSettings,
  saveSettings,
  generateId,
} from '@/utils/storage';
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

const DEFAULT_SETTINGS: AppSettings = {
  feedReminderInterval: 3,
  currentBabyId: null,
};

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'local';

  // ===== Babies =====

  async listBabies(): Promise<Baby[]> {
    return getBabies();
  }

  async getBaby(id: string): Promise<Baby | null> {
    const babies = getBabies();
    return babies.find((b) => b.id === id) || null;
  }

  async createBaby(input: CreateBabyInput): Promise<Baby> {
    const babies = getBabies();
    const existingIdx = input.id ? babies.findIndex((b) => b.id === input.id) : -1;

    if (existingIdx >= 0) {
      const updated = { ...babies[existingIdx], ...input } as Baby;
      const next = [...babies];
      next[existingIdx] = updated;
      saveBabies(next);
      return updated;
    }

    const baby: Baby = {
      id: input.id || generateId(),
      ...input,
      avatarColor: input.avatarColor || this.pickAvatarColor(babies.length),
      createdAt: input.createdAt || Date.now(),
    } as Baby;
    const next = [...babies, baby];
    saveBabies(next);

    // First baby auto set as current
    const settings = getSettings();
    if (!settings.currentBabyId) {
      const newSettings = { ...settings, currentBabyId: baby.id };
      saveSettings(newSettings);
    }

    return baby;
  }

  async updateBaby(id: string, input: UpdateBabyInput): Promise<Baby> {
    const babies = getBabies();
    const idx = babies.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error(`Baby ${id} not found`);
    const updated = { ...babies[idx], ...input } as Baby;
    const next = [...babies];
    next[idx] = updated;
    saveBabies(next);
    return updated;
  }

  async deleteBaby(id: string): Promise<void> {
    const babies = getBabies().filter((b) => b.id !== id);
    const events = getEvents().filter((e) => e.babyId !== id);
    const growth = getGrowthRecords().filter((g) => g.babyId !== id);
    saveBabies(babies);
    saveEvents(events);
    saveGrowthRecords(growth);

    const settings = getSettings();
    if (settings.currentBabyId === id) {
      const newSettings = {
        ...settings,
        currentBabyId: babies[0]?.id || null,
      };
      saveSettings(newSettings);
    }
  }

  async setCurrentBaby(id: string): Promise<Baby> {
    const baby = await this.getBaby(id);
    if (!baby) throw new Error(`Baby ${id} not found`);
    const settings = { ...getSettings(), currentBabyId: id };
    saveSettings(settings);
    return baby;
  }

  // ===== Events =====

  async listEvents(options: ListEventsOptions = {}): Promise<BabyEvent[]> {
    let events = getEvents();
    if (options.babyId) {
      events = events.filter((e) => e.babyId === options.babyId);
    }
    if (options.type) {
      events = events.filter((e) => e.type === options.type);
    }
    if (options.startAt != null) {
      events = events.filter((e) => e.timestamp >= options.startAt!);
    }
    if (options.endAt != null) {
      events = events.filter((e) => e.timestamp <= options.endAt!);
    }
    events.sort((a, b) => b.timestamp - a.timestamp);
    if (options.limit != null && options.limit > 0) {
      events = events.slice(0, options.limit);
    }
    return events;
  }

  async getEvent(id: string): Promise<BabyEvent | null> {
    return getEvents().find((e) => e.id === id) || null;
  }

  async createEvent(input: CreateEventInput): Promise<BabyEvent> {
    const events = getEvents();
    const existingIdx = input.id ? events.findIndex((e) => e.id === input.id) : -1;

    if (existingIdx >= 0) {
      const updated = { ...events[existingIdx], ...input } as BabyEvent;
      const next = [...events];
      next[existingIdx] = updated;
      saveEvents(next);
      return updated;
    }

    const event: BabyEvent = {
      id: input.id || generateId(),
      ...input,
    } as BabyEvent;
    const next = [event, ...events];
    saveEvents(next);
    return event;
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<BabyEvent> {
    const events = getEvents();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Event ${id} not found`);
    const updated = { ...events[idx], ...input } as BabyEvent;
    const next = [...events];
    next[idx] = updated;
    saveEvents(next);
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    const events = getEvents().filter((e) => e.id !== id);
    saveEvents(events);
  }

  // ===== Growth Records =====

  async listGrowthRecords(options: ListGrowthOptions = {}): Promise<GrowthRecord[]> {
    let records = getGrowthRecords();
    if (options.babyId) {
      records = records.filter((r) => r.babyId === options.babyId);
    }
    if (options.startDate) {
      records = records.filter((r) => r.date >= options.startDate!);
    }
    if (options.endDate) {
      records = records.filter((r) => r.date <= options.endDate!);
    }
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return records;
  }

  async getGrowthRecord(id: string): Promise<GrowthRecord | null> {
    return getGrowthRecords().find((r) => r.id === id) || null;
  }

  async createGrowthRecord(input: CreateGrowthRecordInput): Promise<GrowthRecord> {
    const records = getGrowthRecords();
    const existingIdx = input.id ? records.findIndex((r) => r.id === input.id) : -1;

    if (existingIdx >= 0) {
      const updated = { ...records[existingIdx], ...input } as GrowthRecord;
      const next = [...records];
      next[existingIdx] = updated;
      saveGrowthRecords(next);
      return updated;
    }

    const record: GrowthRecord = {
      id: input.id || generateId(),
      ...input,
    } as GrowthRecord;
    const next = [...records, record];
    saveGrowthRecords(next);
    return record;
  }

  async updateGrowthRecord(id: string, input: UpdateGrowthRecordInput): Promise<GrowthRecord> {
    const records = getGrowthRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`GrowthRecord ${id} not found`);
    const updated = { ...records[idx], ...input } as GrowthRecord;
    const next = [...records];
    next[idx] = updated;
    saveGrowthRecords(next);
    return updated;
  }

  async deleteGrowthRecord(id: string): Promise<void> {
    const records = getGrowthRecords().filter((r) => r.id !== id);
    saveGrowthRecords(records);
  }

  // ===== Settings =====

  async getSettings(): Promise<AppSettings> {
    return { ...DEFAULT_SETTINGS, ...getSettings() };
  }

  async updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
    const current = getSettings();
    const next = { ...current, ...input };
    saveSettings(next);
    return next;
  }

  // ===== Batch =====

  async exportAll(): Promise<FullSnapshot> {
    return {
      babies: getBabies(),
      events: getEvents(),
      growthRecords: getGrowthRecords(),
      settings: getSettings(),
    };
  }

  async importAll(snapshot: FullSnapshot): Promise<{
    importedBabies: number;
    importedEvents: number;
    importedGrowthRecords: number;
    skippedConflicts: number;
  }> {
    const mergeById = <T extends { id: string }>(local: T[], remote: T[]): { merged: T[]; added: number } => {
      const map = new Map<string, T>();
      local.forEach((x) => map.set(x.id, x));
      let added = 0;
      remote.forEach((x) => {
        if (!map.has(x.id)) {
          map.set(x.id, x);
          added++;
        }
      });
      return { merged: Array.from(map.values()), added };
    };

    const { merged: babies, added: addedBabies } = mergeById(getBabies(), snapshot.babies);
    const { merged: events, added: addedEvents } = mergeById(getEvents(), snapshot.events);
    const { merged: growthRecords, added: addedGrowth } = mergeById(
      getGrowthRecords(),
      snapshot.growthRecords
    );

    saveBabies(babies);
    saveEvents(events);
    saveGrowthRecords(growthRecords);

    const localSettings = getSettings();
    if (snapshot.settings && !localSettings.currentBabyId && snapshot.settings.currentBabyId) {
      saveSettings(snapshot.settings);
    }

    const skipped =
      snapshot.babies.length - addedBabies +
      snapshot.events.length - addedEvents +
      snapshot.growthRecords.length - addedGrowth;

    return {
      importedBabies: addedBabies,
      importedEvents: addedEvents,
      importedGrowthRecords: addedGrowth,
      skippedConflicts: skipped,
    };
  }

  // ===== Health =====

  async isAvailable(): Promise<boolean> {
    try {
      getBabies();
      return true;
    } catch {
      return false;
    }
  }

  private pickAvatarColor(index: number): string {
    const COLORS = [
      '#FF8FB1',
      '#7BC8FF',
      '#A8E6CF',
      '#FFD93D',
      '#C39BD3',
      '#F8B500',
    ];
    return COLORS[index % COLORS.length];
  }
}
