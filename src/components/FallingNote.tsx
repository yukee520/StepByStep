import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { Direction } from '@/types/song';

export type FallingNoteProps = {
  direction: Direction;
  x: number;
  y: number;
  size: number;
  opacity?: number;
};

const ICON_NAMES: Record<Direction, string> = {
  left: 'chevron-back',
  right: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
};

const COLORS: Record<Direction, string> = {
  left: '#FF3366',
  right: '#00E5FF',
  up: '#00FF88',
  down: '#FFD500',
};

export default function FallingNote({
  direction,
  x,
  y,
  size,
  opacity = 1,
}: FallingNoteProps): React.ReactElement {
  const color = COLORS[direction];
  const borderWidth = Math.max(2, size * 0.06);

  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 5,
        borderWidth,
        borderColor: color,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }}
    >
      <Ionicons name={ICON_NAMES[direction]} size={size * 0.6} color={color} />
    </View>
  );
}