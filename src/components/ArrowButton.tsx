// src/components/ArrowButton.tsx
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
import { BURNING_OVERLAP, HOT_OVERLAP } from '@/types/game';

export type ArrowButtonProps = {
  direction: Direction;
  size: number;
  /** 0..1 — 1 when the finger is down on this lane. */
  pressedValue: SharedValue<number>;
  /** 0..1 — overlap of the best note in this lane with the button. */
  hotValue: SharedValue<number>;
  /**
   * 0..1 — 1 while the player is holding a hold note on this lane.
   * Set by the engine; independent of pressedValue (the finger may be down
   * on a hold even when a fresh press isn't occurring).
   */
  heldValue?: SharedValue<number>;
  disabled?: boolean;
};

const ICON_NAMES: Record<Direction, string> = {
  left: 'chevron-back',
  right: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
};

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function ArrowButton({
  direction,
  size,
  pressedValue,
  hotValue,
  heldValue,
  disabled = false,
}: ArrowButtonProps): React.ReactElement {
  const color = NEON_PALETTE.lane[direction];
  const rgb = hexToRgb(color);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const pressed = pressedValue.value;
    const hot = hotValue.value;
    const held = heldValue ? heldValue.value : 0;
    const burning = hot >= BURNING_OVERLAP ? 1 : 0;
    const warm = hot >= HOT_OVERLAP ? 1 : 0;

    // Held glow is a strong, steady presence.
    const heldBoost = held * 0