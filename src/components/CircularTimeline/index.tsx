import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import type { BabyEvent } from '@/types';
import { getHoursIntoDay, formatTime } from '@/utils/time';
import styles from './index.module.scss';

interface CircularTimelineProps {
  events: BabyEvent[];
  nowPercent: number;
}

const typeColors: Record<string, string> = {
  feed: '#FF8FB1',
  diaper: '#A8E6CF',
  sleep: '#7BC8FF',
  other: '#DFE6E9'
};

const TRACK_COLOR = '#F0F0F0';
const SHORT_EVENT_DEG = 6;
const HOUR_MARKS = [0, 3, 6, 9, 12, 15, 18, 21];
const LABEL_RADIUS_PCT = 43;

const CircularTimeline: React.FC<CircularTimelineProps> = ({ events, nowPercent }) => {
  const currentAngle = (nowPercent / 100) * 360;
  const timeStr = formatTime(Date.now());

  const gradientStr = useMemo(() => {
    const segments: { start: number; end: number; color: string }[] = [];

    events.forEach((e) => {
      const startHours = getHoursIntoDay(e.timestamp);
      if (startHours < 0 || startHours >= 24) return;

      const startDeg = (startHours / 24) * 360;
      let durationDeg: number;

      if (e.type === 'sleep' && e.sleepData?.durationSec) {
        durationDeg = (e.sleepData.durationSec / 3600 / 24) * 360;
      } else {
        durationDeg = SHORT_EVENT_DEG;
      }

      const endDeg = Math.min(startDeg + durationDeg, 359.9);
      segments.push({
        start: startDeg,
        end: endDeg,
        color: typeColors[e.type] || TRACK_COLOR
      });
    });

    segments.sort((a, b) => a.start - b.start);

    const parts: string[] = [];
    let cursor = 0;

    segments.forEach((seg) => {
      const effectiveStart = Math.max(seg.start, cursor);
      if (effectiveStart >= seg.end) return;

      if (effectiveStart > cursor) {
        parts.push(`${TRACK_COLOR} ${cursor}deg ${effectiveStart}deg`);
      }
      parts.push(`${seg.color} ${effectiveStart}deg ${seg.end}deg`);
      cursor = seg.end;
    });

    if (cursor < 360) {
      parts.push(`${TRACK_COLOR} ${cursor}deg 360deg`);
    }

    if (parts.length === 0) {
      return `conic-gradient(${TRACK_COLOR} 0deg 360deg)`;
    }

    return `conic-gradient(${parts.join(', ')})`;
  }, [events]);

  const getHourStyle = (hour: number): React.CSSProperties => {
    const angleRad = (hour / 24) * 2 * Math.PI;
    const x = 50 + LABEL_RADIUS_PCT * Math.sin(angleRad);
    const y = 50 - LABEL_RADIUS_PCT * Math.cos(angleRad);
    return { left: `${x}%`, top: `${y}%` } as React.CSSProperties;
  };

  return (
    <View className={styles.container}>
      <View className={styles.ringWrapper}>
        <View className={styles.ring} style={{ background: gradientStr }} />
        <View className={styles.innerCircle}>
          <Text className={styles.currentTime}>{timeStr}</Text>
        </View>
        <View
          className={styles.pointer}
          style={{ transform: `rotate(${currentAngle}deg)` }}
        />
        <View className={styles.centerDot} />
        {HOUR_MARKS.map((h) => (
          <View
            key={`tick-${h}`}
            className={styles.tickMark}
            style={{ transform: `rotate(${(h / 24) * 360}deg)` }}
          />
        ))}
        {HOUR_MARKS.map((h) => (
          <Text
            key={`label-${h}`}
            className={styles.hourLabel}
            style={getHourStyle(h)}
          >
            {h}
          </Text>
        ))}
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

export default CircularTimeline;
