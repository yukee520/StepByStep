import Sound from 'react-native-sound';
import { devLog } from '@/store/useDevLogStore';

Sound.setCategory('Playback', true);

export type AudioLoadResult = {
  ok: boolean;
  durationMs: number;
  error?: string;
};

export type AudioStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'error';

type Listener = (status: AudioStatus, positionMs: number) => void;

class AudioPlayerService {
  private sound: Sound | null = null;
  private loadedPath: string | null = null;
  private status: AudioStatus = 'idle';
  private durationMs = 0;
  private listeners = new Set<Listener>();

  // Wall-clock tracking for smooth position reads between native polls
  private playStartedAt = 0; // Date.now() when play() was called
  private startPositionMs = 0; // position within the audio at play() start
  private pausedPositionMs = 0; // position when paused

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.getPositionMs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const pos = this.getPositionMs();
    this.listeners.forEach((l) => l(this.status, pos));
  }

  private setStatus(next: AudioStatus): void {
    this.status = next;
    this.emit();
  }

  getStatus(): AudioStatus {
    return this.status;
  }

  isPlaying(): boolean {
    return this.status === 'playing';
  }

  getDurationMs(): number {
    return this.durationMs;
  }

  /**
   * Returns the current audio position in milliseconds.
   * Prefers the native player's reported time but falls back to wall-clock
   * interpolation if the native read is unsupported.
   */
  getPositionMs(): number {
  if (this.status === 'playing') {
    const elapsed = Date.now() - this.playStartedAt;
    const pos = this.startPositionMs + elapsed;
    return Math.round(Math.max(0, Math.min(pos, this.durationMs)));
  }
  if (this.status === 'paused') {
    return Math.round(this.pausedPositionMs);
  }
  if (this.status === 'ready' || this.status === 'idle') {
    return Math.round(this.startPositionMs);
  }
  return 0;
}

  async load(path: string): Promise<AudioLoadResult> {
    if (this.loadedPath === path && this.status !== 'error') {
      return { ok: true, durationMs: this.durationMs };
    }
    await this.release();
    this.setStatus('loading');
    devLog('info', 'audio', `loading ${path}`);

    return new Promise<AudioLoadResult>((resolve) => {
      const sound = new Sound(path, '', (error) => {
        if (error) {
          this.status = 'error';
          this.emit();
          devLog('error', 'audio', `load failed: ${error.message}`);
          resolve({
            ok: false,
            durationMs: 0,
            error: error.message || 'Failed to load audio',
          });
          return;
        }
        this.sound = sound;
        this.loadedPath = path;
        this.durationMs = Math.round(sound.getDuration() * 1000);
        this.startPositionMs = 0;
        this.pausedPositionMs = 0;
        this.setStatus('ready');
        devLog('success', 'audio', `ready · ${this.durationMs}ms`);
        resolve({ ok: true, durationMs: this.durationMs });
      });
    });
  }

  play(startAtMs = 0): void {
    if (!this.sound) {
      devLog('warn', 'audio', 'play() but no sound loaded');
      return;
    }
    const seconds = Math.max(0, startAtMs / 1000);
    try {
      this.sound.setCurrentTime(seconds);
    } catch {
      // ignore
    }
    this.startPositionMs = Math.max(0, startAtMs);
    this.playStartedAt = Date.now();
    this.pausedPositionMs = this.startPositionMs;

    this.sound.play((success) => {
      if (!success) {
        this.setStatus('error');
        devLog('error', 'audio', 'playback failed');
        return;
      }
      this.startPositionMs = this.durationMs;
      this.pausedPositionMs = this.durationMs;
      this.setStatus('idle');
      devLog('info', 'audio', 'playback ended');
    });

    this.setStatus('playing');
    devLog('info', 'audio', `play from ${startAtMs}ms`);
  }

  pause(): void {
    if (!this.sound || this.status !== 'playing') {
      return;
    }
    const pos = this.getPositionMs();
    this.pausedPositionMs = pos;
    this.startPositionMs = pos;
    try {
      this.sound.pause();
    } catch {
      // ignore
    }
    this.setStatus('paused');
    devLog('info', 'audio', `paused at ${pos}ms`);
  }

  resume(): void {
    if (!this.sound || this.status !== 'paused') {
      return;
    }
    this.play(this.pausedPositionMs);
  }

  stop(): void {
    if (!this.sound) {
      return;
    }
    this.sound.stop(() => {
      this.startPositionMs = 0;
      this.pausedPositionMs = 0;
      this.setStatus('ready');
    });
    devLog('info', 'audio', 'stopped');
  }

  async release(): Promise<void> {
    if (!this.sound) {
      this.loadedPath = null;
      this.startPositionMs = 0;
      this.pausedPositionMs = 0;
      this.durationMs = 0;
      this.status = 'idle';
      return;
    }
    return new Promise<void>((resolve) => {
      const s = this.sound;
      this.sound = null;
      this.loadedPath = null;
      this.startPositionMs = 0;
      this.pausedPositionMs = 0;
      this.durationMs = 0;
      this.status = 'idle';
      this.emit();
      if (s) {
        try {
          s.release();
        } catch {
          // ignore
        }
      }
      resolve();
    });
  }
}

export const audioPlayer = new AudioPlayerService();