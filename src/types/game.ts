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
 * Judgment thresholds expressed as the fraction of the NOTE that must be
 * inside the BUTTON rectangle for each tier.
 *
 *   overlap >= 0.80  → perfect
 *   overlap >= 0.50  → great
 *   overlap >= 0.20  → good
 *   overlap <  0.20  → no resolution (press ignored, or note drops as miss)
 *
 * Overlap is computed as:
 *   intersect = max(0, min(noteBottom, buttonBottom) - max(noteTop, buttonTop))
 *   overlap   = intersect / noteHeight
 */
export const OVERLAP_WINDOWS = {
  perfect: 0.8,
  great: 0.5,
  good: 0.2,
} as const;

/**
 * A note is "hot" for a lane when its overlap is at least this value.
 * Drives the ArrowButton glow. 0.5 == the Great window, i.e. "press now".
 */
export const HOT_OVERLAP = OVERLAP_WINDOWS.great;

/**
 * A note is "burning" (brightest pulse) when overlap is at least this value.
 * Matches the Perfect window.
 */
export const BURNING_OVERLAP = OVERLAP_WINDOWS.perfect;

/**
 * Once a note's bottom passes this many pixels beyond the button's bottom
 * without being hit, it is counted as a miss.
 */
export const DROP_GRACE_PX = 24;

export const JUDGMENT_SCORE: Record<Judgment, number> = {
  perfect: 300,
  great: 200,
  good: 100,
  miss: 0,
};

export const JUDGMENT_ACCURACY_WEIGHT: Record<Judgment, number> = {
  perfect: 1,
  great: 0.75,
  good: 0.5,
  miss: 0,
};

export const COMBO_BONUS_STEP = 10;
export const COMBO_BONUS_CAP = 100;

/**
 * How long (in ms) a falling note takes to travel the entire lane.
 * Lower = faster. This controls note speed independent of BPM.
 */
export const FALL_DURATION_MS = 1400;

/**
 * Multiplier applied to FALL_DURATION_MS by difficulty.
 * Higher difficulty = smaller multiplier = faster fall.
 */
export const DIFFICULTY_FALL_MULTIPLIER: Record<Song['difficulty'], number> = {
  easy: 1.3,
  normal: 1.0,
  hard: 0.8,
  expert: 0.65,
};

/**
 * Geometry describing where the button row lives inside a lane.
 * All values are in lane-area pixel coordinates (0 = top of lane area).
 */
export type LaneGeometry = {
  /** Full height of the lane area (px). */
  laneHeight: number;
  /** Height of the button rectangle (px). */
  buttonHeight: number;
  /** Y coordinate of the button's top edge. */
  buttonTop: number;
  /** Y coordinate of the button's center. */
  buttonCenterY: number;
  /** Height of a falling note sprite (px). */
  noteHeight: number;
};

/**
 * Compute the Y of a note's TOP given its normalized fall progress.
 *
 *   ratio = 0 → note is one full lane-height above the button center
 *   ratio = 1 → note's CENTER is exactly on the button's CENTER (Perfect)
 *   ratio > 1 → note has fallen past the button
 */
export function noteTopForRatio(ratio: number, geom: LaneGeometry): number {
  const centerY = geom.buttonCenterY - (1 - ratio) * geom.laneHeight;
  return centerY - geom.noteHeight / 2;
}

/**
 * Overlap of a note (given its top-Y and height) with the button rectangle.
 * Returns a value in [0, 1].
 */
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

/**
 * Map an overlap value to a Judgment. Returns 'miss' if overlap is below
 * the Good threshold — callers should treat that as "not a hit".
 */
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