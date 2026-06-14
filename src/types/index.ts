export type BabyGender = 'boy' | 'girl';

export type FeedPreference = 'breast' | 'formula' | 'mixed';

export interface Baby {
  id: string;
  nickname: string;
  birthday: string;
  gender: BabyGender;
  birthWeight: number;
  birthHeight: number;
  feedPreference: FeedPreference;
  avatarColor: string;
  createdAt: number;
}

export type EventType = 'feed' | 'diaper' | 'sleep' | 'other';

export type FeedSide = 'L' | 'R' | 'bottle';

export type DiaperType = 'wet' | 'dirty' | 'both';

export interface FeedData {
  amountMl?: number;
  side?: FeedSide;
  durationSec?: number;
}

export interface DiaperData {
  type: DiaperType;
  colorNote?: string;
}

export interface SleepData {
  durationSec: number;
}

export interface OtherData {
  temperature?: number;
  medication?: string;
  note?: string;
}

export interface BabyEvent {
  id: string;
  babyId: string;
  type: EventType;
  timestamp: number;
  feedData?: FeedData;
  diaperData?: DiaperData;
  sleepData?: SleepData;
  otherData?: OtherData;
  note?: string;
}

export interface GrowthRecord {
  id: string;
  babyId: string;
  date: string;
  weight: number;
  height?: number;
  note?: string;
}

export interface AppSettings {
  feedReminderInterval: number;
  currentBabyId: string | null;
}
