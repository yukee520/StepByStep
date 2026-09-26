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
  /** Disabled (used only if we ever need to lock input). */
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
  disabled = false,
}: ArrowButtonProps): React.ReactElement {
  const color = NEON_PALETTE.lane[direction];
  const rgb = hexToRgb(color);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const pressed = pressedValue.value;
    const hot = hotValue.value;
    const burning = hot >= BURNING_OVERLAP ? 1 : 0;
    const warm = hot >= HOT_OVERLAP ? 1 : 0;

    // Background opacity — press dominates, then hot/burning glow.
    const hotBg = warm * 0.18 + burning * 0.22;
    const bgOpacity = interpolate(
      pressed,
      [0, 1],
      [Math.min(hotBg, 0.5), 0.65],
      Extrapolation.CLAMP,
    );

    // Border width — thicker when pressed or when a note is on it.
    const borderWidth = interpolate(
      Math.max(pressed, warm, burning),
      [0, 0.5, 1],
      [3, 3, 4],
      Extrapolation.CLAMP,
    );

    // Border opacity — dim by default, bright when hot/burning.
    const borderOpacity = 0.85 + warm * 0.15;

    // Scale — press shrinks; hot slight grow for a "pop".
    const scale = interpolate(
      pressed,
      [0, 1],
      [1 + warm * 0.04, 0.94],
      Extrapolation.CLAMP,
    );

    return {
      borderWidth,
      borderColor: `rgba(${rgb}, ${borderOpacity})`,
      backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
      transform: [{ scale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const hot = hotValue.value;
    const burning = hot >= BURNING_OVERLAP ? 1 : 0;
    const warm = hot >= HOT_OVERLAP ? 1 : 0;
    const intensity = warm * 0.55 + burning * 0.35;
    return {
      opacity: intensity,
      transform: [{ scale: 1 + intensity * 0.15 }],
    };
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer glow — pulses when a note is on the button. */}
      <AnimatedView
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: size,
            backgroundColor: color,
            opacity: 0,
          },
          glowStyle,
        ]}
      />
      <AnimatedView
        pointerEvents="none"
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 4,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.35 : 1,
          },
          animatedContainerStyle,
        ]}
      >
        <Ionicons
          name={ICON_NAMES[direction]}
          size={size * 0.55}
          color={color}
        />
      </AnimatedView>
    </View>
  );
}