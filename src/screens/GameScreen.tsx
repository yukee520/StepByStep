import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import ArrowButton from '@/components/ArrowButton';
import Lane from '@/components/Lane';
import HitLine from '@/components/HitLine';
import GameHUD from '@/components/GameHUD';
import CountdownOverlay from '@/components/CountdownOverlay';
import PauseModal from '@/components/PauseModal';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { useSongs } from '@/hooks/useSongs';
import { useGameEngine, type HitFeedback } from '@/hooks/useGameEngine';
import { useAudio } from '@/hooks/useAudio';
import { useCountdown } from '@/hooks/useCountdown';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useScoresStore } from '@/store/useScoresStore';
import { useGameStore } from '@/store/useGameStore';
import { DIRECTIONS, type Direction, type Song } from '@/types/song';
import type { GameRunSummary } from '@/types/game';
import type { RootStackParamList } from '@/types/navigation';
import { accuracyToGrade } from '@/utils/grading';

type GameRoute = RouteProp<RootStackParamList, 'Game'>;
type GameNav = NativeStackNavigationProp<RootStackParamList, 'Game'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LANE_COUNT = 4;
const LANE_AREA_PADDING = 12;
const LANE_AREA_WIDTH = SCREEN_W - LANE_AREA_PADDING * 2;
const LANE_WIDTH = LANE_AREA_WIDTH / LANE_COUNT;

const HUD_HEIGHT = 110;
const BUTTON_AREA_HEIGHT = 130;
const LANE_AREA_TOP = HUD_HEIGHT + 20;

