import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  InstalledPack,
  PackDownloadState,
  RemotePackEntry,
} from '@/types/songPack';

type PacksState = {
  installed: Record<string, InstalledPack>;
  downloads: Record<string, PackDownloadState>;
  remoteIndex: RemotePackEntry[];
  indexFetchedAt: number;
  hydrated: boolean;
  setInstalled: (pack: InstalledPack) => void;
  removeInstalled: (packId: string) => void;
  setDownloadState: (state: PackDownloadState) => void;
  clearDownload: (packId: string) => void;
  setRemoteIndex: (entries: RemotePackEntry[]) => void;
  markHydrated: () => void;
};

export const usePacksStore = create<PacksState>()(
  persist(
    (set) => ({
      installed: {},
      downloads: {},
      remoteIndex: [],
      indexFetchedAt: 0,
      hydrated: false,
      setInstalled: (pack) =>
        set((state) => ({
          installed: { ...state.installed, [pack.id]: pack },
        })),
      removeInstalled: (packId) =>
        set((state) => {
          const next = { ...state.installed };
          delete next[packId];
          return { installed: next };
        }),
      setDownloadState: (download) =>
        set((state) => ({
          downloads: { ...state.downloads, [download.packId]: download },
        })),
      clearDownload: (packId) =>
        set((state) => {
          const next = { ...state.downloads };
          delete next[packId];
          return { downloads: next };
        }),
      setRemoteIndex: (entries) =>
        set({ remoteIndex: entries, indexFetchedAt: Date.now() }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'stepbystep-packs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        installed: state.installed,
        remoteIndex: state.remoteIndex,
        indexFetchedAt: state.indexFetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);