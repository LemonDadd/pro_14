import { http } from './http';

export interface Subscription {
  id: string;
  userId: string;
  templateId: string;
  subscribed: boolean;
  lastReminderSentAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SaveTemplateIdPayload {
  templateId: string;
  subscribed?: boolean;
}

export interface SendReminderResponse {
  scanned: number;
  sent: number;
  timestamp: number;
}

export const subscribeApi = {
  getSubscription(): Promise<Subscription> {
    return http.get<Subscription>('/subscribe');
  },

  saveTemplateId(payload: SaveTemplateIdPayload): Promise<Subscription> {
    return http.post<Subscription>('/subscribe/save-template-id', payload);
  },

  sendReminder(): Promise<SendReminderResponse> {
    return http.post<SendReminderResponse>('/subscribe/send-reminder');
  },
};
