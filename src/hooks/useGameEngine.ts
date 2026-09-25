import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
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
import { audioPlayer } from '@/services/audioPlayer';
import { perfMonitor } from '@/services/perfMonitor';

export type HitFeedback = {
  direction: Direction;
  judgment: Judgment;
  key: string;
  timeMs: number;
};

export type UseGameEngineOptions = {
  song: Song;
  inputOffsetMs: number;
  useAudioClock: boolean;
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
  visibleNotes: Note[];
  audioPosition: ReturnType<typeof useSharedValue<number>>;
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
  const { song, inputOffsetMs, useAudioClock, onFinish, onNoteHit } = options;

  const fallDurationMs =
    FALL_DURATION_MS * DIFFICULTY_FALL_MULTIPLIER[song.difficulty];
  const leadInMs = fallDurationMs + 100;
  const durationMs = song.durationMs;

  const sortedNotes = useRef<Note[]>(
    [...song.chart.notes]
      .filter((n) => n.timeMs >= leadInMs)
      .sort((a, b) => a.timeMs - b.timeMs),
  );

  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [perfectCount, setPerfectCount] = useState<number>(0);
  const [greatCount, setGreatCount] = useState<number>(0);
  const [goodCount, setGoodCount] = useState<number>(0);
  const [missCount, setMissCount] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [visibleNotes, setVisibleNotes] = useState<Note[]>([]);

  const audioPosition = useSharedValue<number>(0);

  const wallClockStartRef = useRef<number>(0);
  const wallClockPausedRef = useRef<number>(0);
  const judgedRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>('idle');
  const audioEndedAtRef = useRef<number>(0);
  const missPointerRef = useRef<number>(0);
  const lastElapsedUpdateRef = useRef<number>(0);
  const visibleIdsRef = useRef<string>('');
  const lastFrameAtRef = useRef<number>(0);

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
    missPointerRef.current = 0;
    lastElapsedUpdateRef.current = 0;
    visibleIdsRef.current = '';
    lastFrameAtRef.current = 0;
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

  const computeYRatio = useCallback(
    (note: Note, now: number): number => {
      const delta = note.timeMs - now;
      return 1 - delta / fallDurationMs;
    },
    [fallDurationMs],
  );

  const processMisses = useCallback(
    (now: number): void => {
      const notes = sortedNotes.current;
      const missThresholdMs = now - fallDurationMs * PIXEL_WINDOW.good;
      let i = missPointerRef.current;
      let missedThisFrame = 0;
      while (i < notes.length && notes[i].timeMs < missThresholdMs) {
        const note = notes[i];
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
        setCombo(0);
        setMissCount(statsRef.current.miss);
      }
    },
    [fallDurationMs, onNoteHit],
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

    perfMonitor.mark('get_now');
    const now = getNow();
    perfMonitor.record('get_now_ms', perfMonitor.since('get_now'));

    audioPosition.value = now;

    if (now - lastElapsedUpdateRef.current >= 100) {
      lastElapsedUpdateRef.current = now;
      setElapsedMs(now);
    }

    const notes = sortedNotes.current;
    const loTime = now - fallDurationMs * VISIBLE_BEHIND;
    const hiTime = now + fallDurationMs * VISIBLE_AHEAD;
    const startIdx = findFirstNoteAtOrAfter(notes, loTime);

    const upcoming: Note[] = [];
    for (let i = startIdx; i < notes.length; i += 1) {
      const note = notes[i];
      if (note.timeMs > hiTime) {
        break;
      }
      if (judgedRef.current.has(note.id)) {
        continue;
      }
      upcoming.push(note);
    }

    perfMonitor.record('visible_notes', upcoming.length);

    const idKey = upcoming.map((n) => n.id).join('|');
    if (idKey !== visibleIdsRef.current) {
      visibleIdsRef.current = idKey;
      const setStart = Date.now();
      setVisibleNotes(upcoming);
      perfMonitor.record('set_visible_ms', Date.now() - setStart);
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
      const hitStart = Date.now();
      const now = getNow();
      const notes = sortedNotes.current;
      const loTime = now - fallDurationMs * PIXEL_WINDOW.good;
      const hiTime = now + fallDurationMs * PIXEL_WINDOW.good;
      const startIdx = findFirstNoteAtOrAfter(notes, loTime);

      let bestNote: Note | null = null;
      let bestDelta = Number.POSITIVE_INFINITY;

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
        const ratio = computeYRatio(note, now);
        const delta = Math.abs(ratio - 1);
        if (delta < bestDelta) {
          bestDelta = delta;
          bestNote = note;
        }
      }

      if (!bestNote) {
        perfMonitor.record('hit_ms', Date.now() - hitStart);
        return;
      }
      if (bestDelta > PIXEL_WINDOW.good) {
        perfMonitor.record('hit_ms', Date.now() - hitStart);
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

      visibleIdsRef.current = '';
      perfMonitor.record('hit_ms', Date.now() - hitStart);
    },
    [applyJudgment, computeYRatio, fallDurationMs, getNow],
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
    audioPosition,
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