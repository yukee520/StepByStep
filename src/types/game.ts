import type { Direction, Song } from '@/types/song';

export type Judgment = 'perfect' | 'great' | 'good' | 'miss';

export type JudgmentEvent = {
  id: string;
  noteId: string;
  direction: Direction;
  judgment: Judgment;
  deltaMs: number;
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

export type JudgmentWindow = {
  perfect: number;
  great: number;
  good: number;
};

export const DEFAULT_JUDGMENT_WINDOW: JudgmentWindow = {
  perfect: 45,
  great: 90,
  good: 140,
};

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