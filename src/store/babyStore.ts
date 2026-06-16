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
import { generateId } from '@/utils/storage';
import { authService } from '@/services/auth.service';
import { networkService } from '@/services/network.service';
import { subscribeApi, ApiError } from '@/api';
import { storage } from '@/storage';

interface BabyStore {
  babies: Baby[];
  events: BabyEvent[];
  growthRecords: GrowthRecord[];
  settings: AppSettings;
  currentBaby: Baby | null;

  user: User | null;
  authStatus: AuthStatus;
  network: NetworkStatus;
  pendingSyncCount: number;
  isRefreshing: boolean;
  subscription?: {
    templateId?: string;
    subscribed: boolean;
    lastReminderSentAt?: number;
  };

  isInitializing: boolean;
  hasInitialized: boolean;
  initError?: string;

  initApp: () => Promise<void>;
  initStore: () => Promise<void>;

  login: () => Promise<{ user: User; isNewUser: boolean; hasLocalData: boolean; hasRemoteData: boolean }>;
  logout: () => Promise<void>;

  syncToCloud: () => Promise<number | null>;
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

  refreshFromCloud: () => Promise<void>;
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
  let netUnsub: (() => void) | null = null;

  const loadAllFromLocal = async () => {
    const [babies, events, growthRecords, settings] = await Promise.all([
      storage.listBabies(),
      storage.listEvents(),
      storage.listGrowthRecords(),
      storage.getSettings(),
    ]);
    const currentBaby = resolveCurrentBaby(babies, settings);
    return { babies, events, growthRecords, settings, currentBaby };
  };

  const refreshStateFromLocal = async () => {
    const snap = await loadAllFromLocal();
    set(snap);
    set({ pendingSyncCount: storage.getPendingCount() });
  };

