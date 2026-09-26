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
    const heldBoost = held * 0.35;

    const hotBg = warm * 0.18 + burning * 0.22 + heldBoost;
    const bgOpacity = interpolate(
      pressed,
      [0, 1],
      [Math.min(hotBg, 0.65), 0.75],
      Extrapolation.CLAMP,
    );

    const borderWidth = interpolate(
      Math.max(pressed, warm, burning, held),
      [0, 0.5, 1],
      [3, 3, 4],
      Extrapolation.CLAMP,
    );

    const borderOpacity = 0.85 + warm * 0.15 + held * 0.15;

    const scale = interpolate(
      pressed,
      [0, 1],
      [1 + warm * 0.04 + held * 0.02, 0.94],
      Extrapolation.CLAMP,
    );

    return {
      borderWidth,
      borderColor: `rgba(${rgb}, ${Math.min(1, borderOpacity)})`,
      backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
      transform: [{ scale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const hot = hotValue.value;
    const held = heldValue ? heldValue.value : 0;
    const burning = hot >= BURNING_OVERLAP ? 1 : 0;
    const warm = hot >= HOT_OVERLAP ? 1 : 0;
    const intensity = warm * 0.55 + burning * 0.35 + held * 0.4;
    return {
      opacity: Math.min(1, intensity),
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