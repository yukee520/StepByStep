export type Direction = 'left' | 'right' | 'up' | 'down';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export type Note = {
  id: string;
  timeMs: number;
  direction: Direction;
  durationMs?: number;
};

export type SongSource = 'builtin' | 'pack';

export type SongChart = {
  difficulty: Difficulty;
  notes: Note[];
  laneCount: 4;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  durationMs: number;
  difficulty: Difficulty;
  offsetMs: number;
  source: SongSource;
  packId?: string;
  audioPath?: string;
  coverPath?: string;
  audioUrl?: string;
  coverUrl?: string;
  chart: SongChart;
  version: number;
  license?: string;
  generatedBy?: string;
};

export const DIRECTIONS: readonly Direction[] = ['left', 'down', 'up', 'right'];

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'normal', 'hard', 'expert'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  expert: 'Expert',
};

export const DIFFICULTY_SPEED_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.9,
  normal: 1.0,
  hard: 1.15,
  expert: 1.3,
};

export const DIFFICULTY_NOTE_DENSITY: Record<Difficulty, number> = {
  easy: 0.5,
  normal: 1,
  hard: 2,
  expert: 3.5,
};