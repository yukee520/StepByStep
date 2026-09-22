import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { formatScore } from '@/utils/formatting';
import { accuracyPercent } from '@/utils/grading';
import { msToClock } from '@/utils/time';

export type GameHUDProps = {
  title: string;
  score: number;
  combo: number;
  accuracy: number;
  elapsedMs: number;
  durationMs: number;
  progress: number;
  onPause: () => void;
};

export default function GameHUD({
  title,
  score,
  combo,
  accuracy,
  elapsedMs,
  durationMs,
  progress,
  onPause,
}: GameHUDProps): React.ReactElement {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <View className="px-4 pt-2 pb-3 bg-background dark:bg-dark-background">
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pause"
          hitSlop={10}
          onPress={onPause}
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="pause" size={22} color={colors.text} />
        </Pressable>

        <View className="flex-1 ml-2">
          <Text
            className="text-sm font-semibold text-text dark:text-dark-text"
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text className="text-[11px] text-muted dark:text-dark-muted">
            {msToClock(elapsedMs)} / {msToClock(durationMs)}
          </Text>
        </View>

        <View className="items-end">
          <Text
            className="text-xl font-bold text-text dark:text-dark-text"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatScore(score)}
          </Text>
          <Text className="text-[11px] text-muted dark:text-dark-muted">
            {accuracyPercent(accuracy).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-2">
        <View className="flex-1 h-1.5 rounded-full bg-border dark:bg-dark-border overflow-hidden">
          <View
            className="h-full bg-primary"
            style={{ width: `${pct * 100}%` }}
          />
        </View>
      </View>

      <View className="items-center mt-2 h-6 justify-center">
        {combo >= 2 ? (
          <Text className="text-base font-bold text-primary dark:text-primary">
            {combo} combo
          </Text>
        ) : null}
      </View>
    </View>
  );
}