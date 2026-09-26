// src/types/navigation.ts
import type { Song } from '@/types/song';
import type { GameRunSummary } from '@/types/game';

export type RootStackParamList = {
  Home: undefined;
  SongSelect: undefined;
  SongPackStore: undefined;
  SongPackDetail: { packId: string };
  Game: { songId: string };
  Results: { summary: GameRunSummary };
  Library: undefined;
  Builder: undefined;
  Settings: undefined;
  HowToPlay: undefined;
  /** Dev-only: overlap judgment simulator. Reachable from LibraryScreen. */
  OverlapSimulator: undefined;
};

export type SongSelectNavigation = {
  song: Song;
};