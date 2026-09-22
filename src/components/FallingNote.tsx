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
  left: '#EF4444',
  right: '#3B82F6',
  up: '#10B981',
  down: '#F59E0B',
};

export default function FallingNote({
  direction,
  x,
  y,
  size,
  opacity = 1,
}: FallingNoteProps): React.ReactElement {
  const color = COLORS[direction];
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 4,
        borderWidth: 2,
        borderColor: color,
        backgroundColor: `${color}33`,
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <Ionicons name={ICON_NAMES[direction]} size={size * 0.5} color={color} />
    </View>
  );
}