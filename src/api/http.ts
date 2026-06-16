import Taro from '@tarojs/taro';
import config from '@/config';

const TOKEN_KEY = 'babycare_auth_token';

export function getToken(): string | null {
  try {
    return Taro.getStorageSync(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  Taro.setStorageSync(TOKEN_KEY, token);
}

export function clearToken(): void {
  Taro.removeStorageSync(TOKEN_KEY);
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export class ApiError extends Error {
  code: number;
  raw?: any;

  constructor(message: string, code: number = -1, raw?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.raw = raw;
  }
}

export async function httpRequest<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    header?: Record<string, string>;
    timeout?: number;
    auth?: boolean;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    data,
    header = {},
    timeout = config.REQUEST_TIMEOUT,
    auth = true,
  } = options;

  const finalHeader: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeader['Authorization'] = `Bearer ${token}`;
    }
  }

  const fullUrl = url.startsWith('http') ? url : `${config.API_BASE_URL}${url}`;

  console.log(`[HTTP] ${method} ${fullUrl}`);

  try {
    const res = await Taro.request<ApiResponse<T>>({
      url: fullUrl,
      method,
      data,
      header: finalHeader,
      timeout,
    });

    const body = res.data;

    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) {
        return body.data as T;
      }

      if (body.code === 401) {
        clearToken();
        Taro.eventCenter.trigger('auth:expired');
      }

      console.warn(`[HTTP] API error ${body.code}: ${body.message}`);
      throw new ApiError(body.message || '请求失败', body.code, body);
    }

    return body as unknown as T;
  } catch (e: any) {
    if (e instanceof ApiError) {
      throw e;
    }

    const errMsg = e?.errMsg || e?.message || '网络请求失败';
    const isNetworkError = /fail|timeout|network|abort/i.test(errMsg);

    console.error(`[HTTP] Request failed:`, errMsg);
    throw new ApiError(
      isNetworkError ? '网络连接失败，请检查网络后重试' : errMsg,
      isNetworkError ? -2 : -1,
      e
    );
  }
}

export const http = {
  get: <T>(url: string, data?: any, auth = true) =>
    httpRequest<T>(url, { method: 'GET', data, auth }),
  post: <T>(url: string, data?: any, auth = true) =>
    httpRequest<T>(url, { method: 'POST', data, auth }),
  put: <T>(url: string, data?: any, auth = true) =>
    httpRequest<T>(url, { method: 'PUT', data, auth }),
  delete: <T>(url: string, data?: any, auth = true) =>
    httpRequest<T>(url, { method: 'DELETE', data, auth }),
};
