import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface BabyAvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BabyAvatar: React.FC<BabyAvatarProps> = ({
  name,
  color = '#FF8FB1',
  size = 'md',
  className
}) => {
  const initial = name?.charAt(0) || '宝';

  return (
    <View
      className={classnames(styles.avatar, styles[size], className)}
      style={{ backgroundColor: color }}
    >
      <Text className={styles.text}>{initial}</Text>
    </View>
  );
};

export default BabyAvatar;
