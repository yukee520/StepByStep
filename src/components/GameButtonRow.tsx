// src/components/GameButtonRow.tsx
import React from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import ArrowRow from '@/components/ArrowRow';
import type { Direction } from '@/types/song';

export type GameButtonRowProps = {
  top: number;
  bottomPadding: number;
  buttonSize: number;
  gap: number;
  horizontalPadding: number;
  /**
   * Per-direction hot-overlap shared values (0..1).
   * Updated every frame by the game engine.
   */
  hotValues: Record<Direction, SharedValue<number>>;
  onPress: (direction: Direction) => void;
  onRelease: (direction: Direction) => void;
};

function GameButtonRowBase({
  top,
  bottomPadding,
  buttonSize,
  gap,
  horizontalPadding,
  hotValues,
  onPress,
  onRelease,
}: GameButtonRowProps): React.ReactElement {
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        paddingBottom: bottomPadding,
      }}
    >
      <ArrowRow
        onPress={onPress}
        onRelease={onRelease}
        buttonSize={buttonSize}
        gap={gap}
        hotValues={hotValues}
        horizontalPadding={horizontalPadding}
      />
    </View>
  );
}

const GameButtonRow = React.memo(GameButtonRowBase);
export default GameButtonRow;