import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DIFFICULTY_FALL_MULTIPLIER,
  FALL_DURATION_MS,
  JUDGMENT_ACCURACY_WEIGHT,
  JUDGMENT_SCORE,
  PIXEL_WINDOW,
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

export type HitFeedback = {
  direction: Direction;
  judgment: Judgment;
  key: string;
  timeMs: number;
};

export type VisibleNote = {
  note: Note;
  yRatio: number;
};

export type UseGameEngineOptions = {
  song: Song;
  inputOffsetMs: number;
  onFinish: (summary: GameRunSummary) => void;
  onNoteHit?: (feedback: HitFeedback) => void;
};

export type UseGameEngineResult = {
  status: GameStatus;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  accuracy: number;
  visibleNotes: VisibleNote[];
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

export function useGameEngine(options: UseGameEngineOptions): UseGameEngineResult {
  const { song, inputOffsetMs, onFinish, onNoteHit } = options;

  const sortedNotes = useRef<Note[]>(
    [...song.chart.notes].sort((a, b) => a.timeMs - b.timeMs),
  );
  const durationMs = song.durationMs;

  const fallDurationMs =
    FALL_DURATION_MS * DIFFICULTY_FALL_MULTIPLIER[song.difficulty];

  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [perfectCount, setPerfectCount] = useState<number>(0);
  const [greatCount, setGreatCount] = useState<number>(0);
  const [goodCount, setGoodCount] = useState<number>(0);
  const [missCount, setMissCount] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [visibleNotes, setVisibleNotes] = useState<VisibleNote[]>([]);

  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const judgedRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>('idle');

  const statsRef = useRef({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
  });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPerfectCount(0);
    setGreatCount(0);
    setGoodCount(0);
    setMissCount(0);
    setElapsedMs(0);
    setVisibleNotes([]);
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
    const summary = buildSummary();
    onFinish(summary);
  }, [buildSummary, onFinish, stopLoop]);

  const computeYRatio = useCallback(
    (note: Note, now: number): number => {
      const delta = note.timeMs - now;
      const ratio = 1 - delta / fallDurationMs;
      return ratio;
    },
    [fallDurationMs],
  );

  const processMisses = useCallback(
    (now: number, withFeedback: boolean): void => {
      const missThreshold = 1 + PIXEL_WINDOW.good;
      for (const note of sortedNotes.current) {
        if (judgedRef.current.has(note.id)) {
          continue;
        }
        const ratio = computeYRatio(note, now);
        if (ratio > missThreshold) {
          judgedRef.current.add(note.id);
          statsRef.current.combo = 0;
          statsRef.current.miss += 1;
          setCombo(0);
          setMissCount(statsRef.current.miss);
          if (withFeedback && onNoteHit) {
            onNoteHit({
              direction: note.direction,
              judgment: 'miss',
              key: genId('fb'),
              timeMs: Date.now(),
            });
          }
        }
      }
    },
    [computeYRatio, onNoteHit],
  );

  const loop = useCallback((): void => {
    if (statusRef.current !== 'playing') {
      return;
    }
    const now = Date.now() - startTimeRef.current - inputOffsetMs;
    setElapsedMs(now);

    const upcoming: VisibleNote[] = [];
    for (const note of sortedNotes.current) {
      if (judgedRef.current.has(note.id)) {
        continue;
      }
      const ratio = computeYRatio(note, now);
      if (ratio > -0.1 && ratio < 1 + PIXEL_WINDOW.good + 0.05) {
        upcoming.push({ note, yRatio: ratio });
      }
    }
    setVisibleNotes(upcoming);

    processMisses(now, true);

    if (now >= durationMs + 1200) {
      finish();
      return;
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [computeYRatio, durationMs, finish, inputOffsetMs, processMisses]);

  const start = useCallback((): void => {
    resetStats();
    startTimeRef.current = Date.now();
    pausedElapsedRef.current = 0;
    setStatus('playing');
    statusRef.current = 'playing';
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, resetStats, stopLoop]);

  const pause = useCallback((): void => {
    if (statusRef.current !== 'playing') {
      return;
    }
    pausedElapsedRef.current = Date.now() - startTimeRef.current;
    setStatus('paused');
    statusRef.current = 'paused';
    stopLoop();
  }, [stopLoop]);

  const resume = useCallback((): void => {
    if (statusRef.current !== 'paused') {
      return;
    }
    startTimeRef.current = Date.now() - pausedElapsedRef.current;
    setStatus('playing');
    statusRef.current = 'playing';
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, stopLoop]);

  const restart = useCallback((): void => {
    stopLoop();
    resetStats();
    startTimeRef.current = Date.now();
    pausedElapsedRef.current = 0;
    setStatus('playing');
    statusRef.current = 'playing';
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, resetStats, stopLoop]);

  const quit = useCallback((): void => {
    stopLoop();
    setStatus('finished');
    statusRef.current = 'finished';
    const summary = buildSummary();
    onFinish(summary);
  }, [buildSummary, onFinish, stopLoop]);

  const applyJudgment = useCallback(
    (judgment: Judgment, note: Note, deltaRatio: number): void => {
      const stats = statsRef.current;
      const base = JUDGMENT_SCORE[judgment];
      const tier = Math.floor(stats.combo / 10);
      const multiplier = Math.min(1.0 + tier * 0.1, 2.0);
      const awarded =
        judgment === 'miss' ? 0 : Math.round(base * multiplier);

      stats.score += awarded;

      if (judgment === 'miss') {
        stats.combo = 0;
        stats.miss += 1;
        setMissCount(stats.miss);
      } else {
        stats.combo += 1;
        if (stats.combo > stats.maxCombo) {
          stats.maxCombo = stats.combo;
        }
        if (judgment === 'perfect') {
          stats.perfect += 1;
          setPerfectCount(stats.perfect);
        } else if (judgment === 'great') {
          stats.great += 1;
          setGreatCount(stats.great);
        } else {
          stats.good += 1;
          setGoodCount(stats.good);
        }
      }

      setScore(stats.score);
      setCombo(stats.combo);
      setMaxCombo(stats.maxCombo);

      if (onNoteHit) {
        const event: JudgmentEvent = {
          id: genId('evt'),
          noteId: note.id,
          direction: note.direction,
          judgment,
          deltaPx: deltaRatio,
          timeMs: Date.now(),
          comboAfter: stats.combo,
          scoreAwarded: awarded,
        };
        onNoteHit({
          direction: event.direction,
          judgment: event.judgment,
          key: event.id,
          timeMs: event.timeMs,
        });
      }
    },
    [onNoteHit],
  );

  const hit = useCallback(
    (direction: Direction): void => {
      if (statusRef.current !== 'playing') {
        return;
      }
      const now = Date.now() - startTimeRef.current - inputOffsetMs;

      let bestNote: Note | null = null;
      let bestDelta = Number.POSITIVE_INFINITY;

      for (const note of sortedNotes.current) {
        if (judgedRef.current.has(note.id)) {
          continue;
        }
        if (note.direction !== direction) {
          continue;
        }
        const ratio = computeYRatio(note, now);
        const delta = Math.abs(ratio - 1);
        if (delta < bestDelta) {
          bestDelta = delta;
          bestNote = note;
        }
      }

      if (!bestNote) {
        return;
      }
      if (bestDelta > PIXEL_WINDOW.good) {
        return;
      }

      const signedDelta = computeYRatio(bestNote, now) - 1;
      let judgment: Judgment;
      if (bestDelta <= PIXEL_WINDOW.perfect) {
        judgment = 'perfect';
      } else if (bestDelta <= PIXEL_WINDOW.great) {
        judgment = 'great';
      } else {
        judgment = 'good';
      }

      judgedRef.current.add(bestNote.id);
      applyJudgment(judgment, bestNote, signedDelta);
    },
    [applyJudgment, computeYRatio, inputOffsetMs],
  );

  const releaseInput = useCallback((_direction: Direction): void => {
    // Reserved for hold notes in a future version.
  }, []);

  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  const totalJudged = perfectCount + greatCount + goodCount + missCount;
  const weighted =
    perfectCount * JUDGMENT_ACCURACY_WEIGHT.perfect +
    greatCount * JUDGMENT_ACCURACY_WEIGHT.great +
    goodCount * JUDGMENT_ACCURACY_WEIGHT.good;
  const accuracy = totalJudged > 0 ? weighted / totalJudged : 0;
  const progress =
    durationMs > 0 ? Math.max(0, Math.min(1, elapsedMs / durationMs)) : 0;

  return {
    status,
    score,
    combo,
    maxCombo,
    perfectCount,
    greatCount,
    goodCount,
    missCount,
    accuracy,
    visibleNotes,
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