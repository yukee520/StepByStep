import { create } from 'zustand';

type GameScoreState = {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;

  setScore: (v: number) => void;
  setCombo: (v: number) => void;
  setMaxCombo: (v: number) => void;
  setPerfect: (v: number) => void;
  setGreat: (v: number) => void;
  setGood: (v: number) => void;
  setMiss: (v: number) => void;

  applyAll: (snapshot: {
    score: number;
    combo: number;
    maxCombo: number;
    perfect: number;
    great: number;
    good: number;
    miss: number;
  }) => void;

  resetAll: () => void;
};

export const useGameScoreStore = create<GameScoreState>((set) => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,

  setScore: (v) => set({ score: v }),
  setCombo: (v) => set({ combo: v }),
  setMaxCombo: (v) => set({ maxCombo: v }),
  setPerfect: (v) => set({ perfect: v }),
  setGreat: (v) => set({ great: v }),
  setGood: (v) => set({ good: v }),
  setMiss: (v) => set({ miss: v }),

  applyAll: (s) =>
    set({
      score: s.score,
      combo: s.combo,
      maxCombo: s.maxCombo,
      perfect: s.perfect,
      great: s.great,
      good: s.good,
      miss: s.miss,
    }),

  resetAll: () =>
    set({
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
    }),
}));