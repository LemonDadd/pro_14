import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { BabyEvent } from '@/types';
import { formatTime, formatDuration, formatDurationShort } from '@/utils/time';
import styles from './index.module.scss';

interface EventCardProps {
  event: BabyEvent;
  onDelete?: (id: string) => void;
  className?: string;
}

const typeConfig = {
  feed: { label: '喂奶', color: '#FF8FB1', bg: 'rgba(255, 143, 177, 0.12)' },
  diaper: { label: '尿布', color: '#00B894', bg: 'rgba(168, 230, 207, 0.2)' },
  sleep: { label: '睡眠', color: '#7BC8FF', bg: 'rgba(123, 200, 255, 0.15)' },
  other: { label: '其他', color: '#B2BEC3', bg: 'rgba(223, 230, 233, 0.5)' }
};

const getEventDetail = (event: BabyEvent): string => {
  switch (event.type) {
    case 'feed': {
      const parts: string[] = [];
      if (event.feedData?.amountMl) parts.push(`${event.feedData.amountMl}ml`);
      if (event.feedData?.side) {
        const sideMap = { L: '左侧', R: '右侧', bottle: '瓶喂' };
        parts.push(sideMap[event.feedData.side]);
      }
      if (event.feedData?.durationSec) {
        parts.push(formatDuration(event.feedData.durationSec));
      }
      return parts.join(' · ') || '已记录';
    }
    case 'diaper': {
      const typeMap = { wet: '嘘嘘', dirty: '便便', both: '嘘嘘+便便' };
      const t = event.diaperData?.type ? typeMap[event.diaperData.type] : '';
      const note = event.diaperData?.colorNote ? `· ${event.diaperData.colorNote}` : '';
      return `${t}${note}`;
    }
    case 'sleep':
      return event.sleepData?.durationSec
        ? `睡眠 ${formatDuration(event.sleepData.durationSec)}`
        : '已记录';
    case 'other': {
      const parts: string[] = [];
      if (event.otherData?.temperature) parts.push(`体温 ${event.otherData.temperature}°C`);
      if (event.otherData?.medication) parts.push(`用药: ${event.otherData.medication}`);
      if (event.otherData?.note) parts.push(event.otherData.note);
      if (event.note) parts.push(event.note);
      return parts.join(' · ') || '已记录';
    }
    default:
      return event.note || '';
  }
};

const EventCard: React.FC<EventCardProps> = ({ event, onDelete, className }) => {
  const config = typeConfig[event.type];
  const detail = getEventDetail(event);

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/log-new/index?eventId=${event.id}`
    });
  };

  const handleLongPress = () => {
    Taro.showActionSheet({
      itemList: ['编辑记录', '删除记录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.navigateTo({
            url: `/pages/log-new/index?eventId=${event.id}`
          });
        } else if (res.tapIndex === 1 && onDelete) {
          onDelete(event.id);
        }
      }
    });
  };

  return (
    <View
      className={classnames(styles.card, className)}
      onClick={handleClick}
      onLongPress={handleLongPress}
    >
      <View className={styles.left}>
        <View
          className={styles.typeBadge}
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          <Text className={styles.typeLabel}>{config.label}</Text>
        </View>
        <Text className={styles.detail}>{detail}</Text>
      </View>
      <View className={styles.right}>
        <Text className={styles.time}>{formatTime(event.timestamp)}</Text>
        {event.type === 'sleep' && event.sleepData?.durationSec && (
          <Text className={styles.duration}>
            {formatDurationShort(event.sleepData.durationSec)}
          </Text>
        )}
      </View>
    </View>
  );
};

export default EventCard;
