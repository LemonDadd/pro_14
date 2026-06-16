import { http } from './http';
import type { User } from '@/types';

export interface WechatLoginResponse {
  token: string;
  user: User;
  isNewUser: boolean;
}

export const authApi = {
  wechatLogin(code?: string): Promise<WechatLoginResponse> {
    const finalCode = code || `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return http.post<WechatLoginResponse>('/auth/wechat-login', { code: finalCode }, false);
  },

  getMe(): Promise<User> {
    return http.get<User>('/auth/me');
  },
};
