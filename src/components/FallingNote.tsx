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
  /** Absolute x within the lane container. */
  x: number;
  /** Song time in ms — shared value that ticks every frame. */
  audioPosition: SharedValue<number>;
  /** When this note should reach the hit line (ms). */
  noteTimeMs: number;
  /** Fall duration for this song (ms). */
  fallDurationMs: number;
  /** Lane height in px. */
  laneHeight: number;
  /** Size of the note square. */
  noteSize: number;
  /** Optional opacity boost for held notes (Phase 1c). */
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
    // yRatio: 0 = top of lane, 1 = hit line
    // When audio == noteTimeMs, ratio = 1
    const delta = noteTimeMs - now;
    const ratio = 1 - delta / fallDurationMs;
    // Convert ratio to pixel Y (center of note)
    const y = ratio * laneHeight - noteSize / 2;

    // Fade in when note appears from the top, fade out when past the hit line
    const fade = interpolate(
      ratio,
      [-0.2, 0, 0.05, 1.05, 1.15],
      [0, 1, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    // Scale up slightly as it approaches the hit line for emphasis
    const scale = interpolate(
      ratio,
      [0.7, 1],
      [1, 1.15],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateY: y },
        { scale },
      ],
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