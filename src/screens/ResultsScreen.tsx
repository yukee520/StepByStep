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
import DifficultyBadge from '@/components/DifficultyBadge';
import { useTheme } from '@/hooks/useTheme';
import { useGameStore } from '@/store/useGameStore';
import { accuracyPercent } from '@/utils/grading';
import { formatCombo, formatScore } from '@/utils/formatting';
import type { RootStackParamList } from '@/types/navigation';

type ResultsRoute = RouteProp<RootStackParamList, 'Results'>;
type ResultsNav = NativeStackNavigationProp<RootStackParamList, 'Results'>;

export default function ResultsScreen(): React.ReactElement {
  const route = useRoute<ResultsRoute>();
  const navigation = useNavigation<ResultsNav>();
  const { colors } = useTheme();
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

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <ScreenHeader
        title="Results"
        subtitle={summary.songTitle}
        showBack={false}
        rightIcon="close"
        rightAccessibilityLabel="Close results"
        onRightPress={handleHome}
      />

      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        {isNewHighScore ? (
          <View className="items-center mb-4">
            <View
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{ backgroundColor: `${colors.perfect}22` }}
            >
              <Ionicons name="trophy" size={16} color={colors.perfect} />
              <Text
                className="text-sm font-bold ml-2"
                style={{ color: colors.perfect }}
              >
                New High Score!
              </Text>
            </View>
          </View>
        ) : null}

        <View className="items-center mt-2">
          <GradeBadge grade={summary.grade} size="lg" />
          <Text className="text-2xl font-bold text-text dark:text-dark-text mt-4">
            {summary.songTitle}
          </Text>
          <View className="flex-row items-center mt-2">
            <DifficultyBadge difficulty={summary.difficulty} size="md" />
          </View>
        </View>

        <View className="mt-6">
          <Card>
            <View className="items-center">
              <Text className="text-xs uppercase text-muted dark:text-dark-muted">
                Score
              </Text>
              <Text
                className="text-4xl font-extrabold text-text dark:text-dark-text mt-1"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatScore(summary.score)}
              </Text>
              <Text className="text-sm text-muted dark:text-dark-muted mt-1">
                {accuracyPercent(summary.accuracy).toFixed(2)}% accuracy
              </Text>
            </View>
          </Card>
        </View>

        <View className="mt-4">
          <Card>
            <StatRow
              label="Max combo"
              value={`${formatCombo(summary.maxCombo)}x`}
              color={colors.primary}
            />
            <Divider />
            <StatRow label="Perfect" value={`${summary.perfectCount}`} color={colors.perfect} />
            <Divider />
            <StatRow label="Great" value={`${summary.greatCount}`} color={colors.great} />
            <Divider />
            <StatRow label="Good" value={`${summary.goodCount}`} color={colors.good} />
            <Divider />
            <StatRow label="Miss" value={`${summary.missCount}`} color={colors.miss} />
            <Divider />
            <StatRow
              label="Total notes"
              value={`${summary.totalNotes}`}
              color={colors.muted}
            />
          </Card>
        </View>

        {lastSummary?.achievedAt ? null : null}

        <View className="mt-6 space-y-3">
          <Button
            label="Retry"
            icon="refresh"
            size="lg"
            fullWidth
            onPress={handleRetry}
          />
          <View className="h-3" />
          <Button
            label="Song List"
            icon="list"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={handleSongList}
          />
          <View className="h-3" />
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
  );
}

type StatRowProps = {
  label: string;
  value: string;
  color: string;
};

function StatRow({ label, value, color }: StatRowProps): React.ReactElement {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-text dark:text-dark-text">{label}</Text>
      <Text
        className="text-base font-bold"
        style={{ color, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider(): React.ReactElement {
  return <View className="h-px bg-border dark:bg-dark-border" />;
}