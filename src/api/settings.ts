import { http } from './http';
import type { AppSettings } from '@/types';

export interface UpdateSettingsPayload {
  feedReminderInterval?: number;
  currentBabyId?: string | null;
}

export const settingsApi = {
  get(): Promise<AppSettings> {
    return http.get<AppSettings>('/settings');
  },

  update(payload: UpdateSettingsPayload): Promise<AppSettings> {
    return http.put<AppSettings>('/settings', payload);
  },
};
