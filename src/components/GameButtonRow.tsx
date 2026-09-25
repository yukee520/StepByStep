import React from 'react';
import { View } from 'react-native';
import ArrowRow from '@/components/ArrowRow';
import type { Direction } from '@/types/song';

export type GameButtonRowProps = {
  top: number;
  bottomPadding: number;
  buttonSize: number;
  gap: number;
  horizontalPadding: number;
  hotLevels: Record<Direction, number>;
  onPress: (direction: Direction) => void;
  onRelease: (direction: Direction) => void;
};

function GameButtonRowBase({
  top,
  bottomPadding,
  buttonSize,
  gap,
  horizontalPadding,
  hotLevels,
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
        hotLevels={hotLevels}
        horizontalPadding={horizontalPadding}
      />
    </View>
  );
}

const GameButtonRow = React.memo(GameButtonRowBase);
export default GameButtonRow;