export default function GameScreen(): React.ReactElement {
  const route = useRoute<GameRoute>();
  const navigation = useNavigation<GameNav>();
  const { colors } = useTheme();
  const { songs, isLoading, isError, error, refetch } = useSongs();
  const noteSpeed = useSettingsStore((s) => s.settings.noteSpeed);
  const inputOffsetMs = useSettingsStore((s) => s.settings.inputOffsetMs);
  const submitScore = useScoresStore((s) => s.submitScore);
  const setLastSummary = useGameStore((s) => s.setLastSummary);
  const { vibrate } = useHaptics();

  const song = useMemo<Song | undefined>(
    () => songs.find((s) => s.id === route.params.songId),
    [route.params.songId, songs],
  );

  const [feedback, setFeedback] = useState<HitFeedback | null>(null);
  const [showPause, setShowPause] = useState<boolean>(false);
  const [countdownActive, setCountdownActive] = useState<boolean>(false);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audio = useAudio();

  const onFinish = useCallback(
    (summary: GameRunSummary): void => {
      if (!song) {
        return;
      }
      const isHigh = submitScore({
        songId: song.id,
        score: summary.score,
        maxCombo: summary.maxCombo,
        accuracy: summary.accuracy,
        grade: accuracyToGrade(summary.accuracy),
        difficulty: song.difficulty,
      });
      const enriched: GameRunSummary = { ...summary, isHighScore: isHigh };
      setLastSummary(enriched);
      audio.stop();
      navigation.replace('Results', { summary: enriched });
    },
    [audio, navigation, setLastSummary, song, submitScore],
  );

  const onNoteHit = useCallback(
    (fb: HitFeedback): void => {
      setFeedback(fb);
      if (feedbackTimeoutRef.current !== null) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 260);

      if (fb.judgment === 'perfect' || fb.judgment === 'great') {
        vibrate('light');
      } else if (fb.judgment === 'miss') {
        vibrate('heavy');
      }
    },
    [vibrate],
  );

  const engine = useGameEngine({
    song:
      song ?? {
        id: 'placeholder',
        title: '',
        artist: '',
        bpm: 120,
        durationMs: 1000,
        difficulty: 'normal',
        offsetMs: 0,
        source: 'builtin',
        version: 0,
        chart: { difficulty: 'normal', laneCount: 4, notes: [] },
      },
    inputOffsetMs,
    onFinish,
    onNoteHit,
  });

  const beginPlay = useCallback((): void => {
    engine.start();
  }, [engine]);

  const countdown = useCountdown(3, beginPlay, 700);

  useEffect(() => {
    if (!song) {
      return;
    }
    let cancelled = false;
    const init = async (): Promise<void> => {
      if (song.audioPath) {
        const ok = await audio.load(song.audioPath);
        if (!cancelled) {
          setAudioReady(ok);
          if (!ok) {
            Toast.show({
              type: 'info',
              text1: 'Playing without audio',
              text2: 'Audio could not be loaded.',
              position: 'bottom',
            });
          }
        }
      } else {
        setAudioReady(true);
      }
    };
    void init();
    return () => {
      cancelled = true;
      void audio.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]);

  useEffect(() => {
    if (!song) {
      return;
    }
    if (!audioReady) {
      return;
    }
    if (!countdown.isRunning && engine.status === 'idle') {
      setCountdownActive(true);
      countdown.start(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioReady, song?.id]);

  useEffect(() => {
    if (!countdown.isRunning) {
      setCountdownActive(false);
    }
  }, [countdown.isRunning]);

  useEffect(() => {
    if (engine.status === 'playing' && song?.audioPath) {
      audio.play(0);
    }
  }, [audio, engine.status, song?.audioPath]);

  const handlePause = useCallback((): void => {
    engine.pause();
    audio.pause();
    setShowPause(true);
  }, [audio, engine]);

  const handleResume = useCallback((): void => {
    setShowPause(false);
    engine.resume();
    audio.resume();
  }, [audio, engine]);

  const handleRestart = useCallback((): void => {
    setShowPause(false);
    audio.stop();
    engine.restart();
    if (song?.audioPath) {
      audio.play(0);
    }
  }, [audio, engine, song?.audioPath]);

  const handleQuit = useCallback((): void => {
    setShowPause(false);
    engine.quit();
  }, [engine]);

  const handleInput = useCallback(
    (direction: Direction): void => {
      if (engine.status !== 'playing') {
        return;
      }
      engine.hit(direction);
    },
    [engine],
  );

  const handleRelease = useCallback(
    (direction: Direction): void => {
      engine.releaseInput(direction);
    },
    [engine],
  );

  const feedbackColor = useMemo((): string => {
    if (!feedback) {
      return 'transparent';
    }
    switch (feedback.judgment) {
      case 'perfect':
        return colors.perfect;
      case 'great':
        return colors.great;
      case 'good':
        return colors.good;
      case 'miss':
      default:
        return colors.miss;
    }
  }, [colors, feedback]);

  const feedbackLabel = useMemo((): string => {
    if (!feedback) {
      return '';
    }
    switch (feedback.judgment) {
      case 'perfect':
        return 'PERFECT';
      case 'great':
        return 'GREAT';
      case 'good':
        return 'GOOD';
      case 'miss':
      default:
        return 'MISS';
    }
  }, [feedback]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <LoadingState fullscreen label="Loading song…" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <ErrorState
          fullscreen
          title="Could not load song"
          message={error?.message ?? 'Please try again.'}
          onRetry={() => {
            void refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  if (!song) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <ErrorState
          fullscreen
          title="Song not found"
          message="It may have been removed. Go back to the song list."
          onRetry={() => {
            navigation.goBack();
          }}
        />
      </SafeAreaView>
    );
  }

  const laneAreaTop = LANE_AREA_TOP;
  const laneAreaHeight = SCREEN_H - LANE_AREA_TOP - BUTTON_AREA_HEIGHT - 24;
  const hitLineY = laneAreaTop + laneAreaHeight - 12;
  const buttonSize = Math.min(76, (SCREEN_W - LANE_AREA_PADDING * 2 - 36) / 4);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <GameHUD
        title={song.title}
        score={engine.score}
        combo={engine.combo}
        accuracy={engine.accuracy}
        elapsedMs={engine.elapsedMs}
        durationMs={engine.durationMs}
        progress={engine.progress}
        onPause={handlePause}
      />

      <View style={{ flex: 1 }}>
        {/* Lane area: four vertical columns where notes fall */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: LANE_AREA_PADDING,
            top: laneAreaTop,
            width: LANE_AREA_WIDTH,
            height: laneAreaHeight,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          {DIRECTIONS.map((_dir, index) => {
            const laneNotes = engine.visibleNotes.filter(
              (n) => DIRECTIONS.indexOf(n.note.direction) === index,
            );
            return (
              <Lane
                key={index}
                width={LANE_WIDTH}
                left={index * LANE_WIDTH}
                top={0}
                height={laneAreaHeight}
                notes={laneNotes}
                noteSize={Math.min(56, LANE_WIDTH * 0.75 * noteSpeed)}
              />
            );
          })}
        </View>

        {/* The horizontal target line notes must reach */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: LANE_AREA_PADDING,
            top: hitLineY,
            width: LANE_AREA_WIDTH,
          }}
        >
          <HitLine width={LANE_AREA_WIDTH} left={0} />
        </View>

        {/* Judgment label overlay above the lane area */}
        {feedback ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: laneAreaTop - 32,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: feedbackColor,
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: 2,
              }}
            >
              {feedbackLabel}
            </Text>
          </View>
        ) : null}

        {/* Four arrow buttons in a single row, aligned with the four lanes above */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: BUTTON_AREA_HEIGHT,
            paddingHorizontal: LANE_AREA_PADDING,
            paddingTop: 12,
            paddingBottom: 20,
          }}
        >
          <View className="flex-row justify-between items-center">
            <ArrowButton
              direction="left"
              onPress={handleInput}
              onRelease={handleRelease}
              size={buttonSize}
            />
            <ArrowButton
              direction="down"
              onPress={handleInput}
              onRelease={handleRelease}
              size={buttonSize}
            />
            <ArrowButton
              direction="up"
              onPress={handleInput}
              onRelease={handleRelease}
              size={buttonSize}
            />
            <ArrowButton
              direction="right"
              onPress={handleInput}
              onRelease={handleRelease}
              size={buttonSize}
            />
          </View>
        </View>
      </View>

      <CountdownOverlay count={countdown.count} visible={countdownActive} />

      <PauseModal
        visible={showPause}
        onResume={handleResume}
        onRestart={handleRestart}
        onQuit={handleQuit}
      />
    </SafeAreaView>
  );
}