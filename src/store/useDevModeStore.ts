import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DevModeState = {
  enabled: boolean;
  /** Number of consecutive taps on the About version. Resets if >2s pass. */
  tapCount: number;
  lastTapAt: number;
  hydrated: boolean;

  tapVersion: () => { unlocked: boolean; remaining: number };
  disable: () => void;
  resetTaps: () => void;
  markHydrated: () => void;
};

const REQUIRED_TAPS = 7;
const TAP_TIMEOUT_MS = 2000;

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set, get) => ({
      enabled: false,
      tapCount: 0,
      lastTapAt: 0,
      hydrated: false,

      tapVersion: () => {
        const now = Date.now();
        const { tapCount, lastTapAt, enabled } = get();
        const isContinuation = now - lastTapAt < TAP_TIMEOUT_MS;
        const nextCount = isContinuation ? tapCount + 1 : 1;
        const remaining = Math.max(0, REQUIRED_TAPS - nextCount);

        if (nextCount >= REQUIRED_TAPS) {
          if (!enabled) {
            set({
              enabled: true,
              tapCount: 0,
              lastTapAt: 0,
            });
            return { unlocked: true, remaining: 0 };
          }
          // Already enabled → toggling disables it
          set({
            enabled: false,
            tapCount: 0,
            lastTapAt: 0,
          });
          return { unlocked: false, remaining: 0 };
        }

        set({ tapCount: nextCount, lastTapAt: now });
        return { unlocked: false, remaining };
      },

      disable: () => set({ enabled: false, tapCount: 0, lastTapAt: 0 }),
      resetTaps: () => set({ tapCount: 0, lastTapAt: 0 }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'stepbystep-dev-mode',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ enabled: state.enabled }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export const DEV_MODE_REQUIRED_TAPS = REQUIRED_TAPS;