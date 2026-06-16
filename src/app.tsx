import { useEffect, useRef } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import { syncService } from '@/services/sync.service';
import { authService } from '@/services/auth.service';
import './app.scss';

function App(props) {
  const { initApp, isInitializing, hasInitialized } = useBabyStore();
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const runInit = () => {
    if (!initPromiseRef.current) {
      initPromiseRef.current = initApp();
    }
    return initPromiseRef.current;
  };

  useEffect(() => {
    runInit();
  }, []);

  useDidShow(() => {
    runInit().then(() => {
      if (authService.isAuthenticated()) {
        setTimeout(() => syncService.retryPending(), 800);
      }
    });
  });

  useDidHide(() => {
    if (authService.isAuthenticated()) {
      syncService.pushToCloud().catch(() => {});
    }
  });

  if (isInitializing && !hasInitialized) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#FFF7F3',
        fontSize: '16px', color: '#8B6F5A',
      }}>
        加载中...
      </div>
    );
  }

  return props.children;
}

export default App;
