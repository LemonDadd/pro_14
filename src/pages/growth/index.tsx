import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import type { GrowthRecord } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const GrowthPage: React.FC = () => {
  const {
    currentBaby,
    initStore,
    getBabyGrowthRecords,
    addGrowthRecord,
    deleteGrowthRecord
  } = useBabyStore();

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formWeight, setFormWeight] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formNote, setFormNote] = useState('');

  useEffect(() => {
    initStore();
  }, [initStore]);

  const records = currentBaby ? getBabyGrowthRecords() : [];

  const chartData = useMemo(() => {
    if (records.length === 0) return null;

    const weights = records.map((r) => r.weight);
    const heights = records.filter((r) => r.height).map((r) => r.height as number);

    const minWeight = Math.min(...weights, currentBaby?.birthWeight || 2.5) - 0.5;
    const maxWeight = Math.max(...weights, currentBaby?.birthWeight || 3.5) + 0.5;
    const weightRange = maxWeight - minWeight || 1;

    const yTicks = 5;
    const yValues: number[] = [];
    for (let i = 0; i <= yTicks; i++) {
      yValues.push(Number((minWeight + (weightRange * i) / yTicks).toFixed(1)));
    }

    const points = records.map((r, i) => {
      const xPercent = records.length === 1 ? 50 : (i / (records.length - 1)) * 100;
      const yPercent = ((maxWeight - r.weight) / weightRange) * 100;
      return { x: xPercent, y: yPercent, value: r.weight };
    });

    return { yValues, points, minWeight, maxWeight };
  }, [records, currentBaby]);

  const handleAddRecord = () => {
    if (!formWeight) {
      Taro.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }
    const weight = parseFloat(formWeight);
    if (isNaN(weight) || weight < 1 || weight > 20) {
      Taro.showToast({ title: '请输入有效体重', icon: 'none' });
      return;
    }
    const height = formHeight ? parseFloat(formHeight) : undefined;

    addGrowthRecord({
      date: formDate,
      weight,
      height,
      note: formNote || undefined
    });

    Taro.showToast({ title: '已添加', icon: 'success' });
    setShowForm(false);
    setFormWeight('');
    setFormHeight('');
    setFormNote('');
  };

  const handleDeleteRecord = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条生长记录吗？',
      success: (res) => {
        if (res.confirm) {
          deleteGrowthRecord(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

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
        <Text className={styles.pageTitle}>生长曲线</Text>
        <Text className={styles.pageSubtitle}>{currentBaby.nickname} 的生长记录</Text>
      </View>

      <View className={styles.addBtn} onClick={() => setShowForm(true)}>
        <Text>+ 添加记录</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>体重曲线</Text>
        <View className={styles.chartCard}>
          {records.length === 0 ? (
            <EmptyState
              title="暂无生长数据"
              description="添加一条体重记录开始追踪吧"
            />
          ) : chartData ? (
            <>
              <View className={styles.chartHeader}>
                <Text className={styles.chartTitle}>体重变化</Text>
                <Text className={styles.chartUnit}>单位：kg</Text>
              </View>
              <View className={styles.chartContainer}>
                <View className={styles.yAxis}>
                  {chartData.yValues.slice().reverse().map((v) => (
                    <Text key={v} className={styles.yLabel}>{v}</Text>
                  ))}
                </View>
                <View className={styles.chartArea}>
                  {chartData.yValues.slice(1, -1).map((_, i) => (
                    <View
                      key={i}
                      className={styles.gridLine}
                      style={{ top: `${((i + 1) / (chartData.yValues.length - 1)) * 100}%` }}
                    />
                  ))}
                  {chartData.points.map((p, i) => (
                    <View
                      key={i}
                      className={styles.dataPoint}
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    />
                  ))}
                </View>
                <View className={styles.xAxis}>
                  {records.map((r, i) => (
                    <Text
                      key={r.id}
                      className={styles.xLabel}
                      style={{
                        position: 'absolute',
                        left: `${records.length === 1 ? 50 : (i / (records.length - 1)) * 100}%`
                      }}
                    >
                      {r.date.slice(5)}
                    </Text>
                  ))}
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>记录列表</Text>
        {records.length === 0 ? (
          <EmptyState title="还没有记录" description="点击上方按钮添加生长记录" />
        ) : (
          <View className={styles.recordList}>
            {records.slice().reverse().map((record) => (
              <View
                key={record.id}
                className={styles.recordCard}
                onLongPress={() => handleDeleteRecord(record.id)}
              >
                <View className={styles.recordLeft}>
                  <Text className={styles.recordDate}>{record.date}</Text>
                  {record.note && <Text className={styles.recordNote}>{record.note}</Text>}
                </View>
                <View className={styles.recordRight}>
                  <View className={styles.recordMetric}>
                    <Text className={styles.recordValue}>{record.weight}</Text>
                    <Text className={styles.recordUnit}>kg</Text>
                  </View>
                  {record.height && (
                    <View className={styles.recordMetric}>
                      <Text className={styles.recordValue} style={{ color: '#7BC8FF' }}>
                        {record.height}
                      </Text>
                      <Text className={styles.recordUnit}>cm</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {showForm && (
        <View className={styles.formModal} onClick={() => setShowForm(false)}>
          <View className={styles.formSheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.formHeader}>
              <Text className={styles.formTitle}>添加生长记录</Text>
              <Text className={styles.formClose} onClick={() => setShowForm(false)}>✕</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>日期</Text>
              <Input
                className={styles.formInput}
                type="text"
                value={formDate}
                onInput={(e) => setFormDate(e.detail.value)}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>体重 (kg) *</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={formWeight}
                onInput={(e) => setFormWeight(e.detail.value)}
                placeholder="例如 6.5"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>身长 (cm)</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={formHeight}
                onInput={(e) => setFormHeight(e.detail.value)}
                placeholder="例如 65"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注</Text>
              <Input
                className={styles.formInput}
                type="text"
                value={formNote}
                onInput={(e) => setFormNote(e.detail.value)}
                placeholder="可选"
              />
            </View>

            <View className={styles.formSubmit} onClick={handleAddRecord}>
              <Text>保存记录</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default GrowthPage;
