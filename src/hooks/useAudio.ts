import { useCallback, useEffect, useRef, useState } from 'react';
import { audioPlayer } from '@/services/audioPlayer';
import type { AudioStatus } from '@/services/audioPlayer';
import { useSettingsStore } from '@/store/useSettingsStore';

export type UseAudioResult = {
  status: AudioStatus;
  durationMs: number;
  error: string | null;
  isReady: boolean;
  load: (path: string) => Promise<boolean>;
  play: (startAtMs?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  release: () => Promise<void>;
  getPositionMs: () => number;
  isPlaying: () => boolean;
};

export function useAudio(): UseAudioResult {
  const soundEnabled = useSettingsStore((s) => s.settings.soundEnabled);
  const [status, setStatus] = useState<AudioStatus>(audioPlayer.getStatus());
  const [durationMs, setDurationMs] = useState<number>(audioPlayer.getDurationMs());
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = audioPlayer.subscribe((next) => {
      if (!mountedRef.current) {
        return;
      }
      setStatus(next);
      setDurationMs(audioPlayer.getDurationMs());
    });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const load = useCallback(
    async (path: string): Promise<boolean> => {
      setError(null);
      if (!soundEnabled) {
        setStatus('ready');
        return true;
      }
      const result = await audioPlayer.load(path);
      if (!result.ok) {
        setError(result.error ?? 'Could not load audio');
        return false;
      }
      setDurationMs(result.durationMs);
      return true;
    },
    [soundEnabled],
  );

  const play = useCallback(
    (startAtMs = 0) => {
      if (!soundEnabled) {
        return;
      }
      audioPlayer.play(startAtMs);
    },
    [soundEnabled],
  );

  const pause = useCallback(() => {
    if (!soundEnabled) {
      return;
    }
    audioPlayer.pause();
  }, [soundEnabled]);

  const resume = useCallback(() => {
    if (!soundEnabled) {
      return;
    }
    audioPlayer.resume();
  }, [soundEnabled]);

  const stop = useCallback(async (): Promise<void> => {
    if (!soundEnabled) {
      return;
    }
    await audioPlayer.stop();
  }, [soundEnabled]);

  const release = useCallback(async (): Promise<void> => {
    await audioPlayer.release();
    if (mountedRef.current) {
      setStatus('idle');
      setDurationMs(0);
    }
  }, []);

  const getPositionMs = useCallback((): number => {
    if (!soundEnabled) {
      return 0;
    }
    return audioPlayer.getPositionMs();
  }, [soundEnabled]);

  const isPlaying = useCallback((): boolean => {
    if (!soundEnabled) {
      return false;
    }
    return audioPlayer.isPlaying();
  }, [soundEnabled]);

  return {
    status,
    durationMs,
    error,
    isReady:
      status === 'ready' ||
      status === 'playing' ||
      status === 'paused' ||
      status === 'ended',
    load,
    play,
    pause,
    resume,
    stop,
    release,
    getPositionMs,
    isPlaying,
  };
}