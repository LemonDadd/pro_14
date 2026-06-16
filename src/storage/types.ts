import type {
  Baby,
  BabyEvent,
  GrowthRecord,
  AppSettings,
  BabyGender,
  FeedPreference,
  EventType,
} from '@/types';

export interface CreateBabyInput {
  id?: string;
  nickname: string;
  birthday: string;
  gender: BabyGender;
  birthWeight: number;
  birthHeight: number;
  feedPreference: FeedPreference;
  avatarColor?: string;
  createdAt?: number;
}

export interface UpdateBabyInput extends Partial<CreateBabyInput> {}

export interface CreateEventInput {
  id?: string;
  babyId: string;
  type: EventType;
  timestamp: number;
  feedData?: any;
  diaperData?: any;
  sleepData?: any;
  otherData?: any;
  note?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

export interface CreateGrowthRecordInput {
  id?: string;
  babyId: string;
  date: string;
  weight: number;
  height?: number;
  note?: string;
}

export interface UpdateGrowthRecordInput extends Partial<CreateGrowthRecordInput> {}

export interface UpdateSettingsInput {
  feedReminderInterval?: number;
  currentBabyId?: string | null;
}

export interface ListEventsOptions {
  babyId?: string;
  type?: EventType;
  startAt?: number;
  endAt?: number;
  limit?: number;
}

export interface ListGrowthOptions {
  babyId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FullSnapshot {
  babies: Baby[];
  events: BabyEvent[];
  growthRecords: GrowthRecord[];
  settings: AppSettings;
}

export interface StorageAdapter {
  readonly name: string;

  // ===== Babies =====
  listBabies(): Promise<Baby[]>;
  getBaby(id: string): Promise<Baby | null>;
  createBaby(input: CreateBabyInput): Promise<Baby>;
  updateBaby(id: string, input: UpdateBabyInput): Promise<Baby>;
  deleteBaby(id: string): Promise<void>;
  setCurrentBaby(id: string): Promise<Baby>;

  // ===== Events =====
  listEvents(options?: ListEventsOptions): Promise<BabyEvent[]>;
  getEvent(id: string): Promise<BabyEvent | null>;
  createEvent(input: CreateEventInput): Promise<BabyEvent>;
  updateEvent(id: string, input: UpdateEventInput): Promise<BabyEvent>;
  deleteEvent(id: string): Promise<void>;

  // ===== Growth Records =====
  listGrowthRecords(options?: ListGrowthOptions): Promise<GrowthRecord[]>;
  getGrowthRecord(id: string): Promise<GrowthRecord | null>;
  createGrowthRecord(input: CreateGrowthRecordInput): Promise<GrowthRecord>;
  updateGrowthRecord(id: string, input: UpdateGrowthRecordInput): Promise<GrowthRecord>;
  deleteGrowthRecord(id: string): Promise<void>;

  // ===== Settings =====
  getSettings(): Promise<AppSettings>;
  updateSettings(input: UpdateSettingsInput): Promise<AppSettings>;

  // ===== Batch =====
  exportAll(): Promise<FullSnapshot>;
  importAll(snapshot: FullSnapshot): Promise<{
    importedBabies: number;
    importedEvents: number;
    importedGrowthRecords: number;
    skippedConflicts: number;
  }>;

  // ===== Health =====
  isAvailable(): Promise<boolean>;
}
