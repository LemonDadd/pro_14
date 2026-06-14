import React from 'react';
import { View, Text } from '@tarojs/components';
import type { BabyEvent } from '@/types';
import { getHoursIntoDay } from '@/utils/time';
import styles from './index.module.scss';

interface TimelineBarProps {
  events: BabyEvent[];
}

const typeColors: Record<string, string> = {
  feed: '#FF8FB1',
  diaper: '#A8E6CF',
  sleep: '#7BC8FF',
  other: '#DFE6E9'
};

const TimelineBar: React.FC<TimelineBarProps> = ({ events }) => {
  const hours = Array.from({ length: 25 }, (_, i) => i);

  const eventBlocks = events
    .filter((e) => {
      const h = getHoursIntoDay(e.timestamp);
      return h >= 0 && h < 24;
    })
    .map((e) => {
      const startHour = getHoursIntoDay(e.timestamp);
      let width = 0.6;
      if (e.type === 'sleep' && e.sleepData?.durationSec) {
        width = Math.max(0.6, e.sleepData.durationSec / 3600);
      }
      return {
        id: e.id,
        leftPercent: (startHour / 24) * 100,
        widthPercent: Math.min(width / 24 * 100, 15),
        color: typeColors[e.type]
      };
    });

  return (
    <View className={styles.container}>
      <View className={styles.timeLabels}>
        {hours.filter((_, i) => i % 6 === 0).map((h) => (
          <Text key={h} className={styles.timeLabel}>
            {h}
          </Text>
        ))}
      </View>
      <View className={styles.bar}>
        <View className={styles.track}>
          {hours.filter((_, i) => i % 6 === 0 && i > 0 && i < 24).map((h) => (
            <View
              key={h}
              className={styles.tick}
              style={{ left: `${(h / 24) * 100}%` }}
            />
          ))}
        </View>
        {eventBlocks.map((block) => (
          <View
            key={block.id}
            className={styles.block}
            style={{
              left: `${block.leftPercent}%`,
              width: `${block.widthPercent}%`,
              backgroundColor: block.color
            }}
          />
        ))}
        <View className={styles.nowIndicator} />
      </View>
      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: typeColors.feed }} />
          <Text className={styles.legendText}>喂奶</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: typeColors.diaper }} />
          <Text className={styles.legendText}>尿布</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: typeColors.sleep }} />
          <Text className={styles.legendText}>睡眠</Text>
        </View>
      </View>
    </View>
  );
};

export default TimelineBar;
