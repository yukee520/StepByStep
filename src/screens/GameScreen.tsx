import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import Lane from '@/components/Lane';
import ArrowRow from '@/components/ArrowRow';
import ComboOverlay from '@/components/ComboOverlay';
import GameHUD from '@/components/GameHUD';
import CountdownOverlay from '@/components/CountdownOverlay';
import PauseModal from '@/components/PauseModal';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import NeonBackground from '@/components/NeonBackground';
import PerfectPop from '@/components/PerfectPop';
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
import { NEON_PALETTE } from '@/theme/colors';

type GameRoute = RouteProp<RootStackParamList, 'Game'>;
type GameNav = NativeStackNavigationProp<RootStackParamList, 'Game'>;

const LANE_COUNT = 4;
const LANE_AREA_PADDING = 12;
const HUD_FALLBACK_RATIO = 0.10;
const BUTTON_ROW_TOP_RATIO = 0.80;
const BUTTON_GAP = 8;
const BUTTON_BOTTOM_PADDING = 24;

const EMPTY_HOT_LEVELS: Record<Direction, number> = {
  left: 0,
  down: 0,
  up: 0,
  right: 0,
};

export default function GameScreen(): React.ReactElement {
  const route = useRoute<GameRoute>();
  const navigation = useNavigation<GameNav>();
  const { colors } = useTheme();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
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
  const [hudHeight, setHudHeight] = useState<number>(0);

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const pausedByBackgroundRef = useRef<boolean>(false);

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
      void audio.stop();
      navigation.replace('Results', { summary: enriched });
    },
    [audio, navigation, setLastSummary, song, submitScore],
  );

  const onNoteHit = useCallback((fb: HitFeedback): void => {
    setFeedback(fb);
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 260);
  }, []);

  const hasAudio = Boolean(song?.audioPath);

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
    useAudioClock: hasAudio,
    onFinish,
    onNoteHit,
  });

  const beginPlay = useCallback((): void => {
    engine.start();
    if (hasAudio) {
      audio.play(0);
    }
  }, [audio, engine, hasAudio]);

  const countdown = useCountdown(3, beginPlay, 700);

  useEffect(() => {
    if (!song) {
      return;
    }
    let cancelled = false;
    const init = async (): Promise<void> => {
      if (!song.audioPath) {
        setAudioReady(true);
        return;
      }
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
    };
    void init();
    return () => {
      cancelled = true;
      void audio.stop();
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
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev === 'active' && nextState !== 'active') {
        if (engine.status === 'playing') {
          pausedByBackgroundRef.current = true;
          engine.pause();
          audio.pause();
          setShowPause(true);
        }
      }
    });
    return () => {
      subscription.remove();
    };
  }, [audio, engine]);

  const handlePause = useCallback((): void => {
    engine.pause();
    audio.pause();
    setShowPause(true);
  }, [audio, engine]);

  const handleResume = useCallback((): void => {
    setShowPause(false);
    pausedByBackgroundRef.current = false;
    engine.resume();
    audio.resume();
  }, [audio, engine]);

  const handleRestart = useCallback(async (): Promise<void> => {
    setShowPause(false);
    pausedByBackgroundRef.current = false;
    engine.pause();
    if (hasAudio) {
      await audio.restart();
    }
    engine.restart();
  }, [audio, engine, hasAudio]);

  const handleQuit = useCallback((): void => {
    setShowPause(false);
    void audio.stop();
    engine.quit();
  }, [audio, engine]);

  const handleLanePress = useCallback(
    (direction: Direction): void => {
      vibrate('light');
      if (engine.status !== 'playing') {
        return;
      }
      engine.hit(direction);
    },
    [engine, vibrate],
  );

  const handleLaneRelease = useCallback(
    (direction: Direction): void => {
      engine.releaseInput(direction);
    },
    [engine],
  );

  const handleHudLayout = useCallback(
    (height: number): void => {
      if (height > 0 && Math.abs(height - hudHeight) > 1) {
        setHudHeight(height);
      }
    },
    [hudHeight],
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

  const buttonSize = useMemo(() => {
    const available =
      SCREEN_W - LANE_AREA_PADDING * 2 - BUTTON_GAP * (LANE_COUNT - 1);
    return Math.min(84, available / LANE_COUNT);
  }, [SCREEN_W]);

  if (isLoading) {
    return (
      <NeonBackground showGrid={false}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <LoadingState fullscreen label="Loading song…" />
        </SafeAreaView>
      </NeonBackground>
    );
  }

  if (isError) {
    return (
      <NeonBackground showGrid={false}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ErrorState
            fullscreen
            title="Could not load song"
            message={error?.message ?? 'Please try again.'}
            onRetry={() => {
              void refetch();
            }}
          />
        </SafeAreaView>
      </NeonBackground>
    );
  }

  if (!song) {
    return (
      <NeonBackground showGrid={false}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ErrorState
            fullscreen
            title="Song not found"
            message="It may have been removed. Go back to the song list."
            onRetry={() => {
              navigation.goBack();
            }}
          />
        </SafeAreaView>
      </NeonBackground>
    );
  }

  const laneAreaTop = hudHeight > 0 ? hudHeight : SCREEN_H * HUD_FALLBACK_RATIO;
  const buttonRowTopScreen = SCREEN_H * BUTTON_ROW_TOP_RATIO;
  const laneAreaHeight = buttonRowTopScreen - laneAreaTop;
  const buttonRowTopInContainer = buttonRowTopScreen - laneAreaTop;
  const laneAreaWidth = SCREEN_W - LANE_AREA_PADDING * 2;
  const laneWidth = laneAreaWidth / LANE_COUNT;
  const noteSize = Math.min(laneWidth * 0.75, buttonSize * 0.9);

  const hotLevels = EMPTY_HOT_LEVELS;

  return (
    <NeonBackground showGrid={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          onLayout={(e) => {
            handleHudLayout(e.nativeEvent.layout.height);
          }}
        >
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
        </View>

        <View style={{ flex: 1 }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: LANE_AREA_PADDING,
              top: 0,
              width: laneAreaWidth,
              height: laneAreaHeight,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: NEON_PALETTE.border,
              backgroundColor: 'rgba(21, 8, 41, 0.55)',
              overflow: 'hidden',
            }}
          >
            {DIRECTIONS.map((dir, index) => {
              const laneNotes = engine.visibleNotes.filter(
                (n) => n.direction === dir,
              );
              return (
                <Lane
                  key={dir}
                  width={laneWidth}
                  left={index * laneWidth}
                  top={0}
                  height={laneAreaHeight}
                  notes={laneNotes}
                  noteSize={noteSize}
                  isActive={laneNotes.length > 0}
                  audioPosition={engine.audioPosition}
                  fallDurationMs={engine.fallDurationMs}
                />
              );
            })}
          </View>

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 12,
              left: 0,
              right: 0,
            }}
          >
            <ComboOverlay
              combo={engine.combo}
              accentColor={NEON_PALETTE.primary}
              mutedColor={NEON_PALETTE.textDim}
              fontSize={SCREEN_H * 0.06}
              labelSize={SCREEN_W * 0.032}
            />
          </View>

          {feedback ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 90,
                left: 0,
                right: 0,
              }}
            >
              <PerfectPop
                judgment={feedback.judgment}
                eventKey={feedback.key}
                color={feedbackColor}
                fontSize={SCREEN_W * 0.08}
              />
            </View>
          ) : null}

          <View
            style={{
              position: 'absolute',
              top: buttonRowTopInContainer,
              left: 0,
              right: 0,
              paddingBottom: BUTTON_BOTTOM_PADDING,
            }}
          >
            <ArrowRow
              onPress={handleLanePress}
              onRelease={handleLaneRelease}
              buttonSize={buttonSize}
              gap={BUTTON_GAP}
              hotLevels={hotLevels}
              horizontalPadding={LANE_AREA_PADDING}
            />
          </View>

          <CountdownOverlay
            count={countdown.count}
            visible={countdownActive}
            laneTop={0}
            laneHeight={laneAreaHeight}
          />
        </View>

        <PauseModal
          visible={showPause}
          onResume={handleResume}
          onRestart={() => {
            void handleRestart();
          }}
          onQuit={handleQuit}
        />
      </SafeAreaView>
    </NeonBackground>
  );
}