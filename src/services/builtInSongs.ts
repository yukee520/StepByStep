// src/services/builtInSongs.ts
import { genId } from '@/utils/id';
import type { Direction, Note, Song } from '@/types/song';

type SeedPattern = {
  bpm: number;
  durationMs: number;
  beatDivisor: number;
  directions: Direction[];
  startBeat: number;
  offsetMs: number;
};

function buildChart(seed: SeedPattern): Note[] {
  const beatMs = 60000 / seed.bpm;
  const stepMs = beatMs / seed.beatDivisor;
  const totalSteps = Math.floor((seed.durationMs - seed.offsetMs) / stepMs);
  const notes: Note[] = [];
  for (let i = 0; i < totalSteps; i += 1) {
    const timeMs = seed.offsetMs + i * stepMs;
    if (timeMs < seed.startBeat * beatMs) {
      continue;
    }
    const direction = seed.directions[i % seed.directions.length];
    notes.push({
      id: genId('note'),
      timeMs: Math.round(timeMs),
      direction,
    });
  }
  return notes;
}

const metroSeeds: SeedPattern[] = [
  {
    bpm: 100,
    durationMs: 45000,
    beatDivisor: 2,
    directions: ['left', 'right', 'up', 'down'],
    startBeat: 4,
    offsetMs: 800,
  },
];

const pulseSeeds: SeedPattern[] = [
  {
    bpm: 128,
    durationMs: 60000,
    beatDivisor: 2,
    directions: ['left', 'down', 'up', 'right', 'down', 'up'],
    startBeat: 4,
    offsetMs: 500,
  },
];

const rushSeeds: SeedPattern[] = [
  {
    bpm: 150,
    durationMs: 75000,
    beatDivisor: 2,
    directions: ['up', 'left', 'right', 'down', 'left', 'up', 'right', 'down'],
    startBeat: 4,
    offsetMs: 400,
  },
];

// ---------------------------------------------------------------------------
// Dev-only hold demo — see comment below
// ---------------------------------------------------------------------------

/**
 * Dev-only demo chart: pure hold notes, one per bar, alternating lanes.
 * No audio, no chords, no randomness. Purpose: isolate hold lifecycle.
 *
 * 90 BPM  =>  beat = 666.67 ms
 * Bar     =>  4 beats = 2666.67 ms
 *
 * Notes arrive at (from song start):
 *   bar 0: left,   hold 1 beat (667 ms)   @ ~2000 ms
 *   bar 1: down,   hold 2 beats (1333 ms) @ ~4667 ms
 *   bar 2: up,     hold 3 beats (2000 ms) @ ~7333 ms
 *   bar 3: right,  hold 4 beats (2667 ms) @ ~10000 ms
 *   bar 4: left,   hold 1 beat            @ ~12667 ms
 *   bar 5: down,   hold 2 beats           @ ~15333 ms
 *   bar 6: up,     hold 3 beats           @ ~18000 ms
 *   bar 7: right,  hold 4 beats           @ ~20667 ms
 */
function buildHoldDemoNotes(): Note[] {
  const beat = 60000 / 90; // 666.67 ms
  const bar = beat * 4;    // 2666.67 ms
  const leadIn = 2000;

  const lanes: Direction[] = [
    'left',
    'down',
    'up',
    'right',
    'left',
    'down',
    'up',
    'right',
  ];
  const holdBeats = [1, 2, 3, 4, 1, 2, 3, 4];

  const notes: Note[] = [];
  for (let i = 0; i < lanes.length; i += 1) {
    notes.push({
      id: `demo_hold_${i}`,
      timeMs: Math.round(leadIn + i * bar),
      direction: lanes[i],
      durationMs: Math.round(holdBeats[i] * beat),
      isChord: false,
    });
  }
  return notes;
}

export const DEMO_HOLD_SONG: Song = {
  id: 'demo-holds',
  title: 'DEV — Hold Demo',
  artist: 'Internal',
  bpm: 90,
  durationMs: 2000 + 8 * 2666 + 3000,
  difficulty: 'normal',
  offsetMs: 0,
  source: 'builtin',
  version: 1,
  license: 'Internal',
  generatedBy: 'Demo',
  chart: {
    difficulty: 'normal',
    laneCount: 4,
    notes: buildHoldDemoNotes(),
  },
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const builtInSongs: Song[] = [
  {
    id: 'builtin-metronome',
    title: 'Metronome Warm-Up',
    artist: 'StepByStep',
    bpm: 100,
    durationMs: 45000,
    difficulty: 'easy',
    offsetMs: 0,
    source: 'builtin',
    version: 1,
    license: 'CC0',
    generatedBy: 'StepByStep built-in',
    chart: {
      difficulty: 'easy',
      laneCount: 4,
      notes: buildChart(metroSeeds[0]),
    },
  },
  {
    id: 'builtin-pulse',
    title: 'Pulse Driver',
    artist: 'StepByStep',
    bpm: 128,
    durationMs: 60000,
    difficulty: 'normal',
    offsetMs: 0,
    source: 'builtin',
    version: 1,
    license: 'CC0',
    generatedBy: 'StepByStep built-in',
    chart: {
      difficulty: 'normal',
      laneCount: 4,
      notes: buildChart(pulseSeeds[0]),
    },
  },
  {
    id: 'builtin-rush',
    title: 'Rush Hour',
    artist: 'StepByStep',
    bpm: 150,
    durationMs: 75000,
    difficulty: 'hard',
    offsetMs: 0,
    source: 'builtin',
    version: 1,
    license: 'CC0',
    generatedBy: 'StepByStep built-in',
    chart: {
      difficulty: 'hard',
      laneCount: 4,
      notes: buildChart(rushSeeds[0]),
    },
  },
  // Dev-only demo — always present in the array; the SongSelect screen
  // filters it out unless dev mode is on.
  DEMO_HOLD_SONG,
];