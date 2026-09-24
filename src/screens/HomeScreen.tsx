import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '@/components/Button';
import Card from '@/components/Card';
import NeonBackground from '@/components/NeonBackground';
import { NEON_PALETTE } from '@/theme/colors';
import { useScoresStore } from '@/store/useScoresStore';
import { useDevModeStore } from '@/store/useDevModeStore';
import { formatScore } from '@/utils/formatting';
import type { RootStackParamList } from '@/types/navigation';

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeNavigation>();
  const scores = useScoresStore((s) => s.scores);
  const devModeEnabled = useDevModeStore((s) => s.enabled);

  const stats = useMemo(() => {
    const values = Object.values(scores);
    const totalPlays = values.reduce((acc, s) => acc + s.playCount, 0);
    const bestScore = values.reduce(
      (acc, s) => (s.score > acc ? s.score : acc),
      0,
    );
    const topGrade = values.reduce<string | null>((acc, s) => {
      if (!acc) {
        return s.grade;
      }
      const order = ['S', 'A', 'B', 'C', 'D', 'F'];
      return order.indexOf(s.grade) < order.indexOf(acc) ? s.grade : acc;
    }, null);
    return { totalPlays, bestScore, topGrade, songCount: values.length };
  }, [scores]);

  const goPlay = useCallback((): void => {
    navigation.navigate('SongSelect');
  }, [navigation]);
  const goLibrary = useCallback((): void => {
    navigation.navigate('Library');
  }, [navigation]);
  const goSettings = useCallback((): void => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <NeonBackground showGrid>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              marginTop: 12,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              hitSlop={12}
              onPress={goSettings}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0, 229, 255, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={NEON_PALETTE.primary}
              />
            </Pressable>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                fontSize: 42,
                fontWeight: '900',
                color: NEON_PALETTE.text,
                letterSpacing: 1,
                textShadowColor: NEON_PALETTE.primary,
                textShadowRadius: 20,
                textShadowOffset: { width: 0, height: 0 },
              }}
            >
              Step
              <Text style={{ color: NEON_PALETTE.primary }}>By</Text>
              Step
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: NEON_PALETTE.textDim,
                marginTop: 4,
                letterSpacing: 2,
              }}
            >
              HIT THE ARROWS · FEEL THE BEAT
            </Text>
          </View>

          <View style={{ marginTop: 26 }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: 'rgba(0, 229, 255, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="play" size={28} color={NEON_PALETTE.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: NEON_PALETTE.text,
                    }}
                  >
                    Ready to play?
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: NEON_PALETTE.textDim,
                      marginTop: 3,
                    }}
                  >
                    {stats.songCount > 0
                      ? `${stats.songCount} song${
                          stats.songCount > 1 ? 's' : ''
                        } with a high score`
                      : 'Pick a song and start your streak'}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <Button
                  label="Play"
                  icon="musical-notes"
                  size="lg"
                  fullWidth
                  onPress={goPlay}
                />
              </View>

              {devModeEnabled ? (
                <View style={{ marginTop: 12 }}>
                  <Button
                    label="Library"
                    icon="albums-outline"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={goLibrary}
                  />
                </View>
              ) : null}
            </Card>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Card style={{ padding: 12 }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: NEON_PALETTE.textDim,
                    letterSpacing: 1,
                  }}
                >
                  BEST SCORE
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: NEON_PALETTE.primary,
                    marginTop: 6,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatScore(stats.bestScore)}
                </Text>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Card style={{ padding: 12 }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: NEON_PALETTE.textDim,
                    letterSpacing: 1,
                  }}
                >
                  TOTAL PLAYS
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: NEON_PALETTE.text,
                    marginTop: 6,
                  }}
                >
                  {stats.totalPlays}
                </Text>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Card style={{ padding: 12 }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: NEON_PALETTE.textDim,
                    letterSpacing: 1,
                  }}
                >
                  TOP GRADE
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: NEON_PALETTE.text,
                    marginTop: 6,
                  }}
                >
                  {stats.topGrade ?? '—'}
                </Text>
              </Card>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </NeonBackground>
  );
}