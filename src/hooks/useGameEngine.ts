// src/hooks/useGameEngine.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import {
  DIFFICULTY_FALL_MULTIPLIER,
  DROP_GRACE_PX,
  FALL_DURATION_MS,
  JUDGMENT_ACCURACY_WEIGHT,
  JUDGMENT_SCORE,
  OVERLAP_WINDOWS,
  computeOverlap,
  noteTopForRatio,
  overlapToJudgment,
  type LaneGeometry,
} from '@/types/game';
import type {
  GameRunSummary,
  GameStatus,
  Judgment,
  JudgmentEvent,
} from '@/types/game';
import type { Direction, Note, Song } from '@/types/song';
import { accuracyToGrade } from '@/utils/grading';
import { genId } from '@/utils/id';
import { audioPlayer } from '@/services/audioPlayer';
import { perfMonitor } from '@/services/perfMonitor';
import { useGameScoreStore } from '@/store/useGameScoreStore';

export type HitFeedback = {
  direction: Direction;
  judgment: Judgment;
  key: string;
  timeMs: number;
};

const LANE_COUNT = 4;
const SLOT_COUNT = 12;

const LANE_INDEX: Record<Direction, number> = {
  left: 0,
  down: 1,
  up: 2,
  right: 3,
};

const DIRECTION_INDEX: Record<Direction, number> = {
  left: 0,
  down: 1,
  up: 2,
  right: 3,
};

export type LaneSharedValues = {
  active: SharedValue<number[]>;
  timeMs: SharedValue<number[]>;
  direction: SharedValue<number[]>;
  hasNotes: SharedValue<number>;
  /** 0..1 overlap of the best note in this lane with the button. */
  hot: SharedValue<number>;
};

export type UseGameEngineOptions = {
  song: Song;
  inputOffsetMs: number;
  useAudioClock: boolean;
  /** Full lane-area height (px). */
  laneHeight: number;
  /** Height of the button rectangle (px). */
  buttonHeight: number;
  /** Height of a falling note sprite (px). */
  noteHeight: number;
  onFinish: (summary: GameRunSummary) => void;
  onNoteHit?: (feedback: HitFeedback) => void;
};

export type UseGameEngineResult = {
  status: GameStatus;
  audioPosition: SharedValue<number>;
  lanes: [LaneSharedValues, LaneSharedValues, LaneSharedValues, LaneSharedValues];
  geometry: LaneGeometry;
  elapsedMs: number;
  durationMs: number;
  progress: number;
  fallDurationMs: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  quit: () => void;
  hit: (direction: Direction) => void;
  releaseInput: (direction: Direction) => void;
};

const FINISH_GRACE_MS = 1200;
const VISIBLE_BEHIND = 0.2;
const VISIBLE_AHEAD = 1.2;

type Stats = {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
};

