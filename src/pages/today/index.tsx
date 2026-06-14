import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import { formatAge, getTimeSinceFeed } from '@/utils/time';
import BabyAvatar from '@/components/BabyAvatar';
import TimelineBar from '@/components/TimelineBar';
import EventCard from '@/components/EventCard';
import QuickRecordFab from '@/components/QuickRecordFab';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';
import classnames from 'classnames';

const TodayPage: React.FC = () => {
  const {
    babies,
    currentBaby,
    settings,
    initStore,
    getTodayEvents,
    getLastFeedEvent,
    setCurrentBaby,
    deleteEvent
  } = useBabyStore();

  const [nowPercent, setNowPercent] = useState(50);

  useEffect(() => {
    initStore();
  }, [initStore]);

  useEffect(() => {
    const updateNowPosition = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setNowPercent((minutes / (24 * 60)) * 100);
    };
    updateNowPosition();
    const timer = setInterval(updateNowPosition, 60000);
    return () => clearInterval(timer);
  }, []);

  const todayEvents = currentBaby ? getTodayEvents() : [];
  const lastFeed = currentBaby ? getLastFeedEvent() : null;

  const handleDeleteEvent = useCallback((id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          deleteEvent(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }, [deleteEvent]);

  const handleSwitchBaby = () => {
    if (babies.length === 0) {
      Taro.switchTab({ url: '/pages/babies/index' });
      return;
    }
    Taro.showActionSheet({
      itemList: babies.map((b) => b.nickname),
      success: (res) => {
        const selected = babies[res.tapIndex];
        if (selected) {
          setCurrentBaby(selected.id);
        }
      }
    });
  };

  const renderReminder = () => {
    if (!lastFeed) {
      return (
        <View className={styles.feedReminder}>
          <View className={styles.reminderLeft}>
            <Text className={styles.reminderTitle}>距上次喂奶</Text>
            <Text className={styles.reminderTime}>暂无记录</Text>
          </View>
          <View className={classnames(styles.reminderBadge, styles.none)}>
            首次喂养
          </View>
        </View>
      );
    }

    const { hours, minutes } = getTimeSinceFeed(lastFeed.timestamp);
    const totalHours = hours + minutes / 60;
    const isWarning = totalHours > settings.feedReminderInterval;
    const isUrgent = totalHours > settings.feedReminderInterval + 1;

    return (
      <View className={styles.feedReminder}>
        <View className={styles.reminderLeft}>
          <Text className={styles.reminderTitle}>距上次喂奶</Text>
          <Text className={styles.reminderTime}>
            {hours > 0 ? `${hours}小时` : ''}{minutes}分钟
          </Text>
        </View>
        <View
          className={classnames(
            styles.reminderBadge,
            isUrgent || isWarning ? styles.warning : styles.normal
          )}
        >
          {isUrgent ? '超时提醒' : isWarning ? '即将提醒' : '正常'}
        </View>
      </View>
    );
  };

  if (!currentBaby) {
    return (
      <View className={styles.page}>
        <EmptyState
          title="还没有添加宝宝"
          description="点击下方「宝宝」标签，先添加宝宝档案吧"
        />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.babyInfo}>
          <BabyAvatar
            name={currentBaby.nickname}
            color={currentBaby.avatarColor}
            size="md"
          />
          <View className={styles.babyMeta}>
            <Text className={styles.babyName}>{currentBaby.nickname}</Text>
            <Text className={styles.babyAge}>{formatAge(currentBaby.birthday)}</Text>
          </View>
        </View>
        <Text className={styles.switchBtn} onClick={handleSwitchBaby}>
          切换
        </Text>
      </View>

      {renderReminder()}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>24小时时间轴</Text>
        <View style={{ '--now-position': `${nowPercent}%` } as React.CSSProperties}>
          <TimelineBar events={todayEvents} />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>今日记录</Text>
        {todayEvents.length === 0 ? (
          <EmptyState
            title="今天还没有记录"
            description="点击右下角「记录」按钮开始记录吧"
          />
        ) : (
          <ScrollView className={styles.eventList} scrollY>
            {todayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={handleDeleteEvent}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <QuickRecordFab />
    </View>
  );
};

export default TodayPage;
