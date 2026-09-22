import Sound from 'react-native-sound';

Sound.setCategory('Playback', true);

export type AudioLoadResult = {
  ok: boolean;
  durationMs: number;
  error?: string;
};

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

type Listener = (status: AudioStatus, positionMs: number) => void;

class AudioPlayerService {
  private sound: Sound | null = null;
  private loadedPath: string | null = null;
  private status: AudioStatus = 'idle';
  private durationMs = 0;
  private startedAtMs = 0;
  private pausedAtMs = 0;
  private listeners = new Set<Listener>();

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

  getDurationMs(): number {
    return this.durationMs;
  }

  getPositionMs(): number {
    if (this.status === 'playing' && this.startedAtMs > 0) {
      return Date.now() - this.startedAtMs + this.pausedAtMs;
    }
    return this.pausedAtMs;
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
          resolve({ ok: false, durationMs: 0, error: error.message || 'Failed to load audio' });
          return;
        }
        this.sound = sound;
        this.loadedPath = path;
        this.durationMs = Math.round(sound.getDuration() * 1000);
        this.pausedAtMs = 0;
        this.startedAtMs = 0;
        this.setStatus('ready');
        resolve({ ok: true, durationMs: this.durationMs });
      });
    });
  }

  play(startAtMs = 0): void {
    if (!this.sound) {
      return;
    }
    const startSeconds = Math.max(0, startAtMs / 1000);
    this.sound.setCurrentTime(startSeconds);
    this.pausedAtMs = startAtMs;
    this.startedAtMs = Date.now();
    this.sound.play((success) => {
      if (!success) {
        this.setStatus('error');
        return;
      }
      this.startedAtMs = 0;
      this.pausedAtMs = this.durationMs;
      this.setStatus('idle');
    });
    this.setStatus('playing');
  }

  pause(): void {
    if (!this.sound || this.status !== 'playing') {
      return;
    }
    this.pausedAtMs = this.getPositionMs();
    this.startedAtMs = 0;
    this.sound.pause();
    this.setStatus('paused');
  }

  resume(): void {
    if (!this.sound || this.status !== 'paused') {
      return;
    }
    this.play(this.pausedAtMs);
  }

  stop(): void {
    if (!this.sound) {
      return;
    }
    this.sound.stop(() => {
      this.startedAtMs = 0;
      this.pausedAtMs = 0;
      this.setStatus('ready');
    });
  }

  async release(): Promise<void> {
    if (!this.sound) {
      this.loadedPath = null;
      this.startedAtMs = 0;
      this.pausedAtMs = 0;
      this.durationMs = 0;
      this.status = 'idle';
      return;
    }
    return new Promise<void>((resolve) => {
      const s = this.sound;
      this.sound = null;
      this.loadedPath = null;
      this.startedAtMs = 0;
      this.pausedAtMs = 0;
      this.durationMs = 0;
      this.status = 'idle';
      this.emit();
      if (s) {
        s.release();
      }
      resolve();
    });
  }
}

export const audioPlayer = new AudioPlayerService();