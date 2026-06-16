import { http } from './http';
import type { Baby, BabyGender, FeedPreference } from '@/types';

export interface CreateBabyPayload {
  nickname: string;
  birthday: string;
  gender: BabyGender;
  birthWeight: number;
  birthHeight: number;
  feedPreference: FeedPreference;
}

export const babiesApi = {
  list(): Promise<Baby[]> {
    return http.get<Baby[]>('/babies');
  },

  get(id: string): Promise<Baby> {
    return http.get<Baby>(`/babies/${id}`);
  },

  create(payload: CreateBabyPayload): Promise<Baby> {
    return http.post<Baby>('/babies', payload);
  },

  update(id: string, payload: Partial<CreateBabyPayload>): Promise<Baby> {
    return http.put<Baby>(`/babies/${id}`, payload);
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/babies/${id}`);
  },

  setCurrent(id: string): Promise<Baby> {
    return http.post<Baby>(`/babies/${id}/set-current`);
  },
};
