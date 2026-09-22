import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadAllSongs, sortSongs } from '@/services/songLibrary';
import { usePacksStore } from '@/store/usePacksStore';
import type { Song } from '@/types/song';
import type { InstalledPack } from '@/types/songPack';

const SONGS_QUERY_KEY = 'songs';

export type UseSongsResult = {
  songs: Song[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useSongs(): UseSongsResult {
  const installedMap = usePacksStore((s) => s.installed);

  const installedList = useMemo<InstalledPack[]>(
    () => Object.values(installedMap).sort((a, b) => a.title.localeCompare(b.title)),
    [installedMap],
  );

  const installedKey = installedList.map((p) => `${p.id}@${p.version}`).join('|');

  const query = useQuery<Song[], Error>({
    queryKey: [SONGS_QUERY_KEY, installedKey],
    queryFn: async () => {
      const loaded = await loadAllSongs(installedList);
      return sortSongs(loaded);
    },
    staleTime: 1000 * 30,
    retry: 1,
  });

  return {
    songs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    error: query.error ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}