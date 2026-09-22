import type { Difficulty, Note } from '@/types/song';
import type { SongPackManifest } from '@/types/songPack';

export type BeatMarker = {
  id: string;
  timeMs: number;
};

export type BuilderSource = {
  audioPath: string;
  audioFileName: string;
  durationMs: number;
};

export type BuilderMetadata = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  offsetMs: number;
  license: string;
};

export type BuilderPhase =
  | 'empty'
  | 'loaded'
  | 'detecting'
  | 'marking'
  | 'generating'
  | 'editing'
  | 'exporting';

export type ChartGenerationOptions = {
  difficulty: Difficulty;
  bpm: number;
  offsetMs: number;
  startAtMs: number;
  endAtMs: number;
  includeDoubles: boolean;
};

export type BuilderState = {
  phase: BuilderPhase;
  source: BuilderSource | null;
  metadata: BuilderMetadata;
  beats: BeatMarker[];
  notes: Note[];
  selectedNoteId: string | null;
  lastError: string | null;
};

export type ExportedPack = {
  manifest: SongPackManifest;
  manifestPath: string;
  audioPath: string;
  coverPath?: string;
  outputDir: string;
};

export const DEFAULT_BUILDER_METADATA: BuilderMetadata = {
  id: '',
  title: '',
  artist: '',
  bpm: 120,
  difficulty: 'normal',
  offsetMs: 0,
  license: 'CC0',
};