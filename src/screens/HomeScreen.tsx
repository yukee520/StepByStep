import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useScoresStore } from '@/store/useScoresStore';
import { usePacksStore } from '@/store/usePacksStore';
import { formatScore } from '@/utils/formatting';
import type { RootStackParamList } from '@/types/navigation';

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeNavigation>();
  const { colors } = useTheme();
  const scores = useScoresStore((s) => s.scores);
  const installed = usePacksStore((s) => s.installed);

  const stats = useMemo(() => {
    const values = Object.values(scores);
    const totalPlays = values.reduce((acc, s) => acc + s.playCount, 0);
    const bestScore = values.reduce((acc, s) => (s.score > acc ? s.score : acc), 0);
    const topGrade = values.reduce<string | null>((acc, s) => {
      if (!acc) {
        return s.grade;
      }
      const order = ['S', 'A', 'B', 'C', 'D', 'F'];
      return order.indexOf(s.grade) < order.indexOf(acc) ? s.grade : acc;
    }, null);
    return { totalPlays, bestScore, topGrade, songCount: values.length };
  }, [scores]);

  const packCount = Object.keys(installed).length;

  const goPlay = useCallback((): void => {
    navigation.navigate('SongSelect');
  }, [navigation]);

  const goPacks = useCallback((): void => {
    navigation.navigate('SongPackStore');
  }, [navigation]);

  const goBuilder = useCallback((): void => {
    navigation.navigate('Builder');
  }, [navigation]);

  const goSettings = useCallback((): void => {
    navigation.navigate('Settings');
  }, [navigation]);

  const goHelp = useCallback((): void => {
    navigation.navigate('HowToPlay');
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <ScrollView
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mt-3">
          <View>
            <Text className="text-3xl font-extrabold text-text dark:text-dark-text">
              StepByStep
            </Text>
            <Text className="text-sm text-muted dark:text-dark-muted mt-0.5">
              Hit the arrows. Feel the beat.
            </Text>
          </View>
          <View className="flex-row space-x-2">
            <Button
              label="Settings"
              variant="ghost"
              icon="settings-outline"
              size="sm"
              onPress={goSettings}
            />
          </View>
        </View>

        <View className="mt-6">
          <Card>
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-primary/15 items-center justify-center">
                <Ionicons name="play" size={28} color={colors.primary} />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-lg font-bold text-text dark:text-dark-text">
                  Ready to play?
                </Text>
                <Text className="text-sm text-muted dark:text-dark-muted mt-0.5">
                  {stats.songCount > 0
                    ? `${stats.songCount} song${
                        stats.songCount > 1 ? 's' : ''
                      } with a high score`
                    : 'Pick a song and start your streak'}
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <Button
                label="Play"
                icon="musical-notes"
                size="lg"
                fullWidth
                onPress={goPlay}
              />
            </View>
          </Card>
        </View>

        <View className="flex-row mt-4 space-x-3">
          <View className="flex-1">
            <Card>
              <Text className="text-xs text-muted dark:text-dark-muted">
                Best score
              </Text>
              <Text
                className="text-lg font-bold text-text dark:text-dark-text mt-1"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatScore(stats.bestScore)}
              </Text>
            </Card>
          </View>
          <View className="flex-1">
            <Card>
              <Text className="text-xs text-muted dark:text-dark-muted">
                Total plays
              </Text>
              <Text className="text-lg font-bold text-text dark:text-dark-text mt-1">
                {stats.totalPlays}
              </Text>
            </Card>
          </View>
          <View className="flex-1">
            <Card>
              <Text className="text-xs text-muted dark:text-dark-muted">
                Top grade
              </Text>
              <Text className="text-lg font-bold text-text dark:text-dark-text mt-1">
                {stats.topGrade ?? '—'}
              </Text>
            </Card>
          </View>
        </View>

        <Text className="text-sm font-semibold text-text dark:text-dark-text mt-6 mb-2">
          Library
        </Text>

        <Card padded={false}>
          <View className="px-4">
            <View className="border-b border-border dark:border-dark-border">
              <PressableRow
                icon="cloud-download-outline"
                title="Song Packs"
                subtitle={
                  packCount > 0
                    ? `${packCount} pack${packCount > 1 ? 's' : ''} installed`
                    : 'Download new songs'
                }
                onPress={goPacks}
              />
            </View>
            <View className="border-b border-border dark:border-dark-border">
              <PressableRow
                icon="construct-outline"
                title="Chart Builder"
                subtitle="Create a chart from your own music"
                onPress={goBuilder}
              />
            </View>
            <View className="border-b border-border dark:border-dark-border">
              <PressableRow
                icon="help-circle-outline"
                title="How to Play"
                subtitle="Learn the four directions and timing"
                onPress={goHelp}
              />
            </View>
            <PressableRow
              icon="settings-outline"
              title="Settings"
              subtitle="Note speed, offset, sound, theme"
              onPress={goSettings}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

type PressableRowProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function PressableRow({
  icon,
  title,
  subtitle,
  onPress,
}: PressableRowProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center py-4">
      <Button
        label={title}
        variant="ghost"
        icon={icon}
        size="sm"
        onPress={onPress}
      />
      <View className="ml-2 flex-1">
        <Text className="text-sm text-muted dark:text-dark-muted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </View>
  );
}