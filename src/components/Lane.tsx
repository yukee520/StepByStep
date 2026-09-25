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

function LaneBase({
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

function notesEqual(a: Note[], b: Note[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id) {
      return false;
    }
  }
  return true;
}

const Lane = React.memo(LaneBase, (prev, next) => {
  return (
    prev.width === next.width &&
    prev.left === next.left &&
    prev.top === next.top &&
    prev.height === next.height &&
    prev.noteSize === next.noteSize &&
    prev.isActive === next.isActive &&
    prev.fallDurationMs === next.fallDurationMs &&
    prev.audioPosition === next.audioPosition &&
    notesEqual(prev.notes, next.notes)
  );
});

export default Lane;