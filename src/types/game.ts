import type { Direction, Song } from '@/types/song';

export type Judgment = 'perfect' | 'great' | 'good' | 'miss';

export type JudgmentEvent = {
  id: string;
  noteId: string;
  direction: Direction;
  judgment: Judgment;
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
 * Judgment windows as fractions of the lane area height.
 * The lane area is the full vertical space notes fall through,
 * from just below the HUD to just above the button row.
 */
export const PIXEL_WINDOW = {
  perfect: 0.035,
  great: 0.07,
  good: 0.12,
} as const;

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