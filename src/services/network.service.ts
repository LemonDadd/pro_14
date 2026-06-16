import Taro from '@tarojs/taro';
import type { NetworkStatus } from '@/types';
import { syncService } from './sync.service';
import { authService } from './auth.service';

class NetworkService {
  private status: NetworkStatus = { isOnline: true };
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      Taro.getNetworkType({
        success: (res) => {
          this.status = {
            isOnline: res.networkType !== 'none',
            networkType: res.networkType,
          };
          this.notifyListeners();
        },
      });

      Taro.onNetworkStatusChange((res) => {
        const prevOnline = this.status.isOnline;
        this.status = {
          isOnline: res.isConnected,
          networkType: res.networkType,
        };
        this.notifyListeners();

        if (!prevOnline && this.status.isOnline) {
          console.log('[Network] back online, retrying sync and auth');
          setTimeout(() => this.onOnline(), 1000);
        } else if (prevOnline && !this.status.isOnline) {
          console.log('[Network] offline');
        }
      });
    } catch (e) {
      console.warn('[Network] init failed, assume online');
    }
  }

  private onOnline() {
    if (authService.getAuthStatus() === 'expired') {
      authService.verifyOrRefresh().catch(() => {});
    }
    syncService.retryPending();
  }

  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  isOnline(): boolean {
    return this.status.isOnline;
  }

  subscribe(listener: (status: NetworkStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l({ ...this.status }));
  }
}

export const networkService = new NetworkService();
