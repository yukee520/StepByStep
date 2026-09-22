import type { Difficulty, Note } from '@/types/song';

export type SongPackManifest = {
  formatVersion: number;
  id: string;
  title: string;
  artist: string;
  bpm: number;
  durationMs: number;
  difficulty: Difficulty;
  offsetMs: number;
  chart: Note[];
  version: number;
  license?: string;
  generatedBy?: string;
  coverUrl?: string;
  audioUrl?: string;
};

export type RemotePackEntry = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  sizeBytes: number;
  manifestUrl: string;
  audioUrl?: string;
  coverUrl?: string;
  version: number;
};

export type RemotePackIndex = {
  version: number;
  packs: RemotePackEntry[];
};

export type InstalledPack = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  version: number;
  installedAt: number;
  sizeBytes: number;
  manifestPath: string;
  audioPath?: string;
  coverPath?: string;
};

export type PackDownloadPhase =
  | 'idle'
  | 'queued'
  | 'manifest'
  | 'audio'
  | 'cover'
  | 'saving'
  | 'done'
  | 'error'
  | 'cancelled';

export type PackDownloadState = {
  packId: string;
  phase: PackDownloadPhase;
  progress: number;
  bytesWritten: number;
  totalBytes: number;
  message?: string;
};