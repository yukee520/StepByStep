import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import ArrowButton from '@/components/ArrowButton';
import Lane from '@/components/Lane';
import ComboOverlay from '@/components/ComboOverlay';
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

const LANE_COUNT = 4;
const LANE_AREA_PADDING = 12;
const HUD_FALLBACK_RATIO = 0.10;
const BUTTON_ROW_TOP_RATIO = 0.80;
const BUTTON_GAP = 8;
const BUTTON_BOTTOM_PADDING = 24;

const LANE_COLORS: Record<Direction, string> = {
  left: '#FF3366',
  right: '#00E5FF',
  up: '#00FF88',
  down: '#FFD500',
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
  const [pressedLane, setPressedLane] = useState<Direction | null>(null);
  const [hudHeight, setHudHeight] = useState<number>(0);

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedLaneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const onNoteHit = useCallback((fb: HitFeedback): void => {
    setFeedback(fb);
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 260);
  }, []);

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

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      if (pressedLaneTimeoutRef.current !== null) {
        clearTimeout(pressedLaneTimeoutRef.current);
      }
    };
  }, []);

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
      vibrate('light');
      setPressedLane(direction);
      if (pressedLaneTimeoutRef.current !== null) {
        clearTimeout(pressedLaneTimeoutRef.current);
      }
      pressedLaneTimeoutRef.current = setTimeout(() => {
        setPressedLane(null);
      }, 260);
      if (engine.status !== 'playing') {
        return;
      }
      engine.hit(direction);
    },
    [engine, vibrate],
  );

  const handleRelease = useCallback(
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

  const buttonSize = useMemo(() => {
    const available =
      SCREEN_W - LANE_AREA_PADDING * 2 - BUTTON_GAP * (LANE_COUNT - 1);
    return Math.min(84, available / LANE_COUNT);
  }, [SCREEN_W]);

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

  // Lane area layout: inside the flex container that starts right below the HUD
  const laneAreaTop = hudHeight > 0 ? hudHeight : SCREEN_H * HUD_FALLBACK_RATIO;
  const buttonRowTopScreen = SCREEN_H * BUTTON_ROW_TOP_RATIO;
  const laneAreaHeight = buttonRowTopScreen - laneAreaTop;
  const buttonRowTopInContainer = buttonRowTopScreen - laneAreaTop;
  const laneAreaWidth = SCREEN_W - LANE_AREA_PADDING * 2;
  const laneWidth = laneAreaWidth / LANE_COUNT;
  const noteSize = Math.min(laneWidth * 0.75, buttonSize * 0.9);

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-dark-background"
      edges={['top']}
    >
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
        {/* Lane container — starts right at the top of the flex area (which is right below the HUD) */}
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
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          {DIRECTIONS.map((dir, index) => {
            const laneNotes = engine.visibleNotes.filter(
              (n) => n.note.direction === dir,
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
                isPressed={pressedLane === dir}
                pressColor={LANE_COLORS[dir]}
              />
            );
          })}
        </View>

        {/* Combo overlay — top center of the lane, just below the top edge */}
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
            accentColor={colors.primary}
            mutedColor={colors.muted}
            fontSize={SCREEN_H * 0.06}
            labelSize={SCREEN_W * 0.032}
          />
        </View>

        {/* Judgment feedback — appears just above the button row */}
        {feedback ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: buttonRowTopInContainer - 60,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: feedbackColor,
                fontSize: SCREEN_W * 0.08,
                fontWeight: '800',
                letterSpacing: 3,
                textShadowColor: feedbackColor,
                textShadowRadius: 12,
              }}
            >
              {feedbackLabel}
            </Text>
          </View>
        ) : null}

        {/* Button row — positioned inside the flex container */}
        <View
          style={{
            position: 'absolute',
            top: buttonRowTopInContainer,
            left: 0,
            right: 0,
            paddingHorizontal: LANE_AREA_PADDING,
            paddingTop: 8,
            paddingBottom: BUTTON_BOTTOM_PADDING,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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
        onRestart={handleRestart}
        onQuit={handleQuit}
      />
    </SafeAreaView>
  );
}