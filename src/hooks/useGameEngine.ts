// src/hooks/useGameEngine.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import {
  BURNING_OVERLAP,
  DIFFICULTY_FALL_MULTIPLIER,
  DROP_GRACE_PX,
  FALL_DURATION_MS,
  HOT_OVERLAP,
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

  // Button row is at the BOTTOM of the lane area.
  const buttonTop = laneHeight - buttonHeight;
  const buttonCenterY = buttonTop + buttonHeight / 2;

  const geometryRef = useRef<LaneGeometry>({
    laneHeight,
    buttonHeight,
    buttonTop,
    buttonCenterY,
    noteHeight,
  });
  // Keep geometry in sync with props (screen rotation etc.).
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
    const grade = accuracyToGrade(accuracy);
    return {
      songId: song.id,
      songTitle: song.title,
      difficulty: song.difficulty,
      score: s.score,
      maxCombo: s.maxCombo,
      perfectCount: s.perfect,
      greatCount: s.great,
      goodCount: s.good,
      missCount: s.miss,
      totalNotes: sortedNotes.current.length,
      accuracy,
      grade,
      completedAt: Date.now(),
      isHighScore: false,
    };
  }, [song.difficulty, song.id, song.title]);

  const stopLoop = useCallback((): void => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finish = useCallback((): void => {
    stopLoop();
    setStatus('finished');
    statusRef.current = 'finished';
    const summary = buildSummary();
    onFinish(summary);
  }, [buildSummary, onFinish, stopLoop]);

  const getNow = useCallback((): number => {
    if (useAudioClock && audioPlayer.getDurationMs() > 0) {
      return audioPlayer.getPositionMs() - inputOffsetMs;
    }
    return Date.now() - wallClockStartRef.current - inputOffsetMs;
  }, [inputOffsetMs, useAudioClock]);

  /**
   * Compute the note's current top-Y in lane coordinates for a given `now`.
   * Uses the same formula as FallingNote, so judgment and visuals agree.
   */
  const noteTopAt = useCallback(
    (note: Note, now: number): number => {
      const delta = note.timeMs - now;
      const ratio = 1 - delta / fallDurationMs;
      return noteTopForRatio(ratio, geometryRef.current);
    },
    [fallDurationMs],
  );

  /**
   * Overlap of a note with the button for a given `now`.
   */
  const overlapAt = useCallback(
    (note: Note, now: number): number => {
      const top = noteTopAt(note, now);
      return computeOverlap(top, geometryRef.current.noteHeight, geometryRef.current);
    },
    [noteTopAt],
  );

  const processMisses = useCallback(
    (now: number): void => {
      const notes = sortedNotes.current;
      const geom = geometryRef.current;
      const buttonBottom = geom.buttonTop + geom.buttonHeight;
      let i = missPointerRef.current;
      let missedThisFrame = 0;

      while (i < notes.length) {
        const note = notes[i];
        // Early exit — this note can't be missed yet.
        const top = noteTopAt(note, now);
        const bottom = top + geom.noteHeight;
        if (bottom <= buttonBottom + DROP_GRACE_PX) {
          break;
        }
        if (!judgedRef.current.has(note.id)) {
          judgedRef.current.add(note.id);
          statsRef.current.combo = 0;
          statsRef.current.miss += 1;
          missedThisFrame += 1;
          if (onNoteHit) {
            onNoteHit({
              direction: note.direction,
              judgment: 'miss',
              key: genId('fb'),
              timeMs: Date.now(),
            });
          }
        }
        i += 1;
      }
      missPointerRef.current = i;
      if (missedThisFrame > 0) {
        scoreDirtyRef.current = true;
        flushScore();
      }
    },
    [flushScore, noteTopAt, onNoteHit],
  );

  const loop = useCallback((): void => {
    if (statusRef.current !== 'playing') {
      return;
    }

    const frameStart = Date.now();
    if (lastFrameAtRef.current > 0) {
      perfMonitor.record('frame_ms', frameStart - lastFrameAtRef.current);
    }
    lastFrameAtRef.current = frameStart;

    const now = getNow();
    audioPosition.value = now;

    if (now - lastElapsedUpdateRef.current >= 100) {
      lastElapsedUpdateRef.current = now;
      setElapsedMs(now);
    }

    const buffers = laneBuffersRef.current;
    for (let l = 0; l < LANE_COUNT; l += 1) {
      buffers[l].length = 0;
    }

    const notes = sortedNotes.current;
    const loTime = now - fallDurationMs * VISIBLE_BEHIND;
    const hiTime = now + fallDurationMs * VISIBLE_AHEAD;
    const startIdx = findFirstNoteAtOrAfter(notes, loTime);

    for (let i = startIdx; i < notes.length; i += 1) {
      const note = notes[i];
      if (note.timeMs > hiTime) {
        break;
      }
      if (judgedRef.current.has(note.id)) {
        continue;
      }
      const laneIdx = LANE_INDEX[note.direction];
      const buf = buffers[laneIdx];
      if (buf.length < SLOT_COUNT) {
        buf.push(note);
      }
    }

    const geom = geometryRef.current;
    const lanes = lanesRef.current;
    for (let l = 0; l < LANE_COUNT; l += 1) {
      const buf = buffers[l];
      const lane = lanes[l];
      const newActive = new Array(SLOT_COUNT).fill(0);
      const newTime = new Array(SLOT_COUNT).fill(0);
      const newDir = new Array(SLOT_COUNT).fill(0);

      // Track the strongest overlap across all visible notes in this lane.
      let maxOverlap = 0;

      for (let s = 0; s < buf.length; s += 1) {
        const note = buf[s];
        newActive[s] = 1;
        newTime[s] = note.timeMs;
        newDir[s] = DIRECTION_INDEX[note.direction];

        const ov = overlapAt(note, now);
        if (ov > maxOverlap) {
          maxOverlap = ov;
        }
      }

      lane.active.value = newActive;
      lane.timeMs.value = newTime;
      lane.direction.value = newDir;
      lane.hasNotes.value = buf.length > 0 ? 1 : 0;
      // hot: 0..1, represents how "on" the button should look right now.
      lane.hot.value = maxOverlap;
    }

    processMisses(now);

    if (useAudioClock && audioPlayer.hasEnded()) {
      if (audioEndedAtRef.current === 0) {
        audioEndedAtRef.current = Date.now();
      }
      const grace = Date.now() - audioEndedAtRef.current;
      if (grace >= FINISH_GRACE_MS) {
        finish();
        return;
      }
    }

    if (now >= durationMs + FINISH_GRACE_MS) {
      finish();
      return;
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [
    audioPosition,
    durationMs,
    fallDurationMs,
    finish,
    getNow,
    overlapAt,
    processMisses,
    useAudioClock,
  ]);

  const start = useCallback((): void => {
    resetStats();
    wallClockStartRef.current = Date.now();
    wallClockPausedRef.current = 0;
    audioEndedAtRef.current = 0;
    audioPosition.value = 0;
    setStatus('playing');
    statusRef.current = 'playing';
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  }, [audioPosition, loop, resetStats, stopLoop]);

  const pause = useCallback((): void => {
    if (statusRef.current !== 'playing') {
      return;
    }
    wallClockPausedRef.current = Date.now() - wallClockStartRef.current;
    setStatus('paused');
    statusRef.current = 'paused';
    stopLoop();
  }, [stopLoop]);

  const resume = useCallback((): void => {
    if (statusRef.current !== 'paused') {
      return;
    }
    wallClockStartRef.current = Date.now() - wallClockPausedRef.current;
    setStatus('playing');
    statusRef.current = 'playing';
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, stopLoop]);

  const restart = useCallback((): void => {
    stopLoop();
    resetStats();
    wallClockStartRef.current = Date.now();
    wallClockPausedRef.current = 0;
    audioEndedAtRef.current = 0;
    audioPosition.value = 0;
    setStatus('playing');
    statusRef.current = 'playing';
    rafRef.current = requestAnimationFrame(loop);
  }, [audioPosition, loop, resetStats, stopLoop]);

  const quit = useCallback((): void => {
    stopLoop();
    setStatus('finished');
    statusRef.current = 'finished';
    const summary = buildSummary();
    onFinish(summary);
  }, [buildSummary, onFinish, stopLoop]);

  const applyJudgmentRef = useCallback(
    (judgment: Judgment, _note: Note, _signedDelta: number): void => {
      const stats = statsRef.current;
      const base = JUDGMENT_SCORE[judgment];
      const tier = Math.floor(stats.combo / 10);
      const multiplier = Math.min(1.0 + tier * 0.1, 2.0);
      const awarded = judgment === 'miss' ? 0 : Math.round(base * multiplier);

      stats.score += awarded;

      if (judgment === 'miss') {
        stats.combo = 0;
        stats.miss += 1;
      } else {
        stats.combo += 1;
        if (stats.combo > stats.maxCombo) {
          stats.maxCombo = stats.combo;
        }
        if (judgment === 'perfect') {
          stats.perfect += 1;
        } else if (judgment === 'great') {
          stats.great += 1;
        } else {
          stats.good += 1;
        }
      }
    },
    [],
  );

  const hit = useCallback(
    (direction: Direction): void => {
      if (statusRef.current !== 'playing') {
        return;
      }
      const hitStart = Date.now();
      const now = getNow();
      const notes = sortedNotes.current;

      // Search window: any note whose time is within ±good-window of now.
      // We expand slightly beyond the Good window so a press just outside
      // still *finds* the note (and gets ignored cleanly rather than
      // mysteriously passing through to a later note).
      const searchRadiusMs = fallDurationMs * OVERLAP_WINDOWS.good * 1.5;
      const loTime = now - searchRadiusMs;
      const hiTime = now + searchRadiusMs;
      const startIdx = findFirstNoteAtOrAfter(notes, loTime);

      let bestNote: Note | null = null;
      let bestOverlap = 0;

      for (let i = startIdx; i < notes.length; i += 1) {
        const note = notes[i];
        if (note.timeMs > hiTime) {
          break;
        }
        if (judgedRef.current.has(note.id)) {
          continue;
        }
        if (note.direction !== direction) {
          continue;
        }
        const ov = overlapAt(note, now);
        if (ov > bestOverlap) {
          bestOverlap = ov;
          bestNote = note;
        }
      }

      // No note in overlap range — ghost tap, ignored (forgiving).
      if (!bestNote || bestOverlap < OVERLAP_WINDOWS.good) {
        perfMonitor.record('hit_ms', Date.now() - hitStart);
        return;
      }

      const judgment = overlapToJudgment(bestOverlap);

      // Signed delta for feedback: negative = early, positive = late.
      // We use (noteTop - idealTop) / noteHeight so 0 = bullseye.
      const top = noteTopAt(bestNote, now);
      const idealTop = noteTopForRatio(1, geometryRef.current);
      const signedDelta =
        (top - idealTop) / Math.max(1, geometryRef.current.noteHeight);

      judgedRef.current.add(bestNote.id);
      applyJudgmentRef(judgment, bestNote, signedDelta);

      scoreDirtyRef.current = true;
      flushScore();

      if (onNoteHit) {
        const event: JudgmentEvent = {
          id: genId('evt'),
          noteId: bestNote.id,
          direction: bestNote.direction,
          judgment,
          deltaPx: signedDelta,
          timeMs: Date.now(),
          comboAfter: statsRef.current.combo,
          scoreAwarded: 0,
        };
        onNoteHit({
          direction: event.direction,
          judgment: event.judgment,
          key: event.id,
          timeMs: event.timeMs,
        });
      }

      perfMonitor.record('hit_ms', Date.now() - hitStart);
    },
    [
      applyJudgmentRef,
      fallDurationMs,
      flushScore,
      getNow,
      noteTopAt,
      onNoteHit,
      overlapAt,
    ],
  );

  const releaseInput = useCallback((_direction: Direction): void => {
    // Reserved for hold notes in a future version.
  }, []);

  useEffect(() => {
    return () => {
      stopLoop();
      if (scoreRafRef.current !== null) {
        cancelAnimationFrame(scoreRafRef.current);
        scoreRafRef.current = null;
      }
    };
  }, [stopLoop]);

  const progress =
    durationMs > 0 ? Math.max(0, Math.min(1, elapsedMs / durationMs)) : 0;

  return {
    status,
    audioPosition,
    lanes: lanesRef.current,
    geometry: geometryRef.current,
    elapsedMs,
    durationMs,
    progress,
    fallDurationMs,
    start,
    pause,
    resume,
    restart,
    quit,
    hit,
    releaseInput,
  };
}

// Silence unused-import warnings for constants referenced only in docs.
void BURNING_OVERLAP;
void HOT_OVERLAP;