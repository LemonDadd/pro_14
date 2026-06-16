import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import type { EventType, FeedSide, DiaperType, BabyEvent } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';
import classnames from 'classnames';

const typeConfig: Record<EventType, { label: string; icon: string }> = {
  feed: { label: '喂奶', icon: '🍼' },
  diaper: { label: '尿布', icon: '🧷' },
  sleep: { label: '睡眠', icon: '😴' },
  other: { label: '其他', icon: '📝' }
};

const LogNewPage: React.FC = () => {
  const router = useRouter();
  const { currentBaby, initStore, addEvent, updateEvent, events } = useBabyStore();

  const [isEdit, setIsEdit] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BabyEvent | null>(null);
  const [eventType, setEventType] = useState<EventType>('feed');

  const [feedMl, setFeedMl] = useState('');
  const [feedSide, setFeedSide] = useState<FeedSide | ''>('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [diaperType, setDiaperType] = useState<DiaperType | ''>('');
  const [diaperNote, setDiaperNote] = useState('');

  const [temperature, setTemperature] = useState('');
  const [medication, setMedication] = useState('');
  const [otherNote, setOtherNote] = useState('');

  const [note, setNote] = useState('');

  useEffect(() => {
    initStore();
  }, [initStore]);

  useEffect(() => {
    const eventId = router.params.eventId;
    if (eventId && events.length > 0) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setIsEdit(true);
        setEditingEvent(event);
        setEventType(event.type);
        setNote(event.note || '');

        if (event.type === 'feed' && event.feedData) {
          setFeedMl(event.feedData.amountMl ? String(event.feedData.amountMl) : '');
          setFeedSide(event.feedData.side || '');
          setTimerSeconds(event.feedData.durationSec || 0);
        } else if (event.type === 'diaper' && event.diaperData) {
          setDiaperType(event.diaperData.type);
          setDiaperNote(event.diaperData.colorNote || '');
        } else if (event.type === 'sleep' && event.sleepData) {
          setTimerSeconds(event.sleepData.durationSec || 0);
        } else if (event.type === 'other' && event.otherData) {
          setTemperature(event.otherData.temperature ? String(event.otherData.temperature) : '');
          setMedication(event.otherData.medication || '');
          setOtherNote(event.otherData.note || '');
        }
      }
    }
  }, [router.params.eventId, events]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (!currentBaby) {
      Taro.showToast({ title: '请先添加宝宝', icon: 'none' });
      return;
    }

    let eventData: Record<string, any> = {
      type: eventType,
      timestamp: isEdit && editingEvent ? editingEvent.timestamp : Date.now()
    };

    if (eventType === 'feed') {
      const feedData: any = {};
      if (feedMl) {
        const ml = parseInt(feedMl);
        if (!isNaN(ml) && ml > 0) {
          feedData.amountMl = ml;
        }
      }
      if (feedSide) {
        feedData.side = feedSide;
      }
      if (timerSeconds > 0) {
        feedData.durationSec = timerSeconds;
      }
      if (Object.keys(feedData).length === 0 && !note) {
        Taro.showToast({ title: '请填写喂奶信息', icon: 'none' });
        return;
      }
      eventData.feedData = feedData;
    } else if (eventType === 'diaper') {
      if (!diaperType) {
        Taro.showToast({ title: '请选择尿布类型', icon: 'none' });
        return;
      }
      eventData.diaperData = {
        type: diaperType,
        colorNote: diaperNote || undefined
      };
    } else if (eventType === 'sleep') {
      if (timerSeconds < 60) {
        Taro.showToast({ title: '睡眠时间太短', icon: 'none' });
        return;
      }
      eventData.sleepData = { durationSec: timerSeconds };
    } else if (eventType === 'other') {
      const otherData: any = {};
      if (temperature) {
        const t = parseFloat(temperature);
        if (!isNaN(t)) otherData.temperature = t;
      }
      if (medication) otherData.medication = medication;
      if (otherNote) otherData.note = otherNote;
      if (Object.keys(otherData).length === 0 && !note) {
        Taro.showToast({ title: '请填写内容', icon: 'none' });
        return;
      }
      eventData.otherData = otherData;
    }

    if (note) {
      eventData.note = note;
    }

    try {
      if (isEdit && editingEvent) {
        updateEvent(editingEvent.id, eventData as any);
        Taro.showToast({ title: '修改成功', icon: 'success' });
      } else {
        addEvent(eventData as any);
        Taro.showToast({ title: '记录成功', icon: 'success' });
      }
      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch (e) {
      console.error('[LogNew] Failed to save event:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
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
      <View className={styles.navBar}>
        <Text className={styles.navBack} onClick={() => Taro.navigateBack()}>← 返回</Text>
        <Text className={styles.navTitle}>{isEdit ? '编辑记录' : '新建记录'}</Text>
        <View className={styles.navPlaceholder} />
      </View>

      <View className={styles.typeSelector}>
        {(['feed', 'diaper', 'sleep', 'other'] as EventType[]).map((type) => (
          <View
            key={type}
            className={classnames(styles.typeCard, {
              [styles.active]: eventType === type,
              [styles.disabled]: isEdit
            })}
            onClick={() => {
              if (!isEdit) {
                setEventType(type);
                handleResetTimer();
              }
            }}
          >
            <Text className={styles.typeIcon}>{typeConfig[type].icon}</Text>
            <Text className={styles.typeLabel}>{typeConfig[type].label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.formCard}>
        {(eventType === 'feed' || eventType === 'sleep') && (
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              {eventType === 'sleep' ? '睡眠计时' : '喂奶计时'}
            </Text>
            <View className={styles.timerSection}>
              <View
                className={classnames(styles.timerBtn, styles.reset)}
                onClick={handleResetTimer}
              >
                <Text>重置</Text>
              </View>
              <Text className={styles.timerDisplay}>
                {formatTimer(timerSeconds)}
              </Text>
              {!isTimerRunning ? (
                <View
                  className={classnames(styles.timerBtn, styles.start)}
                  onClick={handleStartTimer}
                >
                  <Text>开始</Text>
                </View>
              ) : (
                <View
                  className={classnames(styles.timerBtn, styles.stop)}
                  onClick={handleStopTimer}
                >
                  <Text>停止</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {eventType === 'feed' && (
          <>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>奶量 (ml)</Text>
              <Input
                className={styles.formInput}
                type="number"
                value={feedMl}
                onInput={(e) => setFeedMl(e.detail.value)}
                placeholder="例如 120"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>侧别</Text>
              <View className={styles.optionRow}>
                {(['L', 'R', 'bottle'] as FeedSide[]).map((side) => (
                  <View
                    key={side}
                    className={classnames(styles.optionBtn, {
                      [styles.active]: feedSide === side
                    })}
                    onClick={() => setFeedSide(side)}
                  >
                    <Text>{side === 'L' ? '左侧' : side === 'R' ? '右侧' : '瓶喂'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {eventType === 'diaper' && (
          <>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>类型</Text>
              <View className={styles.optionRow}>
                {(['wet', 'dirty', 'both'] as DiaperType[]).map((type) => (
                  <View
                    key={type}
                    className={classnames(styles.optionBtn, {
                      [styles.active]: diaperType === type
                    })}
                    onClick={() => setDiaperType(type)}
                  >
                    <Text>
                      {type === 'wet'
                        ? '嘘嘘'
                        : type === 'dirty'
                        ? '便便'
                        : '嘘嘘+便便'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>颜色备注</Text>
              <Input
                className={styles.formInput}
                type="text"
                value={diaperNote}
                onInput={(e) => setDiaperNote(e.detail.value)}
                placeholder="例如：金黄色、绿色等（可选）"
              />
            </View>
          </>
        )}

        {eventType === 'other' && (
          <>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>体温 (°C)</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={temperature}
                onInput={(e) => setTemperature(e.detail.value)}
                placeholder="例如 36.5（可选）"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>用药</Text>
              <Input
                className={styles.formInput}
                type="text"
                value={medication}
                onInput={(e) => setMedication(e.detail.value)}
                placeholder="例如：维生素D（可选）"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注</Text>
              <Input
                className={styles.formInput}
                type="text"
                value={otherNote}
                onInput={(e) => setOtherNote(e.detail.value)}
                placeholder="自由备注（可选）"
              />
            </View>
          </>
        )}

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>通用备注</Text>
          <Input
            className={styles.formInput}
            type="text"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
            placeholder="添加备注（可选）"
          />
        </View>
      </View>

      <View className={styles.submitBtn} onClick={handleSubmit}>
        <Text>{isEdit ? '保存修改' : '保存记录'}</Text>
      </View>
    </View>
  );
};

export default LogNewPage;
