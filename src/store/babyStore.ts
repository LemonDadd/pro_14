import { create } from 'zustand';
import type {
  Baby,
  BabyEvent,
  GrowthRecord,
  AppSettings,
  BabyGender,
  FeedPreference,
  EventType,
  FeedData,
  DiaperData,
  SleepData,
  OtherData
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
  generateId
} from '@/utils/storage';

interface BabyStore {
  babies: Baby[];
  events: BabyEvent[];
  growthRecords: GrowthRecord[];
  settings: AppSettings;
  currentBaby: Baby | null;

  initStore: () => void;

  addBaby: (data: {
    nickname: string;
    birthday: string;
    gender: BabyGender;
    birthWeight: number;
    birthHeight: number;
    feedPreference: FeedPreference;
  }) => Baby;

  updateBaby: (id: string, data: Partial<Baby>) => void;
  deleteBaby: (id: string) => void;
  setCurrentBaby: (id: string) => void;

  addEvent: (data: {
    type: EventType;
    timestamp: number;
    feedData?: FeedData;
    diaperData?: DiaperData;
    sleepData?: SleepData;
    otherData?: OtherData;
    note?: string;
  }) => BabyEvent;

  updateEvent: (id: string, data: Partial<BabyEvent>) => void;
  deleteEvent: (id: string) => void;

  addGrowthRecord: (data: {
    date: string;
    weight: number;
    height?: number;
    note?: string;
  }) => GrowthRecord;

  deleteGrowthRecord: (id: string) => void;

  updateSettings: (data: Partial<AppSettings>) => void;
  clearAllData: () => void;

  getTodayEvents: () => BabyEvent[];
  getWeekEvents: () => BabyEvent[];
  getLastFeedEvent: () => BabyEvent | null;
  getBabyGrowthRecords: () => GrowthRecord[];
}

const AVATAR_COLORS = [
  '#FF8FB1',
  '#7BC8FF',
  '#A8E6CF',
  '#FFD93D',
  '#C39BD3',
  '#F8B500'
];

export const useBabyStore = create<BabyStore>((set, get) => ({
  babies: [],
  events: [],
  growthRecords: [],
  settings: {
    feedReminderInterval: 3,
    currentBabyId: null
  },
  currentBaby: null,

  initStore: () => {
    const babies = getBabies();
    const events = getEvents();
    const growthRecords = getGrowthRecords();
    const settings = getSettings();

    let currentBaby: Baby | null = null;
    if (settings.currentBabyId) {
      currentBaby = babies.find((b) => b.id === settings.currentBabyId) || null;
    }
    if (!currentBaby && babies.length > 0) {
      currentBaby = babies[0];
    }

    set({ babies, events, growthRecords, settings, currentBaby });
    console.log('[BabyStore] Initialized with', babies.length, 'babies,', events.length, 'events');
  },

  addBaby: (data) => {
    const baby: Baby = {
      id: generateId(),
      ...data,
      avatarColor: AVATAR_COLORS[get().babies.length % AVATAR_COLORS.length],
      createdAt: Date.now()
    };
    const babies = [...get().babies, baby];
    saveBabies(babies);

    const settings = { ...get().settings, currentBabyId: baby.id };
    saveSettings(settings);

    set({ babies, currentBaby: baby, settings });
    console.log('[BabyStore] Added baby:', baby.nickname);
    return baby;
  },

  updateBaby: (id, data) => {
    const babies = get().babies.map((b) => (b.id === id ? { ...b, ...data } : b));
    saveBabies(babies);
    const currentBaby = get().currentBaby?.id === id
      ? babies.find((b) => b.id === id) || null
      : get().currentBaby;
    set({ babies, currentBaby });
  },

  deleteBaby: (id) => {
    const babies = get().babies.filter((b) => b.id !== id);
    const events = get().events.filter((e) => e.babyId !== id);
    const growthRecords = get().growthRecords.filter((g) => g.babyId !== id);
    saveBabies(babies);
    saveEvents(events);
    saveGrowthRecords(growthRecords);

    let currentBaby = get().currentBaby;
    let settings = get().settings;
    if (get().currentBaby?.id === id) {
      currentBaby = babies[0] || null;
      settings = { ...settings, currentBabyId: currentBaby?.id || null };
      saveSettings(settings);
    }

    set({ babies, events, growthRecords, currentBaby, settings });
  },

  setCurrentBaby: (id) => {
    const baby = get().babies.find((b) => b.id === id) || null;
    const settings = { ...get().settings, currentBabyId: id };
    saveSettings(settings);
    set({ currentBaby: baby, settings });
  },

  addEvent: (data) => {
    const currentBaby = get().currentBaby;
    if (!currentBaby) {
      throw new Error('No current baby selected');
    }
    const event: BabyEvent = {
      id: generateId(),
      babyId: currentBaby.id,
      ...data
    };
    const events = [event, ...get().events];
    saveEvents(events);
    set({ events });
    console.log('[BabyStore] Added event:', event.type);
    return event;
  },

  updateEvent: (id, data) => {
    const events = get().events.map((e) => (e.id === id ? { ...e, ...data } : e));
    saveEvents(events);
    set({ events });
  },

  deleteEvent: (id) => {
    const events = get().events.filter((e) => e.id !== id);
    saveEvents(events);
    set({ events });
  },

  addGrowthRecord: (data) => {
    const currentBaby = get().currentBaby;
    if (!currentBaby) {
      throw new Error('No current baby selected');
    }
    const record: GrowthRecord = {
      id: generateId(),
      babyId: currentBaby.id,
      ...data
    };
    const growthRecords = [...get().growthRecords, record];
    saveGrowthRecords(growthRecords);
    set({ growthRecords });
    return record;
  },

  deleteGrowthRecord: (id) => {
    const growthRecords = get().growthRecords.filter((g) => g.id !== id);
    saveGrowthRecords(growthRecords);
    set({ growthRecords });
  },

  updateSettings: (data) => {
    const settings = { ...get().settings, ...data };
    saveSettings(settings);
    set({ settings });
  },

  clearAllData: () => {
    saveBabies([]);
    saveEvents([]);
    saveGrowthRecords([]);
    const defaultSettings: AppSettings = {
      feedReminderInterval: 3,
      currentBabyId: null
    };
    saveSettings(defaultSettings);
    set({
      babies: [],
      events: [],
      growthRecords: [],
      settings: defaultSettings,
      currentBaby: null
    });
    console.log('[BabyStore] All data cleared');
  },

  getTodayEvents: () => {
    const currentBaby = get().currentBaby;
    if (!currentBaby) return [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return get()
      .events.filter(
        (e) => e.babyId === currentBaby.id && e.timestamp >= start.getTime()
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  getWeekEvents: () => {
    const currentBaby = get().currentBaby;
    if (!currentBaby) return [];
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return get()
      .events.filter(
        (e) => e.babyId === currentBaby.id && e.timestamp >= start.getTime()
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  getLastFeedEvent: () => {
    const currentBaby = get().currentBaby;
    if (!currentBaby) return null;
    return get()
      .events.filter((e) => e.babyId === currentBaby.id && e.type === 'feed')
      .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
  },

  getBabyGrowthRecords: () => {
    const currentBaby = get().currentBaby;
    if (!currentBaby) return [];
    return get()
      .growthRecords.filter((g) => g.babyId === currentBaby.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}));
