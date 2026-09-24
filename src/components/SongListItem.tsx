import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NEON_PALETTE } from '@/theme/colors';
import { formatScore } from '@/utils/formatting';
import { accuracyPercent } from '@/utils/grading';
import { msToClock } from '@/utils/time';
import type { Song, Difficulty } from '@/types/song';
import type { HighScore } from '@/store/useScoresStore';

export type SongListItemProps = {
  song: Song;
  highScore?: HighScore;
  onPress: (song: Song) => void;
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: NEON_PALETTE.neon.green,
  normal: NEON_PALETTE.neon.cyan,
  hard: NEON_PALETTE.neon.purple,
  expert: NEON_PALETTE.neon.pink,
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'EASY',
  normal: 'NORMAL',
  hard: 'HARD',
  expert: 'EXPERT',
};

export default function SongListItem({
  song,
  highScore,
  onPress,
}: SongListItemProps): React.ReactElement {
  const diffColor = DIFFICULTY_COLOR[song.difficulty];
  const hasCover = typeof song.coverPath === 'string' && song.coverPath.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${song.title} by ${song.artist}`}
      onPress={() => onPress(song)}
      style={({ pressed }) => ({
        backgroundColor: 'rgba(26, 11, 46, 0.6)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: pressed
          ? NEON_PALETTE.primary
          : 'rgba(0, 229, 255, 0.18)',
        marginBottom: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: 'rgba(0, 229, 255, 0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {hasCover ? (
          <Image
            source={{ uri: `file://${song.coverPath}` }}
            style={{ width: 56, height: 56 }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name="musical-notes"
            size={26}
            color={NEON_PALETTE.primary}
          />
        )}
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: NEON_PALETTE.text,
          }}
          numberOfLines={1}
        >
          {song.title}
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: NEON_PALETTE.textDim,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {song.artist} · {song.bpm} BPM · {msToClock(song.durationMs)}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 6,
          }}
        >
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: `${diffColor}22`,
              borderWidth: 1,
              borderColor: `${diffColor}66`,
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                letterSpacing: 1,
                color: diffColor,
              }}
            >
              {DIFFICULTY_LABEL[song.difficulty]}
            </Text>
          </View>

          <Ionicons
            name="trophy-outline"
            size={12}
            color={NEON_PALETTE.textDim}
          />
          <Text
            style={{
              fontSize: 11,
              color: NEON_PALETTE.textDim,
              marginLeft: 4,
            }}
            numberOfLines={1}
          >
            {highScore
              ? `${formatScore(highScore.score)} · ${accuracyPercent(
                  highScore.accuracy,
                ).toFixed(1)}% · ${highScore.grade}`
              : 'No score yet'}
          </Text>
        </View>
      </View>

      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(0, 229, 255, 0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        }}
      >
        <Ionicons name="play" size={18} color={NEON_PALETTE.primary} />
      </View>
    </Pressable>
  );
}