  const ensureSubscriptions = () => {
    if (!authUnsub) {
      authUnsub = authService.subscribe((status, user) => {
        set({ authStatus: status, user });
        storage.setAuthStatus(status === 'authenticated');
        if (status === 'expired') {
          Taro.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
          });
        }
        if (status === 'authenticated') {
          get().refreshFromCloud().catch(() => {});
        }
      });
    }
    if (!netUnsub) {
      netUnsub = networkService.subscribe((network) => {
        set({ network });
        storage.setNetworkStatus(network.isOnline);
        if (network.isOnline && authService.isAuthenticated()) {
          set({ pendingSyncCount: storage.getPendingCount() });
        }
      });
    }
  };

  const hasAnyLocalData = (): boolean => {
    return (
      get().babies.length > 0 ||
      get().events.length > 0 ||
      get().growthRecords.length > 0
    );
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
    pendingSyncCount: 0,
    isRefreshing: false,
    subscription: { subscribed: false },

    isInitializing: false,
    hasInitialized: false,

    initStore: async () => {
      const snap = await loadAllFromLocal();
      set(snap);
      set({ pendingSyncCount: storage.getPendingCount() });
      console.log(
        '[BabyStore] Initialized with',
        snap.babies.length,
        'babies,',
        snap.events.length,
        'events'
      );
    },

    initApp: async () => {
      ensureSubscriptions();
      if (get().hasInitialized) return;

      set({ isInitializing: true, initError: undefined });
      try {
        networkService.init();
        const netStatus = networkService.getStatus();
        set({ network: netStatus });
        storage.setNetworkStatus(netStatus.isOnline);

        set({
          authStatus: authService.getAuthStatus(),
          user: authService.getUser(),
        });
        storage.setAuthStatus(authService.isAuthenticated());

        await get().initStore();

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

          get().refreshFromCloud().catch(() => {});
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

    refreshFromCloud: async () => {
      if (get().isRefreshing) return;
      if (!authService.isAuthenticated()) return;

      set({ isRefreshing: true });
      try {
        const result = await storage.refreshFromCloud(true);
        if (result) {
          await refreshStateFromLocal();
          console.log('[BabyStore] Refreshed from cloud:',
            result.babies.length, 'babies,',
            result.events.length, 'events'
          );
        }
      } catch (e) {
        console.warn('[BabyStore] refreshFromCloud failed:', e);
      } finally {
        set({ isRefreshing: false });
      }
    },

    login: async () => {
      ensureSubscriptions();
      const hasLocalData = hasAnyLocalData();
      const res = await authService.login();

      storage.setAuthStatus(true);

      let hasRemoteData = false;
      try {
        const remote = await storage.refreshFromCloud(true);
        if (remote) {
          hasRemoteData = !!(remote.babies.length > 0 || remote.events.length > 0);
          await refreshStateFromLocal();
        }
      } catch (e) {
        console.warn('[BabyStore] login pull failed:', e);
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

      set({ pendingSyncCount: storage.getPendingCount() });

      return { user: res.user, isNewUser: res.isNewUser, hasLocalData, hasRemoteData };
    },

    logout: async () => {
      authService.logout();
      storage.setAuthStatus(false);
      set({
        user: null,
        authStatus: 'guest',
        subscription: { subscribed: false },
        pendingSyncCount: 0,
      });
      Taro.showToast({ title: '已退出登录', icon: 'success' });
    },

    syncToCloud: async () => {
      if (!authService.isAuthenticated()) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return null;
      }
      if (!get().network.isOnline) {
        Taro.showToast({ title: '当前离线，请检查网络', icon: 'none' });
        return null;
      }
      const count = await storage.flushPendingQueue();
      set({ pendingSyncCount: storage.getPendingCount() });
      if (count > 0) {
        Taro.showToast({ title: `已同步 ${count} 条`, icon: 'success' });
      } else {
        Taro.showToast({ title: '没有待同步数据', icon: 'none' });
      }
      return count;
    },

    syncFromCloud: async (_mode: 'merge' | 'overwrite' = 'merge') => {
      if (!authService.isAuthenticated()) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return false;
      }
      const remote = await storage.refreshFromCloud(true);
      if (!remote) return false;
      await refreshStateFromLocal();
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
      const settings = { ...get().settings, currentBabyId: baby.id };

      set({ babies, currentBaby: baby, settings });

      storage.createBaby({
        id: baby.id,
        ...data,
        avatarColor: baby.avatarColor,
        createdAt: baby.createdAt,
      }).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] createBaby adapter failed:', e);
      });

      storage.setCurrentBaby(baby.id).catch(() => {});

      console.log('[BabyStore] Added baby:', baby.nickname);
      return baby;
    },

    updateBaby: (id, data) => {
      const babies = get().babies.map((b) =>
        b.id === id ? { ...b, ...data } : b
      );
      const currentBaby =
        get().currentBaby?.id === id
          ? babies.find((b) => b.id === id) || null
          : get().currentBaby;

      set({ babies, currentBaby });

      storage.updateBaby(id, data as any).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] updateBaby adapter failed:', e);
      });
    },

    deleteBaby: (id) => {
      const babies = get().babies.filter((b) => b.id !== id);
      const events = get().events.filter((e) => e.babyId !== id);
      const growthRecords = get().growthRecords.filter((g) => g.babyId !== id);

      let currentBaby = get().currentBaby;
      let settings = get().settings;
      if (get().currentBaby?.id === id) {
        currentBaby = babies[0] || null;
        settings = { ...settings, currentBabyId: currentBaby?.id || null };
      }

      set({ babies, events, growthRecords, currentBaby, settings });

      storage.deleteBaby(id).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] deleteBaby adapter failed:', e);
      });
    },

    setCurrentBaby: (id) => {
      const baby = get().babies.find((b) => b.id === id) || null;
      const settings = { ...get().settings, currentBabyId: id };
      set({ currentBaby: baby, settings });

      storage.setCurrentBaby(id).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] setCurrentBaby adapter failed:', e);
      });
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
      set({ events });

      storage.createEvent({
        id: event.id,
        babyId: currentBaby.id,
        ...data,
      }).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] createEvent adapter failed:', e);
      });

      console.log('[BabyStore] Added event:', event.type);
      return event;
    },

    updateEvent: (id, data) => {
      const events = get().events.map((e) =>
        e.id === id ? { ...e, ...data } : e
      );
      set({ events });

      storage.updateEvent(id, data as any).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] updateEvent adapter failed:', e);
      });
    },

    deleteEvent: (id) => {
      const events = get().events.filter((e) => e.id !== id);
      set({ events });

      storage.deleteEvent(id).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] deleteEvent adapter failed:', e);
      });
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
      set({ growthRecords });

      storage.createGrowthRecord({
        id: record.id,
        babyId: currentBaby.id,
        ...data,
      }).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] createGrowthRecord adapter failed:', e);
      });

      return record;
    },

    deleteGrowthRecord: (id) => {
      const growthRecords = get().growthRecords.filter((g) => g.id !== id);
      set({ growthRecords });

      storage.deleteGrowthRecord(id).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] deleteGrowthRecord adapter failed:', e);
      });
    },

    updateSettings: (data) => {
      const settings = { ...get().settings, ...data };
      set({ settings });

      storage.updateSettings(data).then(() => {
        set({ pendingSyncCount: storage.getPendingCount() });
      }).catch((e) => {
        console.warn('[BabyStore] updateSettings adapter failed:', e);
      });
    },

    clearAllData: () => {
      const defaultSettings: AppSettings = {
        feedReminderInterval: 3,
        currentBabyId: null,
      };
      set({
        babies: [],
        events: [],
        growthRecords: [],
        settings: defaultSettings,
        currentBaby: null,
      });

      Promise.all([
        storage.local ? null : null,
      ]).catch(() => {});

      const clearLocal = async () => {
        const all = await storage.listEvents();
        for (const e of all) {
          await storage.deleteEvent(e.id);
        }
        const babies = await storage.listBabies();
        for (const b of babies) {
          await storage.deleteBaby(b.id);
        }
        const growth = await storage.listGrowthRecords();
        for (const g of growth) {
          await storage.deleteGrowthRecord(g.id);
        }
        set({ pendingSyncCount: storage.getPendingCount() });
      };
      clearLocal().catch(console.error);

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
