import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  color,
  className
}) => {
  return (
    <View className={classnames(styles.card, className)}>
      <Text className={styles.label}>{label}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value} style={{ color }}>
          {value}
        </Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
};

export default StatCard;
