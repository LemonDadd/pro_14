import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, className }) => {
  return (
    <View className={classnames(styles.empty, className)}>
      <View className={styles.icon}>🍼</View>
      <Text className={styles.title}>{title}</Text>
      {description && <Text className={styles.desc}>{description}</Text>}
    </View>
  );
};

export default EmptyState;
