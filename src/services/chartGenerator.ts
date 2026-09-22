import type { BeatMarker, ChartGenerationOptions } from '@/types/builder';
import type { Difficulty, Direction, Note } from '@/types/song';
import { DIFFICULTY_NOTE_DENSITY } from '@/types/song';
import { genId } from '@/utils/id';

const LANE_ORDER: Direction[] = ['left', 'down', 'up', 'right'];

const PATTERN_BANK: Record<Difficulty, Direction[][]> = {
  easy: [
    ['left', 'right'],
    ['down', 'up'],
    ['left', 'up'],
    ['right', 'down'],
  ],
  normal: [
    ['left', 'down', 'up', 'right'],
    ['left', 'right', 'down', 'up'],
    ['up', 'down', 'left', 'right'],
    ['right', 'up', 'down', 'left'],
  ],
  hard: [
    ['left', 'right', 'up', 'down', 'left', 'right'],
    ['down', 'up', 'left', 'right', 'down', 'up'],
    ['left', 'up', 'right', 'down', 'up', 'left'],
    ['right', 'down', 'left', 'up', 'right', 'down'],
  ],
  expert: [
    ['left', 'down', 'up', 'right', 'down', 'up', 'left', 'right'],
    ['up', 'left', 'right', 'down', 'left', 'up', 'right', 'down'],
    ['left', 'right', 'left', 'down', 'up', 'right', 'up', 'down'],
    ['down', 'up', 'down', 'right', 'left', 'up', 'left', 'right'],
  ],
};

function densityDivisor(difficulty: Difficulty): number {
  const density = DIFFICULTY_NOTE_DENSITY[difficulty];
  if (density <= 0.5) {
    return 2;
  }
  if (density <= 1) {
    return 1;
  }
  if (density <= 2) {
    return 0.5;
  }
  return 0.25;
}

function pickPattern(difficulty: Difficulty, index: number): Direction[] {
  const bank = PATTERN_BANK[difficulty];
  return bank[index % bank.length];
}

function shouldDouble(difficulty: Difficulty, beatIndex: number): boolean {
  if (difficulty === 'easy') {
    return false;
  }
  if (difficulty === 'normal') {
    return beatIndex > 0 && beatIndex % 8 === 0;
  }
  if (difficulty === 'hard') {
    return beatIndex > 0 && beatIndex % 4 === 0;
  }
  return beatIndex > 0 && beatIndex % 2 === 0;
}

function doubledDirection(primary: Direction): Direction {
  const idx = LANE_ORDER.indexOf(primary);
  return LANE_ORDER[(idx + 2) % LANE_ORDER.length];
}

export function generateChart(
  beats: BeatMarker[],
  options: ChartGenerationOptions,
): Note[] {
  if (beats.length === 0) {
    return [];
  }

  const sorted = [...beats].sort((a, b) => a.timeMs - b.timeMs);
  const beatMs = 60000 / Math.max(1, options.bpm);
  const divisor = densityDivisor(options.difficulty);
  const subBeatMs = beatMs * divisor;
  const startMs = Math.max(0, options.startAtMs);
  const endMs = options.endAtMs > 0 ? options.endAtMs : Number.POSITIVE_INFINITY;
  const offsetMs = options.offsetMs;

  const notes: Note[] = [];
  let patternIndex = 0;
  let streamIndex = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const anchor = sorted[i].timeMs + offsetMs;
    if (anchor < startMs || anchor > endMs) {
      continue;
    }

    const pattern = pickPattern(options.difficulty, patternIndex);
    patternIndex += 1;

    notes.push({
      id: genId('note'),
      timeMs: Math.round(anchor),
      direction: pattern[streamIndex % pattern.length],
    });

    if (divisor < 1) {
      const subdivisions = Math.round(1 / divisor);
      for (let s = 1; s < subdivisions; s += 1) {
        const t = anchor + s * subBeatMs;
        if (t > endMs) {
          break;
        }
        streamIndex += 1;
        notes.push({
          id: genId('note'),
          timeMs: Math.round(t),
          direction: pattern[streamIndex % pattern.length],
        });
      }
    }

    streamIndex += 1;

    if (options.includeDoubles && shouldDouble(options.difficulty, i)) {
      const last = notes[notes.length - 1];
      const partner = doubledDirection(last.direction);
      notes.push({
        id: genId('note'),
        timeMs: last.timeMs,
        direction: partner,
      });
    }
  }

  notes.sort((a, b) => {
    if (a.timeMs !== b.timeMs) {
      return a.timeMs - b.timeMs;
    }
    return LANE_ORDER.indexOf(a.direction) - LANE_ORDER.indexOf(b.direction);
  });

  return dedupeStacked(notes);
}

function dedupeStacked(notes: Note[]): Note[] {
  const out: Note[] = [];
  for (const note of notes) {
    const clash = out.find(
      (n) => n.timeMs === note.timeMs && n.direction === note.direction,
    );
    if (!clash) {
      out.push(note);
    }
  }
  return out;
}

export function maxPossibleScore(noteCount: number): number {
  return noteCount * 300;
}

export function estimateChartDuration(notes: Note[]): number {
  if (notes.length === 0) {
    return 0;
  }
  return notes[notes.length - 1].timeMs;
}