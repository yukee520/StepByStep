import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS,
  INPUT_OFFSET_MAX,
  INPUT_OFFSET_MIN,
  NOTE_SPEED_MAX,
  NOTE_SPEED_MIN,
} from '@/types/settings';
import type { Settings, ThemeMode } from '@/types/settings';

type SettingsState = {
  settings: Settings;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setNoteSpeed: (value: number) => void;
  setInputOffsetMs: (value: number) => void;
  setSoundEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setPackIndexUrl: (value: string) => void;
  setShowFpsCounter: (value: boolean) => void;
  setGithubToken: (value: string) => void;
  setGithubOwner: (value: string) => void;
  setGithubRepo: (value: string) => void;
  setGithubBranch: (value: string) => void;
  setGithubPacksPath: (value: string) => void;
  resetToDefaults: () => void;
  markHydrated: () => void;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      hydrated: false,
      setThemeMode: (mode) =>
        set((state) => ({ settings: { ...state.settings, themeMode: mode } })),
      setNoteSpeed: (value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            noteSpeed: clamp(value, NOTE_SPEED_MIN, NOTE_SPEED_MAX),
          },
        })),
      setInputOffsetMs: (value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            inputOffsetMs: clamp(
              Math.round(value),
              INPUT_OFFSET_MIN,
              INPUT_OFFSET_MAX,
            ),
          },
        })),
      setSoundEnabled: (value) =>
        set((state) => ({ settings: { ...state.settings, soundEnabled: value } })),
      setHapticsEnabled: (value) =>
        set((state) => ({ settings: { ...state.settings, hapticsEnabled: value } })),
      setPackIndexUrl: (value) =>
        set((state) => ({ settings: { ...state.settings, packIndexUrl: value.trim() } })),
      setShowFpsCounter: (value) =>
        set((state) => ({ settings: { ...state.settings, showFpsCounter: value } })),
      setGithubToken: (value) =>
        set((state) => ({
          settings: { ...state.settings, githubToken: value.trim() },
        })),
      setGithubOwner: (value) =>
        set((state) => ({
          settings: { ...state.settings, githubOwner: value.trim() },
        })),
      setGithubRepo: (value) =>
        set((state) => ({
          settings: { ...state.settings, githubRepo: value.trim() },
        })),
      setGithubBranch: (value) =>
        set((state) => ({
          settings: { ...state.settings, githubBranch: value.trim() },
        })),
      setGithubPacksPath: (value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            githubPacksPath: value.trim().replace(/^\/+|\/+$/g, ''),
          },
        })),
      resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'stepbystep-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);