import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import GradeBadge from '@/components/GradeBadge';
import NeonBackground from '@/components/NeonBackground';
import { NEON_PALETTE } from '@/theme/colors';
import { useGameStore } from '@/store/useGameStore';
import { accuracyPercent } from '@/utils/grading';
import { formatCombo, formatScore } from '@/utils/formatting';
import type { RootStackParamList } from '@/types/navigation';

type ResultsRoute = RouteProp<RootStackParamList, 'Results'>;
type ResultsNav = NativeStackNavigationProp<RootStackParamList, 'Results'>;

type StatRowProps = {
  label: string;
  value: string;
  color: string;
};

function StatRow({ label, value, color }: StatRowProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
      }}
    >
      <Text style={{ fontSize: 14, color: NEON_PALETTE.textDim }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '800',
          color,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider(): React.ReactElement {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
      }}
    />
  );
}

export default function ResultsScreen(): React.ReactElement {
  const route = useRoute<ResultsRoute>();
  const navigation = useNavigation<ResultsNav>();
  const summary = route.params.summary;
  const lastSummary = useGameStore((s) => s.lastSummary);
  const clearLastSummary = useGameStore((s) => s.clearLastSummary);

  const handleRetry = useCallback((): void => {
    clearLastSummary();
    navigation.replace('Game', { songId: summary.songId });
  }, [clearLastSummary, navigation, summary.songId]);

  const handleSongList = useCallback((): void => {
    clearLastSummary();
    navigation.navigate('SongSelect');
  }, [clearLastSummary, navigation]);

  const handleHome = useCallback((): void => {
    clearLastSummary();
    navigation.navigate('Home');
  }, [clearLastSummary, navigation]);

  const isNewHighScore = summary.isHighScore;
  void lastSummary;

  return (
    <NeonBackground showGrid={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          title="Results"
          subtitle={summary.songTitle}
          showBack={false}
          rightIcon="close"
          rightAccessibilityLabel="Close results"
          onRightPress={handleHome}
        />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {isNewHighScore ? (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255, 213, 0, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 213, 0, 0.5)',
                }}
              >
                <Ionicons
                  name="trophy"
                  size={16}
                  color={NEON_PALETTE.perfect}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    marginLeft: 8,
                    color: NEON_PALETTE.perfect,
                    letterSpacing: 1,
                  }}
                >
                  NEW HIGH SCORE
                </Text>
              </View>
            </View>
          ) : null}

          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <GradeBadge grade={summary.grade} size="lg" />
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: NEON_PALETTE.text,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {summary.songTitle}
            </Text>
          </View>

          <View style={{ marginTop: 24 }}>
            <Card>
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: NEON_PALETTE.textDim,
                    letterSpacing: 2,
                  }}
                >
                  SCORE
                </Text>
                <Text
                  style={{
                    fontSize: 40,
                    fontWeight: '900',
                    color: NEON_PALETTE.primary,
                    marginTop: 6,
                    fontVariant: ['tabular-nums'],
                    textShadowColor: NEON_PALETTE.primary,
                    textShadowRadius: 16,
                    textShadowOffset: { width: 0, height: 0 },
                  }}
                >
                  {formatScore(summary.score)}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: NEON_PALETTE.textDim,
                    marginTop: 6,
                  }}
                >
                  {accuracyPercent(summary.accuracy).toFixed(2)}% accuracy
                </Text>
              </View>
            </Card>
          </View>

          <View style={{ marginTop: 16 }}>
            <Card>
              <StatRow
                label="Max combo"
                value={`${formatCombo(summary.maxCombo)}x`}
                color={NEON_PALETTE.primary}
              />
              <Divider />
              <StatRow
                label="Perfect"
                value={`${summary.perfectCount}`}
                color={NEON_PALETTE.perfect}
              />
              <Divider />
              <StatRow
                label="Great"
                value={`${summary.greatCount}`}
                color={NEON_PALETTE.great}
              />
              <Divider />
              <StatRow
                label="Good"
                value={`${summary.goodCount}`}
                color={NEON_PALETTE.good}
              />
              <Divider />
              <StatRow
                label="Miss"
                value={`${summary.missCount}`}
                color={NEON_PALETTE.miss}
              />
              <Divider />
              <StatRow
                label="Total notes"
                value={`${summary.totalNotes}`}
                color={NEON_PALETTE.textDim}
              />
            </Card>
          </View>

          <View style={{ marginTop: 24, gap: 12 }}>
            <Button
              label="Retry"
              icon="refresh"
              size="lg"
              fullWidth
              onPress={handleRetry}
            />
            <Button
              label="Song List"
              icon="list"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={handleSongList}
            />
            <Button
              label="Home"
              icon="home-outline"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={handleHome}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </NeonBackground>
  );
}