import Sound from 'react-native-sound';

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
  | 'ended'
  | 'error';

type Listener = (status: AudioStatus, positionMs: number) => void;

class AudioPlayerService {
  private sound: Sound | null = null;
  private loadedPath: string | null = null;
  private status: AudioStatus = 'idle';
  private durationMs = 0;
  private listeners = new Set<Listener>();

  private playStartedAt = 0;
  private startPositionMs = 0;
  private pausedPositionMs = 0;
  private ended = false;

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

  hasEnded(): boolean {
    return this.ended;
  }

  getDurationMs(): number {
    return this.durationMs;
  }

  getPositionMs(): number {
    if (this.status === 'playing') {
      const elapsed = Date.now() - this.playStartedAt;
      const pos = this.startPositionMs + elapsed;
      return Math.round(Math.max(0, pos));
    }
    if (this.status === 'paused') {
      return Math.round(this.pausedPositionMs);
    }
    if (this.status === 'ended') {
      return Math.round(this.durationMs);
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

    return new Promise<AudioLoadResult>((resolve) => {
      const sound = new Sound(path, '', (error) => {
        if (error) {
          this.status = 'error';
          this.emit();
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
        this.ended = false;
        this.setStatus('ready');
        resolve({ ok: true, durationMs: this.durationMs });
      });
    });
  }

  play(startAtMs = 0): void {
    if (!this.sound) {
      return;
    }
    if (startAtMs > 0) {
      const seconds = startAtMs / 1000;
      try {
        this.sound.setCurrentTime(seconds);
      } catch {
        // ignore
      }
    }
    this.startPositionMs = Math.max(0, startAtMs);
    this.playStartedAt = Date.now();
    this.pausedPositionMs = this.startPositionMs;
    this.ended = false;

    this.sound.play((success) => {
      if (!success) {
        this.setStatus('error');
        return;
      }
      this.ended = true;
      this.startPositionMs = this.durationMs;
      this.pausedPositionMs = this.durationMs;
      this.setStatus('ended');
    });

    this.setStatus('playing');
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
      this.ended = false;
      this.setStatus('ready');
    });
  }

  async release(): Promise<void> {
    if (!this.sound) {
      this.loadedPath = null;
      this.startPositionMs = 0;
      this.pausedPositionMs = 0;
      this.durationMs = 0;
      this.ended = false;
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
      this.ended = false;
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