import type { Song } from '@/types/song';
import type { GameRunSummary } from '@/types/game';

export type RootStackParamList = {
  Home: undefined;
  SongSelect: undefined;
  SongPackStore: undefined;
  SongPackDetail: { packId: string };
  Game: { songId: string };
  Results: { summary: GameRunSummary };
  Builder: undefined;
  Settings: undefined;
  HowToPlay: undefined;
};

export type SongSelectNavigation = {
  song: Song;
};