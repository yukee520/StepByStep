// src/types/game.ts
import type { Direction, Song } from '@/types/song';

export type Judgment = 'perfect' | 'great' | 'good' | 'miss';

export type JudgmentEvent = {
  id: string;
  noteId: string;
  direction: Direction;
  judgment: Judgment;
  /**
   * Signed overlap delta at hit time.
   *  0  → note center exactly on button center (Perfect bullseye)
   * >0  → note is BELOW button center (late)
   * <0  → note is ABOVE button center (early)
   * Range is roughly [-1, 1] where 1 = one full note height off.
   */
  deltaPx: number;
  timeMs: number;
  comboAfter: number;
  scoreAwarded: number;
};

export type GameStatus =
  | 'idle'
  | 'loading'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'finished'
  | 'error';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export type GameRunSummary = {
  songId: string;
  songTitle: string;
  difficulty: Song['difficulty'];
  score: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  totalNotes: number;
  accuracy: number;
  grade: Grade;
  completedAt: number;
  isHighScore: boolean;
};

/**
 * Judgment thresholds as the fraction of the NOTE that must be inside the
 * BUTTON rectangle.
 */
export const OVERLAP_WINDOWS = {
  perfect: 0.8,
  great: 0.5,
  good: 0.2,
} as const;

export const HOT_OVERLAP = OVERLAP_WINDOWS.great;
export const BURNING_OVERLAP = OVERLAP_WINDOWS.perfect;

/**
 * Once a note's bottom passes this many pixels beyond the button's bottom
 * without being hit, it is counted as a miss.
 */
export const DROP_GRACE_PX = 24;

/**
 * Hold notes: a hold is considered "broken" (miss) if the player releases
 * before (timeMs + durationMs - RELEASE_GRACE_MS).
 *
 * Per design decision C, we do NOT track late release. Holding past the end
 * is free — the note clears automatically once `now >= timeMs + durationMs`.
 */
export const RELEASE_GRACE_MS = 150;

export const JUDGMENT_SCORE: Record<Judgment, number> = {
  perfect: 300,
  great: 200,
  good: 100,
  miss: 0,
};

export const JUDGMENT_ACCURACY_WEIGHT: Record<Judgment, number> = {
  perfect: 1,
  great: 0.85,
  good: 0.6,
  miss: 0,
};

export const COMBO_BONUS_STEP = 10;
export const COMBO_BONUS_CAP = 100;

export const FALL_DURATION_MS = 1400;

export const DIFFICULTY_FALL_MULTIPLIER: Record<Song['difficulty'], number> = {
  easy: 1.3,
  normal: 1.0,
  hard: 0.8,
  expert: 0.65,
};

export type LaneGeometry = {
  laneHeight: number;
  buttonHeight: number;
  buttonTop: number;
  buttonCenterY: number;
  noteHeight: number;
};

export function noteTopForRatio(ratio: number, geom: LaneGeometry): number {
  const centerY = geom.buttonCenterY - (1 - ratio) * geom.laneHeight;
  return centerY - geom.noteHeight / 2;
}

export function computeOverlap(
  noteTopY: number,
  noteHeight: number,
  geom: LaneGeometry,
): number {
  if (noteHeight <= 0) {
    return 0;
  }
  const noteBottom = noteTopY + noteHeight;
  const buttonBottom = geom.buttonTop + geom.buttonHeight;
  const interTop = Math.max(noteTopY, geom.buttonTop);
  const interBottom = Math.min(noteBottom, buttonBottom);
  const inter = Math.max(0, interBottom - interTop);
  return Math.min(1, inter / noteHeight);
}

export function overlapToJudgment(overlap: number): Judgment {
  if (overlap >= OVERLAP_WINDOWS.perfect) {
    return 'perfect';
  }
  if (overlap >= OVERLAP_WINDOWS.great) {
    return 'great';
  }
  if (overlap >= OVERLAP_WINDOWS.good) {
    return 'good';
  }
  return 'miss';
}

/**
 * Pixel length of a hold note's tail for a given duration.
 * Length in lane coordinates is proportional to (duration / fallDuration).
 */
export function holdLengthPx(
  durationMs: number,
  fallDurationMs: number,
  geom: LaneGeometry,
): number {
  if (durationMs <= 0) {
    return 0;
  }
  return (durationMs / fallDurationMs) * geom.laneHeight;
}