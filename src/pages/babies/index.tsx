import React, { useEffect, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import type { BabyGender, FeedPreference } from '@/types';
import { formatAge } from '@/utils/time';
import BabyAvatar from '@/components/BabyAvatar';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';
import classnames from 'classnames';

const BabiesPage: React.FC = () => {
  const { babies, currentBaby, initStore, addBaby, deleteBaby, setCurrentBaby } = useBabyStore();

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formBirthday, setFormBirthday] = useState('');
  const [formGender, setFormGender] = useState<BabyGender>('girl');
  const [formBirthWeight, setFormBirthWeight] = useState('');
  const [formBirthHeight, setFormBirthHeight] = useState('');
  const [formFeedPref, setFormFeedPref] = useState<FeedPreference>('mixed');

  useEffect(() => {
    initStore();
  }, [initStore]);

  const handleAddBaby = () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!formBirthday) {
      Taro.showToast({ title: '请选择生日', icon: 'none' });
      return;
    }
    const weight = formBirthWeight ? parseFloat(formBirthWeight) : 3.0;
    const height = formBirthHeight ? parseFloat(formBirthHeight) : 50;

    addBaby({
      nickname: formName.trim(),
      birthday: formBirthday,
      gender: formGender,
      birthWeight: weight,
      birthHeight: height,
      feedPreference: formFeedPref
    });

    Taro.showToast({ title: '已添加', icon: 'success' });
    setShowForm(false);
    setFormName('');
    setFormBirthday('');
    setFormGender('girl');
    setFormBirthWeight('');
    setFormBirthHeight('');
    setFormFeedPref('mixed');
  };

  const handleDeleteBaby = (id: string, name: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除宝宝「${name}」吗？相关记录也会一并删除。`,
      confirmColor: '#E17055',
      success: (res) => {
        if (res.confirm) {
          deleteBaby(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const handleSwitchBaby = (id: string) => {
    setCurrentBaby(id);
    Taro.showToast({ title: '已切换', icon: 'success' });
  };

  const feedPrefLabels: Record<FeedPreference, { label: string; desc: string }> = {
    breast: { label: '母乳为主', desc: '亲喂为主' },
    formula: { label: '配方奶', desc: '瓶喂配方奶' },
    mixed: { label: '混合喂养', desc: '母乳+配方奶' }
  };

  const genderLabels: Record<BabyGender, string> = {
    boy: '男宝',
    girl: '女宝'
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>宝宝管理</Text>
        <Text className={styles.pageSubtitle}>管理宝宝档案，支持多宝宝切换</Text>
      </View>

      <View className={styles.addBtn} onClick={() => setShowForm(true)}>
        <Text>+ 添加宝宝</Text>
      </View>

      {babies.length === 0 ? (
        <EmptyState
          title="还没有添加宝宝"
          description="点击上方按钮添加宝宝档案吧"
        />
      ) : (
        <View className={styles.babyList}>
          {babies.map((baby) => (
            <View
              key={baby.id}
              className={classnames(styles.babyCard, {
                [styles.active]: currentBaby?.id === baby.id
              })}
            >
              <BabyAvatar
                name={baby.nickname}
                color={baby.avatarColor}
                size="lg"
              />
              <View className={styles.babyInfo}>
                <View className={styles.babyNameRow}>
                  <Text className={styles.babyName}>{baby.nickname}</Text>
                  {currentBaby?.id === baby.id && (
                    <View className={styles.currentBadge}>当前</View>
                  )}
                </View>
                <Text className={styles.babyDetail}>
                  {genderLabels[baby.gender]} · {formatAge(baby.birthday)}
                </Text>
                <Text className={styles.babyMeta}>
                  出生 {baby.birthWeight}kg · {baby.birthHeight}cm · {feedPrefLabels[baby.feedPreference].label}
                </Text>
              </View>
              <View className={styles.babyActions}>
                {currentBaby?.id !== baby.id && (
                  <View
                    className={classnames(styles.actionBtn, styles.switch)}
                    onClick={() => handleSwitchBaby(baby.id)}
                  >
                    <Text>切换</Text>
                  </View>
                )}
                <View
                  className={classnames(styles.actionBtn, styles.delete)}
                  onClick={() => handleDeleteBaby(baby.id, baby.nickname)}
                >
                  <Text>删除</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {showForm && (
        <View className={styles.formModal} onClick={() => setShowForm(false)}>
          <View className={styles.formSheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.formHeader}>
              <Text className={styles.formTitle}>添加宝宝</Text>
              <Text className={styles.formClose} onClick={() => setShowForm(false)}>✕</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>昵称 *</Text>
              <Input
                className={styles.formInput}
                type="text"
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
                placeholder="例如：小汤圆"
                maxlength={20}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>生日 *</Text>
              <Input
                className={styles.formInput}
                type="text"
                value={formBirthday}
                onInput={(e) => setFormBirthday(e.detail.value)}
                placeholder="YYYY-MM-DD，例如 2024-01-15"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>性别</Text>
              <View className={styles.genderOptions}>
                {(['girl', 'boy'] as BabyGender[]).map((g) => (
                  <View
                    key={g}
                    className={classnames(styles.genderOption, {
                      [styles.active]: formGender === g
                    })}
                    onClick={() => setFormGender(g)}
                  >
                    <Text>{genderLabels[g]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>出生体重 (kg)</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={formBirthWeight}
                onInput={(e) => setFormBirthWeight(e.detail.value)}
                placeholder="例如 3.2，默认 3.0"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>出生身长 (cm)</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={formBirthHeight}
                onInput={(e) => setFormBirthHeight(e.detail.value)}
                placeholder="例如 50，默认 50"
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>喂养偏好</Text>
              <View className={styles.feedOptions}>
                {(['breast', 'formula', 'mixed'] as FeedPreference[]).map((f) => (
                  <View
                    key={f}
                    className={classnames(styles.feedOption, {
                      [styles.active]: formFeedPref === f
                    })}
                    onClick={() => setFormFeedPref(f)}
                  >
                    <Text className={styles.feedOptionLabel}>
                      {feedPrefLabels[f].label}
                    </Text>
                    <Text className={styles.feedOptionDesc}>
                      {feedPrefLabels[f].desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formSubmit} onClick={handleAddBaby}>
              <Text>保存宝宝档案</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BabiesPage;
