import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type HitLineProps = {
  width: number;
  left: number;
};

export default function HitLine({ width, left }: HitLineProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        width,
        height: 3,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.9,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }}
    />
  );
}