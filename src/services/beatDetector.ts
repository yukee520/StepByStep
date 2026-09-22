import type { BeatMarker } from '@/types/builder';
import { genId } from '@/utils/id';

export type TapDetectorState = {
  taps: number[];
};

export function createTapDetector(): TapDetectorState {
  return { taps: [] };
}

export function addTap(state: TapDetectorState, timeMs: number): number {
  state.taps.push(timeMs);
  return state.taps.length;
}

export function removeLastTap(state: TapDetectorState): number {
  state.taps.pop();
  return state.taps.length;
}

export function clearTaps(state: TapDetectorState): void {
  state.taps.length = 0;
}

export function estimateBpmFromTaps(taps: number[]): number | null {
  if (taps.length < 2) {
    return null;
  }
  const sorted = [...taps].sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const delta = sorted[i] - sorted[i - 1];
    if (delta > 120 && delta < 2000) {
      intervals.push(delta);
    }
  }
  if (intervals.length === 0) {
    return null;
  }
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  const bpm = 60000 / median;
  if (bpm < 40 || bpm > 300) {
    return null;
  }
  return Math.round(bpm * 10) / 10;
}

export function estimateOffsetFromTaps(taps: number[]): number | null {
  if (taps.length < 1) {
    return null;
  }
  const sorted = [...taps].sort((a, b) => a - b);
  return Math.round(sorted[0]);
}

export function quantizeTapsToBeats(
  taps: number[],
  bpm: number,
  toleranceMs = 60,
): number {
  if (taps.length < 2) {
    return taps.length;
  }
  const beatMs = 60000 / bpm;
  const origin = taps[0];
  let adjusted = 0;
  for (let i = 0; i < taps.length; i += 1) {
    const relative = taps[i] - origin;
    const nearestBeat = Math.round(relative / beatMs) * beatMs + origin;
    if (Math.abs(nearestBeat - taps[i]) <= toleranceMs) {
      taps[i] = nearestBeat;
      adjusted += 1;
    }
  }
  return adjusted;
}

export function generateBeatMarkersFromBpm(
  bpm: number,
  durationMs: number,
  startMs = 0,
): BeatMarker[] {
  const beatMs = 60000 / bpm;
  const markers: BeatMarker[] = [];
  let time = startMs;
  while (time <= durationMs) {
    markers.push({ id: genId('beat'), timeMs: Math.round(time) });
    time += beatMs;
  }
  return markers;
}

export function tapTimesToMarkers(taps: number[]): BeatMarker[] {
  return [...taps]
    .sort((a, b) => a - b)
    .map((timeMs) => ({ id: genId('beat'), timeMs: Math.round(timeMs) }));
}

export function averageInterval(taps: number[]): number | null {
  if (taps.length < 2) {
    return null;
  }
  const sorted = [...taps].sort((a, b) => a - b);
  let total = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    total += sorted[i] - sorted[i - 1];
  }
  return Math.round(total / (sorted.length - 1));
}