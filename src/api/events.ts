import { http } from './http';
import type { BabyEvent, EventType, FeedData, DiaperData, SleepData, OtherData } from '@/types';

export interface CreateEventPayload {
  babyId: string;
  type: EventType;
  timestamp: number;
  feedData?: FeedData;
  diaperData?: DiaperData;
  sleepData?: SleepData;
  otherData?: OtherData;
  note?: string;
}

export interface EventSummaryItem {
  type: EventType;
  count: number;
  feedTotalMl: number;
  sleepTotalMinutes: number;
}

export interface TodaySummaryResponse {
  date: string;
  summaries: EventSummaryItem[];
  lastFeedAt?: number;
}

export interface WeekSummaryResponse {
  startDate: string;
  endDate: string;
  daily: Array<{
    date: string;
    summaries: EventSummaryItem[];
  }>;
}

export const eventsApi = {
  list(params?: { babyId?: string; type?: EventType; startAt?: number; endAt?: number; limit?: number }): Promise<BabyEvent[]> {
    return http.get<BabyEvent[]>('/events', params);
  },

  get(id: string): Promise<BabyEvent> {
    return http.get<BabyEvent>(`/events/${id}`);
  },

  create(payload: CreateEventPayload): Promise<BabyEvent> {
    return http.post<BabyEvent>('/events', payload);
  },

  update(id: string, payload: Partial<CreateEventPayload>): Promise<BabyEvent> {
    return http.put<BabyEvent>(`/events/${id}`, payload);
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/events/${id}`);
  },

  summaryToday(babyId?: string): Promise<TodaySummaryResponse> {
    return http.get<TodaySummaryResponse>('/events/summary/today', babyId ? { babyId } : {});
  },

  summaryWeek(babyId?: string): Promise<WeekSummaryResponse> {
    return http.get<WeekSummaryResponse>('/events/summary/week', babyId ? { babyId } : {});
  },
};
