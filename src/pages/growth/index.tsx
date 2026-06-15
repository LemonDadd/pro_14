import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import { getWHOPercentileData } from '@/utils/whoPercentiles';
import EcCanvas from '@/components/EcCanvas';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';
import classnames from 'classnames';

type ChartTab = 'weight' | 'height';

const GrowthPage: React.FC = () => {
  const {
    currentBaby,
    initStore,
    getBabyGrowthRecords,
    addGrowthRecord,
    deleteGrowthRecord
  } = useBabyStore();

  const [activeTab, setActiveTab] = useState<ChartTab>('weight');
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

  const getAgeMonths = (dateStr: string): number => {
    if (!currentBaby) return 0;
    const birth = new Date(currentBaby.birthday);
    const d = new Date(dateStr);
    return (d.getFullYear() - birth.getFullYear()) * 12 + (d.getMonth() - birth.getMonth()) + (d.getDate() - birth.getDate()) / 30;
  };

  const weightChartOption = useMemo(() => {
    if (!currentBaby) return {};

    const whoData = getWHOPercentileData(currentBaby.gender, 'weight');
    const userPoints = records.map((r) => ({
      age: Math.max(0, getAgeMonths(r.date)),
      weight: r.weight,
      date: r.date
    }));

    const yMin = Math.min(
      whoData[0]?.p3 || 2,
      ...userPoints.map((p) => p.weight)
    ) - 0.5;
    const yMax = Math.max(
      whoData[whoData.length - 1]?.p97 || 12,
      ...userPoints.map((p) => p.weight)
    ) + 0.5;

    return {
      grid: { top: 30, right: 20, bottom: 30, left: 45, containLabel: false },
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#FFE0EA',
        borderWidth: 1,
        textStyle: { color: '#2D3436', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesName === '宝宝体重') {
            return `${params.data[2]}<br/>月龄: ${params.data[0].toFixed(1)}<br/>体重: <b>${params.data[1]}kg</b>`;
          }
          return `${params.seriesName}<br/>月龄: ${params.data[0]}<br/>体重: ${params.data[1]}kg`;
        }
      },
      legend: {
        data: ['P3', 'P50', 'P97', '宝宝体重'],
        bottom: 0,
        textStyle: { fontSize: 10, color: '#B2BEC3' },
        itemWidth: 16,
        itemHeight: 8
      },
      xAxis: {
        type: 'value' as const,
        min: 0,
        max: 12,
        name: '月龄',
        nameTextStyle: { color: '#B2BEC3', fontSize: 10 },
        axisLine: { lineStyle: { color: '#FFE0EA' } },
        axisTick: { show: false },
        axisLabel: { color: '#B2BEC3', fontSize: 10 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value' as const,
        min: Math.floor(yMin),
        max: Math.ceil(yMax),
        name: 'kg',
        nameTextStyle: { color: '#B2BEC3', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#FFF0F4', type: 'dashed' as const } },
        axisLabel: { color: '#B2BEC3', fontSize: 10 }
      },
      series: [
        {
          name: 'P3',
          type: 'line',
          data: whoData.map((d) => [d.ageMonths, d.p3]),
          smooth: true,
          lineStyle: { width: 1, color: '#DFE6E9', type: 'dashed' as const },
          itemStyle: { color: '#DFE6E9' },
          symbol: 'none',
          silent: true
        },
        {
          name: 'P50',
          type: 'line',
          data: whoData.map((d) => [d.ageMonths, d.p50]),
          smooth: true,
          lineStyle: { width: 1.5, color: '#B2BEC3', type: 'dashed' as const },
          itemStyle: { color: '#B2BEC3' },
          symbol: 'none',
          silent: true
        },
        {
          name: 'P97',
          type: 'line',
          data: whoData.map((d) => [d.ageMonths, d.p97]),
          smooth: true,
          lineStyle: { width: 1, color: '#DFE6E9', type: 'dashed' as const },
          itemStyle: { color: '#DFE6E9' },
          symbol: 'none',
          silent: true
        },
        {
          name: '宝宝体重',
          type: 'line',
          data: userPoints.map((p) => [p.age, p.weight, p.date]),
          smooth: true,
          lineStyle: { width: 2.5, color: '#00B894' },
          itemStyle: { color: '#00B894', borderWidth: 2, borderColor: '#fff' },
          symbol: 'circle',
          symbolSize: 8,
          z: 10
        }
      ]
    };
  }, [records, currentBaby]);

  const heightRecords = useMemo(
    () => records.filter((r) => r.height != null),
    [records]
  );

  const heightChartOption = useMemo(() => {
    if (!currentBaby || heightRecords.length === 0) return {};

    const whoData = getWHOPercentileData(currentBaby.gender, 'height');
    const userPoints = heightRecords.map((r) => ({
      age: Math.max(0, getAgeMonths(r.date)),
      height: r.height as number,
      date: r.date
    }));

    const yMin = Math.min(
      whoData[0]?.p3 || 45,
      ...userPoints.map((p) => p.height)
    ) - 2;
    const yMax = Math.max(
      whoData[whoData.length - 1]?.p97 || 76,
      ...userPoints.map((p) => p.height)
    ) + 2;

    return {
      grid: { top: 30, right: 20, bottom: 30, left: 45, containLabel: false },
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#FFE0EA',
        borderWidth: 1,
        textStyle: { color: '#2D3436', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesName === '宝宝身长') {
            return `${params.data[2]}<br/>月龄: ${params.data[0].toFixed(1)}<br/>身长: <b>${params.data[1]}cm</b>`;
          }
          return `${params.seriesName}<br/>月龄: ${params.data[0]}<br/>身长: ${params.data[1]}cm`;
        }
      },
      legend: {
        data: ['P3', 'P50', 'P97', '宝宝身长'],
        bottom: 0,
        textStyle: { fontSize: 10, color: '#B2BEC3' },
        itemWidth: 16,
        itemHeight: 8
      },
      xAxis: {
        type: 'value' as const,
        min: 0,
        max: 12,
        name: '月龄',
        nameTextStyle: { color: '#B2BEC3', fontSize: 10 },
        axisLine: { lineStyle: { color: '#FFE0EA' } },
        axisTick: { show: false },
        axisLabel: { color: '#B2BEC3', fontSize: 10 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value' as const,
        min: Math.floor(yMin),
        max: Math.ceil(yMax),
        name: 'cm',
        nameTextStyle: { color: '#B2BEC3', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#FFF0F4', type: 'dashed' as const } },
        axisLabel: { color: '#B2BEC3', fontSize: 10 }
      },
      series: [
        {
          name: 'P3',
          type: 'line',
          data: whoData.map((d) => [d.ageMonths, d.p3]),
          smooth: true,
          lineStyle: { width: 1, color: '#DFE6E9', type: 'dashed' as const },
          itemStyle: { color: '#DFE6E9' },
          symbol: 'none',
          silent: true
        },
        {
          name: 'P50',
          type: 'line',
          data: whoData.map((d) => [d.ageMonths, d.p50]),
          smooth: true,
          lineStyle: { width: 1.5, color: '#B2BEC3', type: 'dashed' as const },
          itemStyle: { color: '#B2BEC3' },
          symbol: 'none',
          silent: true
        },
        {
          name: 'P97',
          type: 'line',
          data: whoData.map((d) => [d.ageMonths, d.p97]),
          smooth: true,
          lineStyle: { width: 1, color: '#DFE6E9', type: 'dashed' as const },
          itemStyle: { color: '#DFE6E9' },
          symbol: 'none',
          silent: true
        },
        {
          name: '宝宝身长',
          type: 'line',
          data: userPoints.map((p) => [p.age, p.height, p.date]),
          smooth: true,
          lineStyle: { width: 2.5, color: '#7BC8FF' },
          itemStyle: { color: '#7BC8FF', borderWidth: 2, borderColor: '#fff' },
          symbol: 'circle',
          symbolSize: 8,
          z: 10
        }
      ]
    };
  }, [heightRecords, currentBaby]);

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
        <View className={styles.tabRow}>
          <View
            className={classnames(styles.tab, { [styles.active]: activeTab === 'weight' })}
            onClick={() => setActiveTab('weight')}
          >
            <Text>体重</Text>
          </View>
          <View
            className={classnames(styles.tab, { [styles.active]: activeTab === 'height' })}
            onClick={() => setActiveTab('height')}
          >
            <Text>身长</Text>
          </View>
        </View>

        <View className={styles.chartCard}>
          {activeTab === 'weight' ? (
            records.length === 0 ? (
              <EmptyState
                title="暂无体重数据"
                description="添加一条体重记录开始追踪吧"
              />
            ) : (
              <>
                <View className={styles.chartHeader}>
                  <Text className={styles.chartTitle}>体重曲线</Text>
                  <Text className={styles.whoTag}>WHO 参考</Text>
                </View>
                <EcCanvas option={weightChartOption} height={250} />
              </>
            )
          ) : heightRecords.length === 0 ? (
            <EmptyState
              title="暂无身长数据"
              description="添加带身长的记录开始追踪吧"
            />
          ) : (
            <>
              <View className={styles.chartHeader}>
                <Text className={styles.chartTitle}>身长曲线</Text>
                <Text className={styles.whoTag}>WHO 参考</Text>
              </View>
              <EcCanvas option={heightChartOption} height={250} />
            </>
          )}
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
