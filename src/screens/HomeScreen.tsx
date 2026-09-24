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
import { usePacksStore } from '@/store/usePacksStore';
import { formatScore } from '@/utils/formatting';
import type { RootStackParamList } from '@/types/navigation';

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type MenuItemProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
}: MenuItemProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0, 229, 255, 0.12)' }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: pressed ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: 'rgba(0, 229, 255, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Ionicons name={icon} size={20} color={NEON_PALETTE.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: NEON_PALETTE.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: NEON_PALETTE.textDim,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={NEON_PALETTE.textDim}
      />
    </Pressable>
  );
}

export default function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeNavigation>();
  const scores = useScoresStore((s) => s.scores);
  const installed = usePacksStore((s) => s.installed);

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
    <NeonBackground showGrid>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 20 }}>
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
                fontSize: 14,
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
                  <Ionicons
                    name="play"
                    size={28}
                    color={NEON_PALETTE.primary}
                  />
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
            </Card>
          </View>

          <View
            style={{
              flexDirection: 'row',
              marginTop: 16,
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Card style={{ padding: 12 }}>
                <Text
                  style={{
                    fontSize: 11,
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
                    fontSize: 11,
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
                    fontSize: 11,
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

          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: NEON_PALETTE.textDim,
              letterSpacing: 2,
              marginTop: 28,
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            LIBRARY
          </Text>

          <Card padded={false} style={{ paddingHorizontal: 4 }}>
            <MenuItem
              icon="cloud-download-outline"
              title="Song Packs"
              subtitle={
                packCount > 0
                  ? `${packCount} pack${packCount > 1 ? 's' : ''} installed`
                  : 'Download new songs'
              }
              onPress={goPacks}
            />
            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                marginHorizontal: 14,
              }}
            />
            <MenuItem
              icon="construct-outline"
              title="Chart Builder"
              subtitle="Create a chart from your own music"
              onPress={goBuilder}
            />
            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                marginHorizontal: 14,
              }}
            />
            <MenuItem
              icon="help-circle-outline"
              title="How to Play"
              subtitle="Learn the four directions and timing"
              onPress={goHelp}
            />
            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                marginHorizontal: 14,
              }}
            />
            <MenuItem
              icon="settings-outline"
              title="Settings"
              subtitle="Note speed, offset, sound, theme"
              onPress={goSettings}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </NeonBackground>
  );
}