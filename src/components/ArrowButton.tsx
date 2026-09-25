import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { Direction } from '@/types/song';
import { NEON_PALETTE } from '@/theme/colors';

export type ArrowButtonProps = {
  direction: Direction;
  size: number;
  /** Player is currently pressing this lane. */
  pressed?: boolean;
  /** A note is over this button — glow brighter as overlap grows (0..1). */
  hotLevel?: number;
  /** Disabled (used only if we ever need to lock input). */
  disabled?: boolean;
};

const ICON_NAMES: Record<Direction, string> = {
  left: 'chevron-back',
  right: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
};

export default function ArrowButton({
  direction,
  size,
  pressed = false,
  hotLevel = 0,
  disabled = false,
}: ArrowButtonProps): React.ReactElement {
  const color = NEON_PALETTE.lane[direction];
  const clampedHot = Math.max(0, Math.min(1, hotLevel));

  // Background opacity: press takes priority, then hot glow
  const bgOpacity = pressed ? 0.55 : clampedHot * 0.35;

  // Border width: thicker when pressed or hot
  const borderWidth = pressed ? 4 : clampedHot > 0.5 ? 4 : 3;

  // Slight scale-down when pressed
  const scale = pressed ? 0.94 : 1;

  return (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        borderWidth,
        borderColor: color,
        backgroundColor:
          bgOpacity > 0
            ? `rgba(${hexToRgb(color)}, ${bgOpacity})`
            : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
        transform: [{ scale }],
      }}
    >
      <Ionicons
        name={ICON_NAMES[direction]}
        size={size * 0.55}
        color={color}
      />
    </View>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}