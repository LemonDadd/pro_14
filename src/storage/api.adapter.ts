import type {
  Baby,
  BabyEvent,
  GrowthRecord,
  AppSettings,
} from '@/types';
import {
  babiesApi,
  eventsApi,
  growthRecordsApi,
  settingsApi,
  syncApi,
} from '@/api';
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

function toTimestamp(v: any): number {
  if (v == null) return Date.now();
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string') {
    const n = Date.parse(v);
    if (!isNaN(n)) return n;
    const num = parseInt(v, 10);
    if (!isNaN(num)) return num;
  }
  if (v instanceof Date) return v.getTime();
  return Date.now();
}

function transformBabyFromApi(b: any): Baby {
  return {
    id: b.id,
    nickname: b.nickname,
    birthday: b.birthday,
    gender: b.gender as any,
    birthWeight: Number(b.birthWeight),
    birthHeight: Number(b.birthHeight),
    feedPreference: b.feedPreference as any,
    avatarColor: b.avatarColor || '#FF8FB1',
    createdAt: toTimestamp(b.createdAt),
  };
}

function transformEventFromApi(e: any): BabyEvent {
  return {
    id: e.id,
    babyId: e.babyId,
    type: e.type as any,
    timestamp: toTimestamp(e.timestamp),
    feedData: e.feedData,
    diaperData: e.diaperData,
    sleepData: e.sleepData,
    otherData: e.otherData,
    note: e.note,
  };
}

function transformGrowthFromApi(g: any): GrowthRecord {
  return {
    id: g.id,
    babyId: g.babyId,
    date: g.date,
    weight: Number(g.weight),
    height: g.height != null ? Number(g.height) : undefined,
    note: g.note,
  };
}

function transformSettingsFromApi(s: any): AppSettings {
  return {
    feedReminderInterval: Number(s.feedReminderInterval ?? 3),
    currentBabyId: s.currentBabyId ?? null,
  };
}

export class ApiStorageAdapter implements StorageAdapter {
  readonly name = 'api';

  // ===== Babies =====

  async listBabies(): Promise<Baby[]> {
    const list = await babiesApi.list();
    return list.map(transformBabyFromApi);
  }

  async getBaby(id: string): Promise<Baby | null> {
    try {
      const b = await babiesApi.get(id);
      return transformBabyFromApi(b);
    } catch (e: any) {
      if (e?.code === 404 || e?.statusCode === 404) return null;
      throw e;
    }
  }

  async createBaby(input: CreateBabyInput): Promise<Baby> {
    const payload: any = {
      nickname: input.nickname,
      birthday: input.birthday,
      gender: input.gender,
      birthWeight: input.birthWeight,
      birthHeight: input.birthHeight,
      feedPreference: input.feedPreference,
    };
    if (input.avatarColor) payload.avatarColor = input.avatarColor;
    const b = await babiesApi.create(payload);
    return transformBabyFromApi(b);
  }

  async updateBaby(id: string, input: UpdateBabyInput): Promise<Baby> {
    const b = await babiesApi.update(id, input as any);
    return transformBabyFromApi(b);
  }

  async deleteBaby(id: string): Promise<void> {
    await babiesApi.remove(id);
  }

  async setCurrentBaby(id: string): Promise<Baby> {
    const b = await babiesApi.setCurrent(id);
    return transformBabyFromApi(b);
  }

  // ===== Events =====

  async listEvents(options: ListEventsOptions = {}): Promise<BabyEvent[]> {
    const params: any = {};
    if (options.babyId) params.babyId = options.babyId;
    if (options.type) params.type = options.type;
    if (options.startAt != null) params.startAt = options.startAt;
    if (options.endAt != null) params.endAt = options.endAt;
    if (options.limit != null) params.limit = options.limit;
    const list = await eventsApi.list(params);
    return list.map(transformEventFromApi);
  }

  async getEvent(id: string): Promise<BabyEvent | null> {
    try {
      const e = await eventsApi.get(id);
      return transformEventFromApi(e);
    } catch (e: any) {
      if (e?.code === 404 || e?.statusCode === 404) return null;
      throw e;
    }
  }

  async createEvent(input: CreateEventInput): Promise<BabyEvent> {
    const payload: any = {
      babyId: input.babyId,
      type: input.type,
      timestamp: input.timestamp,
      feedData: input.feedData,
      diaperData: input.diaperData,
      sleepData: input.sleepData,
      otherData: input.otherData,
      note: input.note,
    };
    const e = await eventsApi.create(payload);
    return transformEventFromApi(e);
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<BabyEvent> {
    const e = await eventsApi.update(id, input as any);
    return transformEventFromApi(e);
  }

  async deleteEvent(id: string): Promise<void> {
    await eventsApi.remove(id);
  }

  // ===== Growth Records =====

  async listGrowthRecords(options: ListGrowthOptions = {}): Promise<GrowthRecord[]> {
    const params: any = {};
    if (options.babyId) params.babyId = options.babyId;
    if (options.startDate) params.startDate = options.startDate;
    if (options.endDate) params.endDate = options.endDate;
    const list = await growthRecordsApi.list(params);
    return list.map(transformGrowthFromApi);
  }

  async getGrowthRecord(id: string): Promise<GrowthRecord | null> {
    try {
      const g = await growthRecordsApi.get(id);
      return transformGrowthFromApi(g);
    } catch (e: any) {
      if (e?.code === 404 || e?.statusCode === 404) return null;
      throw e;
    }
  }

  async createGrowthRecord(input: CreateGrowthRecordInput): Promise<GrowthRecord> {
    const g = await growthRecordsApi.create(input as any);
    return transformGrowthFromApi(g);
  }

  async updateGrowthRecord(id: string, input: UpdateGrowthRecordInput): Promise<GrowthRecord> {
    const g = await growthRecordsApi.update(id, input as any);
    return transformGrowthFromApi(g);
  }

  async deleteGrowthRecord(id: string): Promise<void> {
    await growthRecordsApi.remove(id);
  }

  // ===== Settings =====

  async getSettings(): Promise<AppSettings> {
    const s = await settingsApi.get();
    return transformSettingsFromApi(s);
  }

  async updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
    const s = await settingsApi.update(input);
    return transformSettingsFromApi(s);
  }

  // ===== Batch =====

  async exportAll(): Promise<FullSnapshot> {
    const data = await syncApi.exportData();
    return {
      babies: data.babies.map(transformBabyFromApi),
      events: data.events.map(transformEventFromApi),
      growthRecords: data.growthRecords.map(transformGrowthFromApi),
      settings: transformSettingsFromApi(data.settings),
    };
  }

  async importAll(snapshot: FullSnapshot): Promise<{
    importedBabies: number;
    importedEvents: number;
    importedGrowthRecords: number;
    skippedConflicts: number;
  }> {
    const payload: any = {
      babies: snapshot.babies,
      events: snapshot.events,
      growthRecords: snapshot.growthRecords,
      settings: snapshot.settings,
    };
    const res = await syncApi.importData(payload);
    return {
      importedBabies: res.importedBabies,
      importedEvents: res.importedEvents,
      importedGrowthRecords: res.importedGrowthRecords,
      skippedConflicts: res.skippedConflicts,
    };
  }

  // ===== Health =====

  async isAvailable(): Promise<boolean> {
    try {
      await this.getSettings();
      return true;
    } catch {
      return false;
    }
  }
}
