import React from 'react';
import { Text, View } from 'react-native';
import { DIFFICULTY_LABELS } from '@/types/song';
import type { Difficulty } from '@/types/song';

export type DifficultyBadgeProps = {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
};

function bgClass(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-success/15';
    case 'normal':
      return 'bg-primary/15';
    case 'hard':
      return 'bg-purple-500/15';
    case 'expert':
    default:
      return 'bg-danger/15';
  }
}

function textClass(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'text-success dark:text-success';
    case 'normal':
      return 'text-primary dark:text-primary';
    case 'hard':
      return 'text-purple-600 dark:text-purple-400';
    case 'expert':
    default:
      return 'text-danger dark:text-danger';
  }
}

export default function DifficultyBadge({
  difficulty,
  size = 'sm',
}: DifficultyBadgeProps): React.ReactElement {
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <View className={['rounded-full self-start', padding, bgClass(difficulty)].join(' ')}>
      <Text className={['font-bold uppercase tracking-wide', text, textClass(difficulty)].join(' ')}>
        {DIFFICULTY_LABELS[difficulty]}
      </Text>
    </View>
  );
}