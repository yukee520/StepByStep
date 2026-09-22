import React from 'react';
import { Text, View } from 'react-native';
import type { Grade } from '@/types/game';
import { gradeColor } from '@/utils/grading';

export type GradeBadgeProps = {
  grade: Grade;
  size?: 'md' | 'lg';
};

export default function GradeBadge({
  grade,
  size = 'lg',
}: GradeBadgeProps): React.ReactElement {
  const color = gradeColor(grade);
  const dimension = size === 'lg' ? 128 : 72;
  const fontSize = size === 'lg' ? 72 : 40;
  const borderWidth = size === 'lg' ? 4 : 3;

  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        borderWidth,
        borderColor: color,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color,
          fontSize,
          fontWeight: '800',
          lineHeight: fontSize + 4,
        }}
      >
        {grade}
      </Text>
    </View>
  );
}