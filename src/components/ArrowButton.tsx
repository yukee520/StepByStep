import React, { useCallback, useState } from 'react';
import {
  Pressable,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { Direction } from '@/types/song';
import { NEON_PALETTE } from '@/theme/colors';

export type ArrowButtonProps = {
  direction: Direction;
  onPress: (direction: Direction) => void;
  onRelease?: (direction: Direction) => void;
  size?: number;
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
  onPress,
  onRelease,
  size = 76,
  disabled = false,
}: ArrowButtonProps): React.ReactElement {
  const [pressed, setPressed] = useState<boolean>(false);
  const color = NEON_PALETTE.lane[direction];

  const handlePressIn = useCallback(
    (_event: GestureResponderEvent): void => {
      if (disabled) {
        return;
      }
      setPressed(true);
      onPress(direction);
    },
    [direction, disabled, onPress],
  );

  const handlePressOut = useCallback(
    (_event: GestureResponderEvent): void => {
      if (disabled) {
        return;
      }
      setPressed(false);
      onRelease?.(direction);
    },
    [direction, disabled, onRelease],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Hit ${direction}`}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 4,
          borderWidth: pressed ? 4 : 3,
          borderColor: color,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.35 : 1,
          shadowColor: color,
          shadowOpacity: pressed ? 1 : 0.55,
          shadowRadius: pressed ? 22 : 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: pressed ? 12 : 4,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        }}
      >
        <Ionicons name={ICON_NAMES[direction]} size={size * 0.55} color={color} />
      </View>
    </Pressable>
  );
}