import React, { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import styles from './index.module.scss';
import classnames from 'classnames';

const SettingsPage: React.FC = () => {
  const { settings, initStore, updateSettings, babies, events, growthRecords, clearAllData } = useBabyStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const intervalOptions = [2, 2.5, 3, 3.5, 4];

  const handleSetInterval = (hours: number) => {
    updateSettings({ feedReminderInterval: hours });
    Taro.showToast({ title: '已保存', icon: 'success' });
  };

  const handleExportData = () => {
    const data = {
      babies,
      events,
      growthRecords,
      settings,
      exportAt: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    console.log('[Export] Data length:', json.length);
    Taro.setClipboardData({
      data: json,
      success: () => {
        Taro.showModal({
        title: '数据已导出',
        content: '所有数据已复制到剪贴板',
        showCancel: false
      });
    },
      fail: () => {
        Taro.showToast({ title: '导出失败', icon: 'error' });
      }
    });
  };

  const handleClearData = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可撤销！',
      confirmColor: '#E17055',
      success: (res) => {
        if (res.confirm) {
          clearAllData();
          Taro.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>设置</Text>
        <Text className={styles.pageSubtitle}>个性化设置与数据管理</Text>
      </View>

      <View className={styles.settingsCard}>
        <Text className={styles.sectionTitle}>喂奶提醒</Text>
        <View className={styles.settingItem}>
          <View className={styles.settingLeft}>
            <Text className={styles.settingLabel}>喂奶间隔提醒</Text>
            <Text className={styles.settingDesc}>
              超过此时长后在首页显示提醒</Text>
          </View>
        </View>
        <View className={styles.intervalOptions}>
          {intervalOptions.map((h) => (
            <View
              key={h}
              className={classnames(styles.intervalBtn, {
                [styles.active]: settings.feedReminderInterval === h
              })}
              onClick={() => handleSetInterval(h)}
            >
              <Text>{h}h</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.settingsCard}>
        <Text className={styles.sectionTitle}>数据管理</Text>
        <View className={styles.settingItem}>
          <View className={styles.settingLeft}>
            <Text className={styles.settingLabel}>当前宝宝</Text>
            <Text className={styles.settingDesc}>
              {babies.length} 个档案
            </Text>
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
          <View className={classnames(styles.dataBtn, styles.primary)} onClick={handleExportData}>
            <Text>导出数据 (JSON)</Text>
          </View>
          <View className={classnames(styles.dataBtn, styles.danger)} onClick={handleClearData}>
            <Text>清空所有数据</Text>
          </View>
        </View>
      </View>

      <View className={styles.aboutCard}>
        <Text className={styles.aboutVersion}>宝宝喂养记录 v1.0.0</Text>
        <Text className={styles.aboutTip}>数据存储在本机，卸载应用数据仅保存在本地</Text>
      </View>
    </View>
  );
};

export default SettingsPage;
