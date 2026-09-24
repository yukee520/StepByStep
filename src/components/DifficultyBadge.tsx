import React from 'react';
import { Text, View } from 'react-native';
import { DIFFICULTY_LABELS } from '@/types/song';
import type { Difficulty } from '@/types/song';
import { NEON_PALETTE } from '@/theme/colors';

export type DifficultyBadgeProps = {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: NEON_PALETTE.neon.green,
  normal: NEON_PALETTE.neon.cyan,
  hard: NEON_PALETTE.neon.purple,
  expert: NEON_PALETTE.neon.pink,
};

export default function DifficultyBadge({
  difficulty,
  size = 'sm',
}: DifficultyBadgeProps): React.ReactElement {
  const color = DIFFICULTY_COLOR[difficulty];
  const padding = size === 'sm' ? { px: 8, py: 3 } : { px: 12, py: 5 };
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <View
      style={{
        paddingHorizontal: padding.px,
        paddingVertical: padding.py,
        borderRadius: 8,
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}88`,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '800',
          letterSpacing: 1,
          color,
        }}
      >
        {DIFFICULTY_LABELS[difficulty].toUpperCase()}
      </Text>
    </View>
  );
}