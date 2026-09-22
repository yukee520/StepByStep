import React from 'react';
import { View } from 'react-native';
import FallingNote from '@/components/FallingNote';
import { useTheme } from '@/hooks/useTheme';
import type { Note } from '@/types/song';

export type LaneProps = {
  width: number;
  left: number;
  top: number;
  height: number;
  notes: Array<{ note: Note; yRatio: number }>;
  noteSize: number;
  isActive?: boolean;
};

export default function Lane({
  width,
  left,
  top,
  height,
  notes,
  noteSize,
  isActive = false,
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
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: isActive ? colors.primary : colors.border,
        backgroundColor: isActive ? `${colors.primary}0D` : 'transparent',
      }}
    >
      {notes.map(({ note, yRatio }) => (
        <FallingNote
          key={note.id}
          direction={note.direction}
          x={noteX}
          y={yRatio * height - noteSize / 2}
          size={noteSize}
        />
      ))}
    </View>
  );
}