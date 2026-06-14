import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

interface QuickRecordFabProps {
  className?: string;
}

const QuickRecordFab: React.FC<QuickRecordFabProps> = ({ className }) => {
  const handleTap = () => {
    Taro.navigateTo({ url: '/pages/log-new/index' });
  };

  return (
    <View className={classnames(styles.fab, className)} onClick={handleTap}>
      <Text className={styles.plus}>+</Text>
      <Text className={styles.label}>记录</Text>
    </View>
  );
};

export default QuickRecordFab;
