import React, { useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { useBabyStore } from '@/store/babyStore';
import { isToday, formatDate } from '@/utils/time';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

interface DayStat {
  date: string;
  label: string;
  totalMl: number;
  feedCount: number;
  diaperCount: number;
  sleepSec: number;
}

const StatsPage: React.FC = () => {
  const { currentBaby, initStore, getWeekEvents, getTodayEvents } = useBabyStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const weekEvents = currentBaby ? getWeekEvents() : [];
  const todayEvents = currentBaby ? getTodayEvents() : [];

  const todayStats = useMemo(() => {
    const today = todayEvents;
    let totalMl = 0;
    let feedCount = 0;
    let diaperCount = 0;
    let sleepSec = 0;
    const sideCounts: Record<string, number> = { L: 0, R: 0, bottle: 0 };

    today.forEach((e) => {
      if (e.type === 'feed') {
        feedCount++;
        totalMl += e.feedData?.amountMl || 0;
        if (e.feedData?.side) {
          sideCounts[e.feedData.side]++;
        }
      } else if (e.type === 'diaper') {
        diaperCount++;
      } else if (e.type === 'sleep') {
        sleepSec += e.sleepData?.durationSec || 0;
      }
    });

    return { totalMl, feedCount, diaperCount, sleepSec, sideCounts };
  }, [todayEvents]);

  const weekStats: DayStat[] = useMemo(() => {
    const days: DayStat[] = [];
    const dayLabels = ['今天', '昨天', '前天', '4天前', '5天前', '6天前', '7天前'];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayEvents = weekEvents.filter(
        (e) => e.timestamp >= dayStart && e.timestamp < dayEnd
      );

      let totalMl = 0;
      let feedCount = 0;
      let diaperCount = 0;
      let sleepSec = 0;

      dayEvents.forEach((e) => {
        if (e.type === 'feed') {
          feedCount++;
          totalMl += e.feedData?.amountMl || 0;
        } else if (e.type === 'diaper') {
          diaperCount++;
        } else if (e.type === 'sleep') {
          sleepSec += e.sleepData?.durationSec || 0;
        }
      });

      days.push({
        date: formatDate(dayStart),
        label: dayLabels[i],
        totalMl,
        feedCount,
        diaperCount,
        sleepSec
      });
    }

    return days.reverse();
  }, [weekEvents]);

  const maxMl = Math.max(...weekStats.map((d) => d.totalMl), 1);
  const sleepHours = (todayStats.sleepSec / 3600).toFixed(1);

  if (!currentBaby) {
    return (
      <View className={styles.page}>
        <EmptyState
          title="还没有添加宝宝"
          description="请先在「宝宝」页面添加宝宝档案"
        />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>数据统计</Text>
        <Text className={styles.pageSubtitle}>{currentBaby.nickname} 的喂养记录</Text>
      </View>

      <View className={styles.statsRow}>
        <StatCard label="今日奶量" value={todayStats.totalMl} unit="ml" color="#FF8FB1" />
        <StatCard label="尿布次数" value={todayStats.diaperCount} unit="次" color="#A8E6CF" />
      </View>

      <View className={styles.statsRow}>
        <StatCard label="喂奶次数" value={todayStats.feedCount} unit="次" color="#FF8FB1" />
        <StatCard label="睡眠时长" value={sleepHours} unit="h" color="#7BC8FF" />
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>近7天奶量趋势</Text>
        <View className={styles.weekChart}>
          <View className={styles.chartHeader}>
            <Text className={styles.chartTitle}>每日总奶量</Text>
            <Text className={styles.chartUnit}>单位：ml</Text>
          </View>
          <View className={styles.chartBody}>
            {weekStats.map((day) => (
              <View key={day.date} className={styles.chartBar}>
                <Text className={styles.barValue}>{day.totalMl || '-'}</Text>
                <View
                  className={styles.barFill}
                  style={{ height: `${Math.max((day.totalMl / maxMl) * 100, 2)}%` }}
                />
                <Text className={styles.barLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>今日详情</Text>
        <View className={styles.todayDetail}>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>喂奶分布</Text>
            <View className={styles.feedTypeList}>
              <View className={styles.feedTypeItem}>
                <View className={styles.feedDot} />
                <Text className={styles.feedTypeLabel}>左侧</Text>
                <Text className={styles.feedTypeValue}>{todayStats.sideCounts.L} 次</Text>
              </View>
              <View className={styles.feedTypeItem}>
                <View className={styles.feedDot} />
                <Text className={styles.feedTypeLabel}>右侧</Text>
                <Text className={styles.feedTypeValue}>{todayStats.sideCounts.R} 次</Text>
              </View>
              <View className={styles.feedTypeItem}>
                <View className={styles.feedDot} />
                <Text className={styles.feedTypeLabel}>瓶喂</Text>
                <Text className={styles.feedTypeValue}>{todayStats.sideCounts.bottle} 次</Text>
              </View>
            </View>
          </View>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>平均每次奶量</Text>
            <Text className={styles.detailValue}>
              {todayStats.feedCount > 0 ? Math.round(todayStats.totalMl / todayStats.feedCount) : 0} ml
            </Text>
          </View>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>平均喂奶间隔</Text>
            <Text className={styles.detailValue}>
              {todayStats.feedCount > 1 ? (24 / todayStats.feedCount).toFixed(1) : '-'} h
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default StatsPage;
