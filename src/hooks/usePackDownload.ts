import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import { installPack } from '@/services/packInstaller';
import { usePacksStore } from '@/store/usePacksStore';
import type { PackDownloadState, RemotePackEntry } from '@/types/songPack';

export type UsePackDownloadResult = {
  download: PackDownloadState | null;
  isDownloading: boolean;
  progress: number;
  error: string | null;
  start: (entry: RemotePackEntry) => Promise<boolean>;
  reset: () => void;
};

export function usePackDownload(packId: string): UsePackDownloadResult {
  const stored = usePacksStore((s) => s.downloads[packId]);
  const setDownloadState = usePacksStore((s) => s.setDownloadState);
  const clearDownload = usePacksStore((s) => s.clearDownload);
  const setInstalled = usePacksStore((s) => s.setInstalled);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (entry: RemotePackEntry): Promise<boolean> => {
      setError(null);
      const result = await installPack({
        entry,
        onProgress: (state) => setDownloadState(state),
      });
      if (result.ok) {
        setInstalled(result.pack);
        clearDownload(packId);
        Toast.show({
          type: 'success',
          text1: 'Song pack installed',
          text2: `${result.pack.title} is ready to play`,
          position: 'bottom',
        });
        return true;
      }
      setError(result.error);
      Toast.show({
        type: 'error',
        text1: 'Install failed',
        text2: result.error,
        position: 'bottom',
      });
      return false;
    },
    [clearDownload, packId, setDownloadState, setInstalled],
  );

  const reset = useCallback((): void => {
    clearDownload(packId);
    setError(null);
  }, [clearDownload, packId]);

  const isDownloading =
    stored !== undefined &&
    stored.phase !== 'idle' &&
    stored.phase !== 'done' &&
    stored.phase !== 'error' &&
    stored.phase !== 'cancelled';

  return {
    download: stored ?? null,
    isDownloading,
    progress: stored?.progress ?? 0,
    error: error ?? (stored?.phase === 'error' ? stored.message ?? 'Install failed' : null),
    start,
    reset,
  };
}