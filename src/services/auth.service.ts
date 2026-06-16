import Taro from '@tarojs/taro';
import { authApi, setToken, clearToken, getToken } from '@/api';
import type { User, AuthStatus } from '@/types';

const USER_KEY = 'babycare_user';
const AUTH_STATUS_KEY = 'babycare_auth_status';

class AuthService {
  private listeners: Array<(status: AuthStatus, user: User | null) => void> = [];

  getAuthStatus(): AuthStatus {
    try {
      return (Taro.getStorageSync(AUTH_STATUS_KEY) as AuthStatus) || 'guest';
    } catch {
      return 'guest';
    }
  }

  private saveAuthStatus(status: AuthStatus) {
    Taro.setStorageSync(AUTH_STATUS_KEY, status);
    this.notifyListeners();
  }

  getUser(): User | null {
    try {
      const data = Taro.getStorageSync(USER_KEY);
      return data ? (JSON.parse(data) as User) : null;
    } catch {
      return null;
    }
  }

  private saveUser(user: User | null) {
    if (user) {
      Taro.setStorageSync(USER_KEY, JSON.stringify(user));
    } else {
      Taro.removeStorageSync(USER_KEY);
    }
    this.notifyListeners();
  }

  subscribe(listener: (status: AuthStatus, user: User | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const status = this.getAuthStatus();
    const user = this.getUser();
    this.listeners.forEach((l) => l(status, user));
  }

  async login(): Promise<{ user: User; isNewUser: boolean }> {
    this.saveAuthStatus('checking');

    try {
      let code: string | undefined;
      try {
        const loginRes = await Taro.login();
        code = loginRes.code;
      } catch (e) {
        console.warn('[Auth] Taro.login failed, use dev mode code');
      }

      const res = await authApi.wechatLogin(code);
      setToken(res.token);
      this.saveUser(res.user);
      this.saveAuthStatus('authenticated');

      console.log('[Auth] Login success:', res.user.id, 'newUser=', res.isNewUser);
      return { user: res.user, isNewUser: res.isNewUser };
    } catch (e: any) {
      this.saveAuthStatus('guest');
      console.error('[Auth] Login failed:', e.message);
      throw e;
    }
  }

  async verifyOrRefresh(): Promise<User | null> {
    const token = getToken();
    if (!token) {
      this.saveAuthStatus('guest');
      return null;
    }

    this.saveAuthStatus('checking');
    try {
      const user = await authApi.getMe();
      this.saveUser(user);
      this.saveAuthStatus('authenticated');
      return user;
    } catch (e: any) {
      console.warn('[Auth] Token invalid, clearing:', e.message);
      clearToken();
      this.saveUser(null);
      this.saveAuthStatus('expired');
      return null;
    }
  }

  logout() {
    clearToken();
    this.saveUser(null);
    this.saveAuthStatus('guest');
    console.log('[Auth] Logged out');
  }

  isAuthenticated(): boolean {
    return this.getAuthStatus() === 'authenticated' && !!getToken();
  }
}

export const authService = new AuthService();
