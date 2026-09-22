import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Grade } from '@/types/game';
import type { Difficulty } from '@/types/song';

export type HighScore = {
  songId: string;
  score: number;
  maxCombo: number;
  accuracy: number;
  grade: Grade;
  difficulty: Difficulty;
  achievedAt: number;
  playCount: number;
};

export type ScoreSubmission = {
  songId: string;
  score: number;
  maxCombo: number;
  accuracy: number;
  grade: Grade;
  difficulty: Difficulty;
};

type ScoresState = {
  scores: Record<string, HighScore>;
  hydrated: boolean;
  submitScore: (submission: ScoreSubmission) => boolean;
  getScore: (songId: string) => HighScore | undefined;
  clearAll: () => void;
  markHydrated: () => void;
};

export const useScoresStore = create<ScoresState>()(
  persist(
    (set, get) => ({
      scores: {},
      hydrated: false,
      submitScore: (submission) => {
        const existing = get().scores[submission.songId];
        const isNewBest = !existing || submission.score > existing.score;
        const playCount = (existing?.playCount ?? 0) + 1;
        const next: HighScore = isNewBest
          ? {
              songId: submission.songId,
              score: submission.score,
              maxCombo: submission.maxCombo,
              accuracy: submission.accuracy,
              grade: submission.grade,
              difficulty: submission.difficulty,
              achievedAt: Date.now(),
              playCount,
            }
          : {
              ...(existing as HighScore),
              playCount,
            };
        set((state) => ({
          scores: { ...state.scores, [submission.songId]: next },
        }));
        return isNewBest;
      },
      getScore: (songId) => get().scores[songId],
      clearAll: () => set({ scores: {} }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'stepbystep-scores',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ scores: state.scores }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);