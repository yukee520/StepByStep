import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import type { Direction } from '@/types/song';
import { NEON_PALETTE } from '@/theme/colors';

export type FallingNoteProps = {
  direction: Direction;
  x: number;
  audioPosition: SharedValue<number>;
  noteTimeMs: number;
  fallDurationMs: number;
  laneHeight: number;
  noteSize: number;
  opacity?: number;
};

const ICON_NAMES: Record<Direction, string> = {
  left: 'chevron-back',
  right: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
};

const AnimatedView = Animated.createAnimatedComponent(View);

export default function FallingNote({
  direction,
  x,
  audioPosition,
  noteTimeMs,
  fallDurationMs,
  laneHeight,
  noteSize,
  opacity = 1,
}: FallingNoteProps): React.ReactElement {
  const color = NEON_PALETTE.lane[direction];
  const borderWidth = Math.max(2, noteSize * 0.06);

  const animatedStyle = useAnimatedStyle(() => {
    const now = audioPosition.value;
    const delta = noteTimeMs - now;
    const ratio = 1 - delta / fallDurationMs;
    const y = ratio * laneHeight - noteSize / 2;

    const fade = interpolate(
      ratio,
      [-0.2, 0, 0.05, 1.05, 1.15],
      [0, 1, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      ratio,
      [0.7, 1],
      [1, 1.15],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY: y }, { scale }],
      opacity: fade * opacity,
    };
  });

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x,
          top: 0,
          width: noteSize,
          height: noteSize,
          borderRadius: noteSize / 5,
          borderWidth,
          borderColor: color,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={ICON_NAMES[direction]} size={noteSize * 0.6} color={color} />
    </AnimatedView>
  );
}