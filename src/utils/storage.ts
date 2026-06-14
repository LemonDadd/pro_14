import Taro from '@tarojs/taro';
import type { Baby, BabyEvent, GrowthRecord, AppSettings } from '@/types';

const STORAGE_KEYS = {
  BABIES: 'babycare_babies',
  EVENTS: 'babycare_events',
  GROWTH: 'babycare_growth',
  SETTINGS: 'babycare_settings'
} as const;

export function getBabies(): Baby[] {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.BABIES);
    return data ? (JSON.parse(data) as Baby[]) : [];
  } catch {
    return [];
  }
}

export function saveBabies(babies: Baby[]): void {
  Taro.setStorageSync(STORAGE_KEYS.BABIES, JSON.stringify(babies));
}

export function getEvents(): BabyEvent[] {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.EVENTS);
    return data ? (JSON.parse(data) as BabyEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: BabyEvent[]): void {
  Taro.setStorageSync(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

export function getGrowthRecords(): GrowthRecord[] {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.GROWTH);
    return data ? (JSON.parse(data) as GrowthRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveGrowthRecords(records: GrowthRecord[]): void {
  Taro.setStorageSync(STORAGE_KEYS.GROWTH, JSON.stringify(records));
}

export function getSettings(): AppSettings {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.SETTINGS);
    if (data) {
      return JSON.parse(data) as AppSettings;
    }
  } catch {
    // ignore
  }
  return {
    feedReminderInterval: 3,
    currentBabyId: null
  };
}

export function saveSettings(settings: AppSettings): void {
  Taro.setStorageSync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
