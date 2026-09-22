import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Note } from '@/types/song';

export type TimelineStripProps = {
  notes: Note[];
  durationMs: number;
  cursorMs: number;
  height?: number;
};

const DIRECTION_COLORS: Record<string, string> = {
  left: '#EF4444',
  right: '#3B82F6',
  up: '#10B981',
  down: '#F59E0B',
};

export default function TimelineStrip({
  notes,
  durationMs,
  cursorMs,
  height = 64,
}: TimelineStripProps): React.ReactElement {
  const { colors } = useTheme();
  const safeDuration = durationMs > 0 ? durationMs : 1;

  return (
    <View
      className="rounded-xl border border-border dark:border-dark-border bg-card dark:bg-dark-card overflow-hidden"
      style={{ height }}
    >
      <View className="flex-1 relative">
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${(cursorMs / safeDuration) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: colors.primary,
          }}
        />
        {notes.map((note) => {
          const leftPct = Math.max(0, Math.min(100, (note.timeMs / safeDuration) * 100));
          const color = DIRECTION_COLORS[note.direction] ?? colors.primary;
          return (
            <View
              key={note.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: '40%',
                width: 3,
                height: '20%',
                borderRadius: 2,
                backgroundColor: color,
              }}
            />
          );
        })}
      </View>

      <View className="flex-row justify-between px-2 pb-1">
        <Text className="text-[10px] text-muted dark:text-dark-muted">0:00</Text>
        <Text className="text-[10px] text-muted dark:text-dark-muted">
          {notes.length} notes
        </Text>
        <Text className="text-[10px] text-muted dark:text-dark-muted">
          {Math.floor(safeDuration / 60000)}:
          {Math.floor((safeDuration % 60000) / 1000)
            .toString()
            .padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}