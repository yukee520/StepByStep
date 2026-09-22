import { create } from 'zustand';
import type { GameRunSummary } from '@/types/game';

type GameState = {
  lastSummary: GameRunSummary | null;
  setLastSummary: (summary: GameRunSummary | null) => void;
  clearLastSummary: () => void;
};

export const useGameStore = create<GameState>((set) => ({
  lastSummary: null,
  setLastSummary: (summary) => set({ lastSummary: summary }),
  clearLastSummary: () => set({ lastSummary: null }),
}));