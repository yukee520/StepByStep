import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NEON_PALETTE } from '@/theme/colors';
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
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 10,
        backgroundColor: 'rgba(10, 1, 24, 0.85)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 229, 255, 0.12)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pause"
          hitSlop={10}
          onPress={onPause}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
          }}
        >
          <Ionicons name="pause" size={20} color={NEON_PALETTE.primary} />
        </Pressable>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: NEON_PALETTE.text,
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: NEON_PALETTE.textDim,
              marginTop: 2,
            }}
          >
            {msToClock(elapsedMs)} / {msToClock(durationMs)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '900',
              color: NEON_PALETTE.primary,
              fontVariant: ['tabular-nums'],
              letterSpacing: 1,
            }}
          >
            {formatScore(score)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: NEON_PALETTE.textDim,
              marginTop: 2,
            }}
          >
            {accuracyPercent(accuracy).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 10,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(0, 229, 255, 0.15)',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            backgroundColor: NEON_PALETTE.primary,
            shadowColor: NEON_PALETTE.primary,
            shadowOpacity: 1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      </View>
    </View>
  );
}