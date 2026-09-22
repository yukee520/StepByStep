export function msToClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function msToSeconds(ms: number): number {
  if (!Number.isFinite(ms)) {
    return 0;
  }
  return ms / 1000;
}

export function secondsToMs(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return 0;
  }
  return Math.round(seconds * 1000);
}

export function bpmToBeatMs(bpm: number): number {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return 500;
  }
  return 60000 / bpm;
}

export function beatsToMs(beats: number, bpm: number): number {
  return beats * bpmToBeatMs(bpm);
}

export function clampMs(ms: number, min: number, max: number): number {
  if (ms < min) {
    return min;
  }
  if (ms > max) {
    return max;
  }
  return ms;
}