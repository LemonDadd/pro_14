import { create } from 'zustand';
import Taro from '@tarojs/taro';
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
  OtherData,
  User,
  AuthStatus,
  NetworkStatus,
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
import { authService } from '@/services/auth.service';
import { syncService, SyncState } from '@/services/sync.service';
import { networkService } from '@/services/network.service';
import { subscribeApi, ApiError } from '@/api';

interface BabyStore {
  babies: Baby[];
  events: BabyEvent[];
  growthRecords: GrowthRecord[];
  settings: AppSettings;
  currentBaby: Baby | null;

  user: User | null;
  authStatus: AuthStatus;
  network: NetworkStatus;
  syncState: SyncState;
  subscription?: {
    templateId?: string;
    subscribed: boolean;
    lastReminderSentAt?: number;
  };

  isInitializing: boolean;
  hasInitialized: boolean;
  initError?: string;

  initApp: () => Promise<void>;
  initStore: () => void;

  login: () => Promise<{ user: User; isNewUser: boolean; hasLocalData: boolean; hasRemoteData: boolean }>;
  logout: () => Promise<void>;

  syncToCloud: () => Promise<{ imported: number; skipped: number } | null>;
  syncFromCloud: (mode?: 'merge' | 'overwrite') => Promise<boolean>;

  saveTemplateId: (templateId: string, subscribed?: boolean) => Promise<void>;
  triggerReminder: () => Promise<{ scanned: number; sent: number } | null>;

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
  '#F8B500',
];

function resolveCurrentBaby(babies: Baby[], settings: AppSettings): Baby | null {
  let currentBaby: Baby | null = null;
  if (settings.currentBabyId) {
    currentBaby = babies.find((b) => b.id === settings.currentBabyId) || null;
  }
  if (!currentBaby && babies.length > 0) {
    currentBaby = babies[0];
  }
  return currentBaby;
}