function findFirstNoteAtOrAfter(notes: Note[], target: number): number {
  let lo = 0;
  let hi = notes.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (notes[mid].timeMs < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

export function useGameEngine(options: UseGameEngineOptions): UseGameEngineResult {
  const {
    song,
    inputOffsetMs,
    useAudioClock,
    laneHeight,
    buttonHeight,
    noteHeight,
    onFinish,
    onNoteHit,
  } = options;

  const fallDurationMs =
    FALL_DURATION_MS * DIFFICULTY_FALL_MULTIPLIER[song.difficulty];
  const leadInMs = fallDurationMs + 100;
  const durationMs = song.durationMs;

  const buttonTop = laneHeight - buttonHeight;
  const buttonCenterY = buttonTop + buttonHeight / 2;

  const geometryRef = useRef<LaneGeometry>({
    laneHeight,
    buttonHeight,
    buttonTop,
    buttonCenterY,
    noteHeight,
  });
  geometryRef.current.laneHeight = laneHeight;
  geometryRef.current.buttonHeight = buttonHeight;
  geometryRef.current.buttonTop = laneHeight - buttonHeight;
  geometryRef.current.buttonCenterY = laneHeight - buttonHeight / 2;
  geometryRef.current.noteHeight = noteHeight;

  const sortedNotes = useRef<Note[]>(
    [...song.chart.notes]
      .filter((n) => n.timeMs >= leadInMs)
      .sort((a, b) => a.timeMs - b.timeMs),
  );

  const [status, setStatus] = useState<GameStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const audioPosition = useSharedValue<number>(0);

  const lane0Active = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane0Time = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane0Dir = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane0Has = useSharedValue<number>(0);
  const lane0Hot = useSharedValue<number>(0);

  const lane1Active = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane1Time = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane1Dir = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane1Has = useSharedValue<number>(0);
  const lane1Hot = useSharedValue<number>(0);

  const lane2Active = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane2Time = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane2Dir = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane2Has = useSharedValue<number>(0);
  const lane2Hot = useSharedValue<number>(0);

  const lane3Active = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane3Time = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane3Dir = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const lane3Has = useSharedValue<number>(0);
  const lane3Hot = useSharedValue<number>(0);

  const lanesRef = useRef<
    [LaneSharedValues, LaneSharedValues, LaneSharedValues, LaneSharedValues]
  >([
    {
      active: lane0Active,
      timeMs: lane0Time,
      direction: lane0Dir,
      hasNotes: lane0Has,
      hot: lane0Hot,
    },
    {
      active: lane1Active,
      timeMs: lane1Time,
      direction: lane1Dir,
      hasNotes: lane1Has,
      hot: lane1Hot,
    },
    {
      active: lane2Active,
      timeMs: lane2Time,
      direction: lane2Dir,
      hasNotes: lane2Has,
      hot: lane2Hot,
    },
    {
      active: lane3Active,
      timeMs: lane3Time,
      direction: lane3Dir,
      hasNotes: lane3Has,
      hot: lane3Hot,
    },
  ]);

  const wallClockStartRef = useRef<number>(0);
  const wallClockPausedRef = useRef<number>(0);
  const judgedRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>('idle');
  const audioEndedAtRef = useRef<number>(0);
  const missPointerRef = useRef<number>(0);
  const lastElapsedUpdateRef = useRef<number>(0);
  const lastFrameAtRef = useRef<number>(0);
  const laneBuffersRef = useRef<Note[][]>([[], [], [], []]);

  const statsRef = useRef<Stats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
  });

  const scoreDirtyRef = useRef<boolean>(false);
  const scoreRafRef = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const flushScore = useCallback((): void => {
    if (scoreRafRef.current !== null) {
      return;
    }
    scoreRafRef.current = requestAnimationFrame(() => {
      scoreRafRef.current = null;
      if (!scoreDirtyRef.current) {
        return;
      }
      scoreDirtyRef.current = false;
      const s = statsRef.current;
      useGameScoreStore.getState().applyAll({
        score: s.score,
        combo: s.combo,
        maxCombo: s.maxCombo,
        perfect: s.perfect,
        great: s.great,
        good: s.good,
        miss: s.miss,
      });
    });
  }, []);

  const resetStats = useCallback((): void => {
    statsRef.current = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
    };
    judgedRef.current = new Set();
    missPointerRef.current = 0;
    lastElapsedUpdateRef.current = 0;
    lastFrameAtRef.current = 0;
    scoreDirtyRef.current = false;
    if (scoreRafRef.current !== null) {
      cancelAnimationFrame(scoreRafRef.current);
      scoreRafRef.current = null;
    }
    setElapsedMs(0);
    useGameScoreStore.getState().resetAll();

    const lanes = lanesRef.current;
    for (let l = 0; l < LANE_COUNT; l += 1) {
      lanes[l].active.value = new Array(SLOT_COUNT).fill(0);
      lanes[l].timeMs.value = new Array(SLOT_COUNT).fill(0);
      lanes[l].direction.value = new Array(SLOT_COUNT).fill(0);
      lanes[l].hasNotes.value = 0;
      lanes[l].hot.value = 0;
    }
  }, []);

  const buildSummary = useCallback((): GameRunSummary => {
    const s = statsRef.current;
    const totalJudged = s.perfect + s.great + s.good + s.miss;
    const weighted =
      s.perfect * JUDGMENT_ACCURACY_WEIGHT.perfect +
      s.great * JUDGMENT_ACCURACY_WEIGHT.great +
      s.good * JUDGMENT_ACCURACY_WEIGHT.good;
    const accuracy = totalJudged > 0 ? weighted / totalJudged : 0;
    const grade = accuracyTo