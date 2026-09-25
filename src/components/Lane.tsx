import React from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import FallingNote from '@/components/FallingNote';
import { useTheme } from '@/hooks/useTheme';
import type { Note } from '@/types/song';

export type LaneProps = {
  width: number;
  left: number;
  top: number;
  height: number;
  notes: Note[];
  noteSize: number;
  isActive?: boolean;
  audioPosition: SharedValue<number>;
  fallDurationMs: number;
};

export default function Lane({
  width,
  left,
  top,
  height,
  notes,
  noteSize,
  isActive = false,
  audioPosition,
  fallDurationMs,
}: LaneProps): React.ReactElement {
  const { colors } = useTheme();
  const noteX = (width - noteSize) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: isActive ? `${colors.primary}0A` : 'transparent',
      }}
    >
      {notes.map((note) => (
        <FallingNote
          key={note.id}
          direction={note.direction}
          x={noteX}
          audioPosition={audioPosition}
          noteTimeMs={note.timeMs}
          fallDurationMs={fallDurationMs}
          laneHeight={height}
          noteSize={noteSize}
        />
      ))}
    </View>
  );
}