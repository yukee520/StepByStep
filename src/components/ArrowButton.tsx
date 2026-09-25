import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import type { Direction } from '@/types/song';
import { NEON_PALETTE } from '@/theme/colors';

export type ArrowButtonProps = {
  direction: Direction;
  size: number;
  /** 0..1 — 1 when the finger is down on this lane. */
  pressedValue: SharedValue<number>;
  /** 0..1 — how much a note overlaps this button. */
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

    // Background opacity: pressed takes priority over hot
    const bgOpacity = interpolate(
      pressed,
      [0, 1],
      [Math.min(hot * 0.35, 1), 0.55],
      Extrapolation.CLAMP,
    );

    // Border width: thicker when pressed or when hot > 0.5
    const borderWidth = interpolate(
      Math.max(pressed, hot),
      [0, 0.5, 1],
      [3, 3, 4],
      Extrapolation.CLAMP,
    );

    // Scale down when pressed
    const scale = interpolate(pressed, [0, 1], [1, 0.94], Extrapolation.CLAMP);

    return {
      borderWidth,
      backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
      transform: [{ scale }],
    };
  });

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          borderColor: color,
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
  );
}

// Keep `withTiming` imported in case we want smooth transitions later.
void withTiming;