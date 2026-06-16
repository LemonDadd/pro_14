import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import styles from './index.module.scss';
import classnames from 'classnames';

const DEFAULT_TEMPLATE_ID = 'TPL_DEFAULT_FEED_REMINDER';

const SettingsPage: React.FC = () => {
  const {
    settings,
    initStore,
    updateSettings,
    babies,
    events,
    growthRecords,
    clearAllData,
    user,
    authStatus,
    network,
    pendingSyncCount,
    isRefreshing,
    subscription,
    login,
    logout,
    syncToCloud,
    syncFromCloud,
    saveTemplateId,
    triggerReminder,
  } = useBabyStore();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);
  const [isSubSaving, setIsSubSaving] = useState(false);
  const [isReminderTesting, setIsReminderTesting] = useState(false);

  useEffect(() => {
    initStore();
  }, [initStore]);

  const intervalOptions = [2, 2.5, 3, 3.5, 4];

  const handleSetInterval = (hours: number) => {
    updateSettings({ feedReminderInterval: hours });
    Taro.showToast({ title: '已保存', icon: 'success' });
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await login();

      if (result.hasLocalData && result.hasRemoteData) {
        Taro.showModal({
          title: '发现云端数据',
          content: '检测到本地和云端都有数据，是否将云端数据合并到本地？',
          confirmText: '合并',
          cancelText: '保持本地',
          success: async (res) => {
            if (res.confirm) {
              setIsSyncingDown(true);
              try {
                await syncFromCloud('merge');
                Taro.showToast({ title: '合并完成', icon: 'success' });
              } finally {
                setIsSyncingDown(false);
              }
            } else {
              Taro.showToast({ title: '已同步', icon: 'success' });
            }
          },
        });
      } else if (result.hasLocalData && !result.hasRemoteData) {
        Taro.showModal({
          title: '同步本地数据？',
          content: '检测到本地有数据，是否同步到云端以便多设备使用？',
          confirmText: '立即同步',
          cancelText: '稍后',
          success: async (res) => {
            if (res.confirm) {
              setIsSyncingUp(true);
              try {
                await syncToCloud();
                Taro.showToast({ title: '已同步到云端', icon: 'success' });
              } finally {
                setIsSyncingUp(false);
              }
            }
          },
        });
      } else if (result.isNewUser) {
        Taro.showToast({ title: '登录成功', icon: 'success' });
      } else {
        Taro.showToast({ title: '欢迎回来', icon: 'success' });
      }
    } catch (e: any) {
      console.error('[Login] failed:', e);
      Taro.showToast({
        title: e?.message || '登录失败',
        icon: 'none',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出登录？',
      content: '退出后本地数据会保留，下次登录可重新同步',
      success: (res) => {
        if (res.confirm) {
          logout();
        }
      },
    });
  };

  const handleToggleSubscribe = async () => {
    if (authStatus !== 'authenticated') {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (isSubSaving) return;
    setIsSubSaving(true);
    try {
      const tplId = subscription?.templateId || DEFAULT_TEMPLATE_ID;
      const next = !subscription?.subscribed;
      await saveTemplateId(tplId, next);
      Taro.showToast({
        title: next ? '订阅已开启' : '订阅已关闭',
        icon: 'success',
      });
    } catch (e: any) {
      Taro.showToast({
        title: e?.message || '设置失败',
        icon: 'none',
      });
    } finally {
      setIsSubSaving(false);
    }
  };

  const handleTestReminder = async () => {
    if (!subscription?.subscribed) {
      Taro.showToast({ title: '请先开启订阅', icon: 'none' });
      return;
    }
    if (isReminderTesting) return;
    setIsReminderTesting(true);
    try {
      const res = await triggerReminder();
      if (res && res.sent > 0) {
        Taro.showToast({ title: `已发送 ${res.sent} 条提醒`, icon: 'success' });
      } else {
        Taro.showToast({ title: '暂未达到提醒条件', icon: 'none' });
      }
    } catch (e: any) {
      Taro.showToast({
        title: e?.message || '发送失败',
        icon: 'none',
      });
    } finally {
      setIsReminderTesting(false);
    }
  };

  const handleSyncUp = async () => {
    if (isSyncingUp) return;
    setIsSyncingUp(true);
    try {
      const count = await syncToCloud();
      if (count != null && count > 0) {
        Taro.showToast({
          title: `已同步 ${count} 项`,
          icon: 'success',
        });
      } else if (count === 0) {
        Taro.showToast({ title: '没有待同步数据', icon: 'none' });
      }
    } catch (e: any) {
      Taro.showModal({
        title: '同步失败',
        content: e?.message || '请检查网络后重试',
        showCancel: false,
      });
    } finally {
      setIsSyncingUp(false);
    }
  };

  const handleSyncDown = async () => {
    if (isSyncingDown) return;
    Taro.showModal({
      title: '从云端同步',
      content: '将云端数据合并到本地（保留所有不冲突的记录）。是否继续？',
      success: async (res) => {
        if (!res.confirm) return;
        setIsSyncingDown(true);
        try {
          const ok = await syncFromCloud('merge');
          if (ok) {
            Taro.showToast({ title: '合并完成', icon: 'success' });
          }
        } catch (e: any) {
          Taro.showModal({
            title: '拉取失败',
            content: e?.message || '请检查网络后重试',
            showCancel: false,
          });
        } finally {
          setIsSyncingDown(false);
        }
      },
    });
  };

  const handleExportData = () => {
    const data = {
      babies,
      events,
      growthRecords,
      settings,
      exportAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    console.log('[Export] Data length:', json.length);
    Taro.setClipboardData({
      data: json,
      success: () => {
        Taro.showModal({
          title: '数据已导出',
          content: '所有数据已复制到剪贴板',
          showCancel: false,
        });
      },
      fail: () => {
        Taro.showToast({ title: '导出失败', icon: 'error' });
      },
    });
  };

  const handleClearData = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有本地数据吗？此操作不可撤销！云端数据不受影响。',
      confirmColor: '#E17055',
      success: (res) => {
        if (res.confirm) {
          clearAllData();
          Taro.showToast({ title: '已清空', icon: 'success' });
        }
      },
    });
  };

  const syncBtnDisabled = authStatus !== 'authenticated' || !network.isOnline;

  const renderAccountCard = () => {
    const isAuthed = authStatus === 'authenticated';

    if (!isAuthed) {
      return (
        <View className={styles.accountCard} onClick={handleLogin}>
          <View className={styles.guestCard}>
            <Text className={styles.guestIcon}>👤</Text>
            <View className={styles.guestMeta}>
              <Text className={styles.guestTitle}>未登录</Text>
              <Text className={styles.guestTip}>
                {authStatus === 'checking' ? '正在检查登录状态...' : '点击登录，多设备数据同步'}
              </Text>
            </View>
            <View
              className={classnames(styles.accountBtn, styles.primary)}
              onClick={(e) => {
                e.stopPropagation();
                handleLogin();
              }}
            >
              {isLoggingIn ? '登录中...' : '微信登录'}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View className={styles.accountCard}>
        <View className={styles.accountRow}>
          <View className={styles.accountInfo}>
            <View className={styles.accountAvatar}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  alt=""
                />
              ) : (
                <Text>😊</Text>
              )}
            </View>
            <View className={styles.accountMeta}>
              <Text className={styles.accountName}>
                {user?.nickname || '微信用户'}
              </Text>
              <Text className={styles.accountSubtitle}>
                ID: {user?.id?.slice(0, 8) || ''}... · {babies.length} 个宝宝档案
              </Text>
            </View>
          </View>
          <View className={styles.accountBtn} onClick={handleLogout}>
            退出登录
          </View>
        </View>
      </View>
    );
  };

  const renderSubscribeCard = () => {
    const isAuthed = authStatus === 'authenticated';
    const subOn = !!subscription?.subscribed;

    return (
      <View className={styles.settingsCard}>
        <Text className={styles.sectionTitle}>
          喂奶提醒订阅
          <Text className={classnames(styles.subBadge, { [styles.off]: !subOn })}>
            {subOn ? '已开启' : '未开启'}
          </Text>
        </Text>

        <View className={styles.subRow}>
          <View className={styles.subLabel}>
            <Text className={styles.subName}>自动推送喂奶提醒</Text>
            <Text className={styles.subNote}>
              超过设定间隔时，微信服务通知自动提醒
            </Text>
          </View>
          <View
            className={classnames(styles.subSwitch, { [styles.on]: subOn })}
            onClick={handleToggleSubscribe}
          >
            <View className={styles.subSwitchKnob} />
          </View>
        </View>

        {subscription?.lastReminderSentAt && (
          <View className={styles.subRow}>
            <View className={styles.subLabel}>
              <Text className={styles.subName}>上次提醒</Text>
              <Text className={styles.subNote}>
                {new Date(subscription.lastReminderSentAt).toLocaleString('zh-CN', {
                  hour12: false,
                })}
              </Text>
            </View>
          </View>
        )}

        <View className={styles.subRow}>
          <View className={styles.subLabel}>
            <Text className={styles.subName}>测试发送提醒</Text>
            <Text className={styles.subNote}>
              手动触发一次，验证订阅通道是否正常
            </Text>
          </View>
          <View
            className={classnames(styles.accountBtn, { [styles.primary]: !isReminderTesting })}
            style={{ background: isAuthed ? 'rgba(255,255,255,0.85)' : '#EEE', color: isAuthed ? '#E16A93' : '#999' }}
            onClick={handleTestReminder}
          >
            {isReminderTesting ? '发送中...' : '立即发送'}
          </View>
        </View>

        {!isAuthed && (
          <Text className={styles.syncHint}>💡 登录后即可开启自动提醒</Text>
        )}
      </View>
    );
  };

  const renderSyncCard = () => {
    const isAuthed = authStatus === 'authenticated';

    return (
      <View className={styles.settingsCard}>
        <Text className={styles.sectionTitle}>数据同步</Text>

        <View className={styles.syncStatusRow}>
          <View className={styles.subLabel}>
            <Text className={styles.subName}>
              <Text
                className={classnames(styles.networkDot, {
                  [styles.off]: !network.isOnline,
                })}
              />
              网络状态
            </Text>
            <Text className={styles.subNote}>
              {network.isOnline ? (network.networkType ? `${network.networkType} 已连接` : '在线') : '当前离线（数据仅本地保存）'}
            </Text>
          </View>
          <Text
            className={classnames(styles.syncStatus, isAuthed && network.isOnline ? styles.idle : styles.off)}
          >
            {isAuthed ? (network.isOnline ? (pendingSyncCount > 0 ? `待同步 ${pendingSyncCount} 项` : '实时同步') : '离线') : '未登录'}
          </Text>
        </View>

        <View className={styles.syncRow}>
          <View
            className={classnames(styles.syncBtn, styles.up, { disabled: syncBtnDisabled || isSyncingUp })}
            onClick={handleSyncUp}
          >
            {isSyncingUp ? '同步中...' : '☁️ 上传待同步项'}
          </View>
          <View
            className={classnames(styles.syncBtn, styles.down, { disabled: syncBtnDisabled || isSyncingDown || isRefreshing })}
            onClick={handleSyncDown}
          >
            {isSyncingDown || isRefreshing ? '拉取中...' : '⬇️ 从云端合并'}
          </View>
        </View>

        {!isAuthed && (
          <Text className={styles.syncHint}>💡 登录后自动开启实时同步</Text>
        )}
        {isAuthed && !network.isOnline && (
          <Text className={styles.syncHint}>📴 离线时数据暂存本地，联网后自动同步</Text>
        )}
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>设置</Text>
        <Text className={styles.pageSubtitle}>个性化设置、账号与数据管理</Text>
      </View>

      {renderAccountCard()}

      <View className={styles.settingsCard}>
        <Text className={styles.sectionTitle}>喂奶提醒</Text>
        <View className={styles.settingItem}>
          <View className={styles.settingLeft}>
            <Text className={styles.settingLabel}>喂奶间隔提醒</Text>
            <Text className={styles.settingDesc}>
              超过此时长后在首页显示提醒
            </Text>
          </View>
        </View>
        <View className={styles.intervalOptions}>
          {intervalOptions.map((h) => (
            <View
              key={h}
              className={classnames(styles.intervalBtn, {
                [styles.active]: settings.feedReminderInterval === h,
              })}
              onClick={() => handleSetInterval(h)}
            >
              <Text>{h}h</Text>
            </View>
          ))}
        </View>
      </View>

      {renderSubscribeCard()}

      {renderSyncCard()}

      <View className={styles.settingsCard}>
        <Text className={styles.sectionTitle}>本地数据</Text>
        <View className={styles.settingItem}>
          <View className={styles.settingLeft}>
            <Text className={styles.settingLabel}>当前宝宝</Text>
            <Text className={styles.settingDesc}>{babies.length} 个档案</Text>
          </View>
        </View>
        <View className={styles.settingItem}>
          <View className={styles.settingLeft}>
            <Text className={styles.settingLabel}>记录总数</Text>
            <Text className={styles.settingDesc}>
              {events.length} 条事件 · {growthRecords.length} 条生长记录
            </Text>
          </View>
        </View>
        <View className={styles.dataSection}>
          <View
            className={classnames(styles.dataBtn, styles.primary)}
            onClick={handleExportData}
          >
            <Text>导出数据 (JSON)</Text>
          </View>
          <View
            className={classnames(styles.dataBtn, styles.danger)}
            onClick={handleClearData}
          >
            <Text>清空本地数据</Text>
          </View>
        </View>
      </View>

      <View className={styles.aboutCard}>
        <Text className={styles.aboutVersion}>宝宝喂养记录 v1.1.0</Text>
        <Text className={styles.aboutTip}>
          {authStatus === 'authenticated'
            ? '登录状态 · 数据自动同步云端'
            : '离线模式 · 数据仅保存在本机'}
        </Text>
      </View>
    </View>
  );
};

export default SettingsPage;
