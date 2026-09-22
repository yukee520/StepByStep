import React, { useCallback } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import type { Direction } from '@/types/song';

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

const BG_TINTS: Record<Direction, string> = {
  left: 'rgba(239,68,68,0.15)',
  right: 'rgba(59,130,246,0.15)',
  up: 'rgba(16,185,129,0.15)',
  down: 'rgba(245,158,11,0.15)',
};

const BORDER_TINTS: Record<Direction, string> = {
  left: '#EF4444',
  right: '#3B82F6',
  up: '#10B981',
  down: '#F59E0B',
};

export default function ArrowButton({
  direction,
  onPress,
  onRelease,
  size = 72,
  disabled = false,
}: ArrowButtonProps): React.ReactElement {
  const { colors } = useTheme();
  const accent = BORDER_TINTS[direction];

  const handlePressIn = useCallback(
    (_event: GestureResponderEvent): void => {
      if (disabled) {
        return;
      }
      onPress(direction);
    },
    [direction, disabled, onPress],
  );

  const handlePressOut = useCallback(
    (_event: GestureResponderEvent): void => {
      if (disabled) {
        return;
      }
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
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        borderWidth: 2,
        borderColor: accent,
        backgroundColor: disabled ? colors.border : BG_TINTS[direction],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View>
        <Ionicons name={ICON_NAMES[direction]} size={size * 0.5} color={accent} />
      </View>
    </Pressable>
  );
}