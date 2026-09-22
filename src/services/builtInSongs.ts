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
];