export const useBabyStore = create<BabyStore>((set, get) => {
  let authUnsub: (() => void) | null = null;
  let syncUnsub: (() => void) | null = null;
  let netUnsub: (() => void) | null = null;

  const markDirty = () => {
    const { babies, events, growthRecords, settings } = get();
    syncService.markDirty({ babies, events, growthRecords, settings });
  };

  const hasAnyLocalData = (): boolean => {
    return (
      getBabies().length > 0 ||
      getEvents().length > 0 ||
      getGrowthRecords().length > 0
    );
  };

  const applySnapshot = (snap: {
    babies: Baby[];
    events: BabyEvent[];
    growthRecords: GrowthRecord[];
    settings: AppSettings;
  }) => {
    saveBabies(snap.babies);
    saveEvents(snap.events);
    saveGrowthRecords(snap.growthRecords);
    saveSettings(snap.settings);

    const currentBaby = resolveCurrentBaby(snap.babies, snap.settings);
    set({
      babies: snap.babies,
      events: snap.events,
      growthRecords: snap.growthRecords,
      settings: snap.settings,
      currentBaby,
    });
    syncService.captureSnapshot(snap);
  };

  const ensureSubscriptions = () => {
    if (!authUnsub) {
      authUnsub = authService.subscribe((status, user) => {
        set({ authStatus: status, user });
        if (status === 'expired') {
          Taro.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
          });
        }
      });
    }
    if (!syncUnsub) {
      syncUnsub = syncService.subscribe((syncState) => {
        set({ syncState });
      });
    }
    if (!netUnsub) {
      netUnsub = networkService.subscribe((network) => {
        set({ network });
      });
    }
  };

  return {
    babies: [],
    events: [],
    growthRecords: [],
    settings: { feedReminderInterval: 3, currentBabyId: null },
    currentBaby: null,

    user: null,
    authStatus: 'guest',
    network: { isOnline: true },
    syncState: syncService.getState(),
    subscription: { subscribed: false },

    isInitializing: false,
    hasInitialized: false,

    initStore: () => {
      const babies = getBabies();
      const events = getEvents();
      const growthRecords = getGrowthRecords();
      const settings = getSettings();
      const currentBaby = resolveCurrentBaby(babies, settings);

      set({ babies, events, growthRecords, settings, currentBaby });
      syncService.captureSnapshot({ babies, events, growthRecords, settings });
      console.log(
        '[BabyStore] Initialized with',
        babies.length,
        'babies,',
        events.length,
        'events'
      );
    },

    initApp: async () => {
      ensureSubscriptions();
      if (get().hasInitialized) return;

      set({ isInitializing: true, initError: undefined });
      try {
        networkService.init();
        set({ network: networkService.getStatus() });
        set({
          authStatus: authService.getAuthStatus(),
          user: authService.getUser(),
        });

        get().initStore();

        if (authService.isAuthenticated()) {
          await authService.verifyOrRefresh().catch(() => null);
          try {
            const sub = await subscribeApi.getSubscription();
            set({
              subscription: {
                templateId: sub.templateId,
                subscribed: sub.subscribed,
                lastReminderSentAt: sub.lastReminderSentAt,
              },
            });
          } catch (e) {
            // ignore - might not have subscribed yet
          }
        }

        set({ hasInitialized: true });
        console.log('[BabyStore] App initialized');
      } catch (e: any) {
        set({ initError: e.message });
        console.error('[BabyStore] initApp failed:', e);
      } finally {
        set({ isInitializing: false });
      }
    },

    login: async () => {
      ensureSubscriptions();
      const hasLocalData = hasAnyLocalData();
      const res = await authService.login();

      let hasRemoteData = false;
      try {
        const remote = await syncService.pullFromCloud();
        hasRemoteData = !!(
          remote &&
          (remote.babies.length > 0 || remote.events.length > 0)
        );
      } catch (e) {
        // ignore
      }

      try {
        const sub = await subscribeApi.getSubscription();
        set({
          subscription: {
            templateId: sub.templateId,
            subscribed: sub.subscribed,
            lastReminderSentAt: sub.lastReminderSentAt,
          },
        });
      } catch (e) {
        // ignore
      }

      return { user: res.user, isNewUser: res.isNewUser, hasLocalData, hasRemoteData };
    },

    logout: async () => {
      authService.logout();
      set({
        user: null,
        authStatus: 'guest',
        subscription: { subscribed: false },
        syncState: { status: 'idle', pendingCount: 0 },
      });
      Taro.showToast({ title: '已退出登录', icon: 'success' });
    },

    syncToCloud: async () => {
      if (!authService.isAuthenticated()) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return null;
      }
      markDirty();
      return syncService.pushToCloud();
    },

    syncFromCloud: async (mode: 'merge' | 'overwrite' = 'merge') => {
      if (!authService.isAuthenticated()) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return false;
      }
      const remote = await syncService.pullFromCloud();
      if (!remote) return false;

      if (mode === 'overwrite') {
        applySnapshot(remote);
        return true;
      }

      const { babies, events, growthRecords, settings } = get();
      const merged = syncService.mergeSnapshots(
        { babies, events, growthRecords, settings },
        remote,
        'remoteFirst'
      );
      applySnapshot(merged);
      return true;
    },

    saveTemplateId: async (templateId: string, subscribed = true) => {
      if (!authService.isAuthenticated()) {
        throw new ApiError('请先登录', 401);
      }
      const res = await subscribeApi.saveTemplateId({ templateId, subscribed });
      set({
        subscription: {
          templateId: res.templateId,
          subscribed: res.subscribed,
          lastReminderSentAt: res.lastReminderSentAt,
        },
      });
    },

    triggerReminder: async () => {
      if (!authService.isAuthenticated()) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return null;
      }
      return subscribeApi.sendReminder();
    },

    addBaby: (data) => {
      const baby: Baby = {
        id: generateId(),
        ...data,
        avatarColor: AVATAR_COLORS[get().babies.length % AVATAR_COLORS.length],
        createdAt: Date.now(),
      };
      const babies = [...get().babies, baby];
      saveBabies(babies);

      const settings = { ...get().settings, currentBabyId: baby.id };
      saveSettings(settings);

      set({ babies, currentBaby: baby, settings });
      markDirty();
      console.log('[BabyStore] Added baby:', baby.nickname);
      return baby;
    },

    updateBaby: (id, data) => {
      const babies = get().babies.map((b) =>
        b.id === id ? { ...b, ...data } : b
      );
      saveBabies(babies);
      const currentBaby =
        get().currentBaby?.id === id
          ? babies.find((b) => b.id === id) || null
          : get().currentBaby;
      set({ babies, currentBaby });
      markDirty();
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
      markDirty();
    },

    setCurrentBaby: (id) => {
      const baby = get().babies.find((b) => b.id === id) || null;
      const settings = { ...get().settings, currentBabyId: id };
      saveSettings(settings);
      set({ currentBaby: baby, settings });
      markDirty();
    },

    addEvent: (data) => {
      const currentBaby = get().currentBaby;
      if (!currentBaby) {
        throw new Error('No current baby selected');
      }
      const event: BabyEvent = {
        id: generateId(),
        babyId: currentBaby.id,
        ...data,
      };
      const events = [event, ...get().events];
      saveEvents(events);
      set({ events });
      markDirty();
      console.log('[BabyStore] Added event:', event.type);
      return event;
    },

    updateEvent: (id, data) => {
      const events = get().events.map((e) =>
        e.id === id ? { ...e, ...data } : e
      );
      saveEvents(events);
      set({ events });
      markDirty();
    },

    deleteEvent: (id) => {
      const events = get().events.filter((e) => e.id !== id);
      saveEvents(events);
      set({ events });
      markDirty();
    },

    addGrowthRecord: (data) => {
      const currentBaby = get().currentBaby;
      if (!currentBaby) {
        throw new Error('No current baby selected');
      }
      const record: GrowthRecord = {
        id: generateId(),
        babyId: currentBaby.id,
        ...data,
      };
      const growthRecords = [...get().growthRecords, record];
      saveGrowthRecords(growthRecords);
      set({ growthRecords });
      markDirty();
      return record;
    },

    deleteGrowthRecord: (id) => {
      const growthRecords = get().growthRecords.filter((g) => g.id !== id);
      saveGrowthRecords(growthRecords);
      set({ growthRecords });
      markDirty();
    },

    updateSettings: (data) => {
      const settings = { ...get().settings, ...data };
      saveSettings(settings);
      set({ settings });
      markDirty();
    },

    clearAllData: () => {
      saveBabies([]);
      saveEvents([]);
      saveGrowthRecords([]);
      const defaultSettings: AppSettings = {
        feedReminderInterval: 3,
        currentBabyId: null,
      };
      saveSettings(defaultSettings);
      set({
        babies: [],
        events: [],
        growthRecords: [],
        settings: defaultSettings,
        currentBaby: null,
      });
      markDirty();
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
      return (
        get()
          .events.filter(
            (e) => e.babyId === currentBaby.id && e.type === 'feed'
          )
          .sort((a, b) => b.timestamp - a.timestamp)[0] || null
      );
    },

    getBabyGrowthRecords: () => {
      const currentBaby = get().currentBaby;
      if (!currentBaby) return [];
      return get()
        .growthRecords.filter((g) => g.babyId === currentBaby.id)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    },
  };
});
