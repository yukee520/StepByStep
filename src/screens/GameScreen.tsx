
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
      cancelled = true