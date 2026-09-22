import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DifficultyBadge from '@/components/DifficultyBadge';
import { useTheme } from '@/hooks/useTheme';
import { formatScore } from '@/utils/formatting';
import { accuracyPercent } from '@/utils/grading';
import { msToClock } from '@/utils/time';
import type { Song } from '@/types/song';
import type { HighScore } from '@/store/useScoresStore';

export type SongListItemProps = {
  song: Song;
  highScore?: HighScore;
  onPress: (song: Song) => void;
};

export default function SongListItem({
  song,
  highScore,
  onPress,
}: SongListItemProps): React.ReactElement {
  const { colors } = useTheme();
  const hasCover = typeof song.coverPath === 'string' && song.coverPath.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${song.title} by ${song.artist}`}
      onPress={() => onPress(song)}
      className="bg-card dark:bg-dark-card rounded-2xl border border-border dark:border-dark-border mb-3 overflow-hidden active:opacity-90"
    >
      <View className="flex-row items-center p-3">
        <View className="w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 items-center justify-center overflow-hidden">
          {hasCover ? (
            <Image
              source={{ uri: `file://${song.coverPath}` }}
              style={{ width: 56, height: 56 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="musical-notes" size={26} color={colors.primary} />
          )}
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text
              className="flex-1 text-base font-semibold text-text dark:text-dark-text"
              numberOfLines={1}
            >
              {song.title}
            </Text>
            <DifficultyBadge difficulty={song.difficulty} />
          </View>

          <Text
            className="text-xs text-muted dark:text-dark-muted mt-0.5"
            numberOfLines={1}
          >
            {song.artist} · {song.bpm} BPM · {msToClock(song.durationMs)}
          </Text>

          <View className="flex-row items-center mt-1">
            <Ionicons name="trophy-outline" size={12} color={colors.muted} />
            <Text className="text-[11px] text-muted dark:text-dark-muted ml-1">
              {highScore
                ? `${formatScore(highScore.score)} · ${accuracyPercent(
                    highScore.accuracy,
                  ).toFixed(1)}% · ${highScore.grade}`
                : 'No score yet'}
            </Text>
          </View>
        </View>

        <Ionicons
          name="play-circle"
          size={30}
          color={colors.primary}
          style={{ marginLeft: 8 }}
        />
      </View>
    </Pressable>
  );
}