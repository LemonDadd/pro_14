import { http } from './http';
import type { GrowthRecord } from '@/types';

export interface CreateGrowthRecordPayload {
  babyId: string;
  date: string;
  weight: number;
  height?: number;
  note?: string;
}

export const growthRecordsApi = {
  list(params?: { babyId?: string; startDate?: string; endDate?: string }): Promise<GrowthRecord[]> {
    return http.get<GrowthRecord[]>('/growth-records', params);
  },

  get(id: string): Promise<GrowthRecord> {
    return http.get<GrowthRecord>(`/growth-records/${id}`);
  },

  create(payload: CreateGrowthRecordPayload): Promise<GrowthRecord> {
    return http.post<GrowthRecord>('/growth-records', payload);
  },

  update(id: string, payload: Partial<CreateGrowthRecordPayload>): Promise<GrowthRecord> {
    return http.put<GrowthRecord>(`/growth-records/${id}`, payload);
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/growth-records/${id}`);
  },
};
