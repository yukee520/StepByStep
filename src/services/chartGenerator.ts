import type { BeatMarker, ChartGenerationOptions } from '@/types/builder';
import type { Difficulty, Direction, Note } from '@/types/song';
import { DIFFICULTY_NOTE_DENSITY } from '@/types/song';
import { genId } from '@/utils/id';

const LANES: Direction[] = ['left', 'down', 'up', 'right'];

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) — deterministic per songId
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Pattern banks — many more than before
// Each pattern is an array of directions to play in sequence over a phrase.
// ---------------------------------------------------------------------------

type Pattern = {
  id: number;
  seq: Direction[];
};

// 16 short patterns per difficulty, deliberately varied
const EASY_PATTERNS: Direction[][] = [
  ['left', 'right'],
  ['down', 'up'],
  ['left', 'up'],
  ['right', 'down'],
  ['up', 'down'],
  ['right', 'left'],
  ['down', 'left'],
  ['up', 'right'],
  ['left', 'down'],
  ['right', 'up'],
  ['down', 'right'],
  ['up', 'left'],
  ['left', 'right', 'down', 'up'],
  ['up', 'down', 'left', 'right'],
  ['down', 'up', 'right', 'left'],
  ['right', 'left', 'up', 'down'],
];

const NORMAL_PATTERNS: Direction[][] = [
  ['left', 'down', 'up', 'right'],
  ['right', 'up', 'down', 'left'],
  ['up', 'left', 'right', 'down'],
  ['down', 'right', 'left', 'up'],
  ['left', 'right', 'up', 'down'],
  ['right', 'left', 'down', 'up'],
  ['up', 'down', 'left', 'right'],
  ['down', 'up', 'right', 'left'],
  ['left', 'up', 'right', 'down'],
  ['right', 'down', 'left', 'up'],
  ['up', 'right', 'down', 'left'],
  ['down', 'left', 'up', 'right'],
  ['left', 'down', 'right', 'up'],
  ['right', 'up', 'left', 'down'],
  ['up', 'left', 'down', 'right'],
  ['down', 'right', 'up', 'left'],
];

const HARD_PATTERNS: Direction[][] = [
  ['left', 'right', 'up', 'down', 'left', 'right'],
  ['down', 'up', 'left', 'right', 'down', 'up'],
  ['left', 'up', 'right', 'down', 'up', 'left'],
  ['right', 'down', 'left', 'up', 'right', 'down'],
  ['up', 'left', 'down', 'right', 'up', 'left'],
  ['down', 'right', 'up', 'left', 'down', 'right'],
  ['left', 'down', 'right', 'up', 'left', 'down'],
  ['right', 'up', 'left', 'down', 'right', 'up'],
  ['up', 'right', 'down', 'left', 'up', 'right'],
  ['down', 'left', 'up', 'right', 'down', 'left'],
  ['left', 'right', 'left', 'down', 'up', 'right'],
  ['right', 'left', 'right', 'up', 'down', 'left'],
  ['up', 'down', 'up', 'left', 'right', 'down'],
  ['down', 'up', 'down', 'right', 'left', 'up'],
  ['left', 'up', 'down', 'right', 'left', 'up'],
  ['right', 'down', 'up', 'left', 'right', 'down'],
];

const EXPERT_PATTERNS: Direction[][] = [
  ['left', 'down', 'up', 'right', 'down', 'up', 'left', 'right'],
  ['up', 'left', 'right', 'down', 'left', 'up', 'right', 'down'],
  ['left', 'right', 'left', 'down', 'up', 'right', 'up', 'down'],
  ['down', 'up', 'down', 'right', 'left', 'up', 'left', 'right'],
  ['right', 'left', 'down', 'up', 'right', 'down', 'left', 'up'],
  ['up', 'down', 'right', 'left', 'down', 'right', 'up', 'left'],
  ['left', 'up', 'right', 'down', 'left', 'down', 'up', 'right'],
  ['right', 'down', 'left', 'up', 'right', 'up', 'down', 'left'],
  ['down', 'left', 'up', 'right', 'down', 'left', 'up', 'right'],
  ['up', 'right', 'down', 'left', 'up', 'right', 'down', 'left'],
  ['left', 'right', 'down', 'up', 'right', 'left', 'up', 'down'],
  ['right', 'left', 'up', 'down', 'left', 'right', 'down', 'up'],
  ['up', 'left', 'down', 'right', 'up', 'down', 'left', 'right'],
  ['down', 'right', 'up', 'left', 'down', 'up', 'right', 'left'],
  ['left', 'down', 'right', 'up', 'right', 'down', 'left', 'up'],
  ['right', 'up', 'left', 'down', 'left', 'up', 'right', 'down'],
];

function patternsFor(difficulty: Difficulty): Direction[][] {
  switch (difficulty) {
    case 'easy':
      return EASY_PATTERNS;
    case 'normal':
      return NORMAL_PATTERNS;
    case 'hard':
      return HARD_PATTERNS;
    case 'expert':
    default:
      return EXPERT_PATTERNS;
  }
}

// ---------------------------------------------------------------------------
// Subdivision — how many notes per beat
// ---------------------------------------------------------------------------

function subdivisionsFor(difficulty: Difficulty): number {
  const density = DIFFICULTY_NOTE_DENSITY[difficulty];
  if (density <= 0.5) {
    return 0.5; // one note every 2 beats
  }
  if (density <= 1) {
    return 1; // one note per beat
  }
  if (density <= 2) {
    return 2; // two notes per beat
  }
  return 3; // three notes per beat (expert)
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateChart(
  beats: BeatMarker[],
  options: ChartGenerationOptions,
): Note[] {
  if (beats.length === 0) {
    return [];
  }

  const seed = hashString(
    `${options.songId ?? 'default'}|${options.difficulty}|${options.bpm}`,
  );
  const rng = mulberry32(seed);

  const sorted = [...beats].sort((a, b) => a.timeMs - b.timeMs);
  const beatMs = 60000 / Math.max(1, options.bpm);
  const subsPerBeat = subdivisionsFor(options.difficulty);
  const subBeatMs = beatMs / subsPerBeat;
  const startMs = Math.max(0, options.startAtMs);
  const endMs = options.endAtMs > 0 ? options.endAtMs : Number.POSITIVE_INFINITY;
  const offsetMs = options.offsetMs;

  const patternBank = patternsFor(options.difficulty);

  // Recent lane history for balance — last 8 directions
  const recentLanes: Direction[] = [];

  // Current pattern state
  let currentPatternIndex = Math.floor(rng() * patternBank.length);
  let patternCursor = 0;
  let beatsUntilNextPattern = 4 + Math.floor(rng() * 4); // 4-7 beats
  let lastPatternIndex = -1;

  const notes: Note[] = [];

  const pushNote = (timeMs: number, direction: Direction): void => {
    if (timeMs < startMs || timeMs > endMs) {
      return;
    }
    notes.push({
      id: genId('note'),
      timeMs: Math.round(timeMs),
      direction,
    });
    recentLanes.push(direction);
    if (recentLanes.length > 8) {
      recentLanes.shift();
    }
  };

  const pickPatternIndex = (): number => {
    let candidate = currentPatternIndex;
    let attempts = 0;
    while (candidate === lastPatternIndex && attempts < 8) {
      candidate = Math.floor(rng() * patternBank.length);
      attempts += 1;
    }
    return candidate;
  };

  /**
   * Swap a direction with its "opposite lane" if the recent lane history is
   * over-using that direction.
   */
  const balanceLane = (direction: Direction): Direction => {
    const recentUse = recentLanes.filter((d) => d === direction).length;
    if (recentUse < 3) {
      return direction;
    }
    // Pick a lane that hasn't been used much recently
    const usage: Record<Direction, number> = {
      left: 0,
      down: 0,
      up: 0,
      right: 0,
    };
    for (const d of recentLanes) {
      usage[d] += 1;
    }
    let best: Direction = direction;
    let bestCount = recentUse;
    for (const lane of LANES) {
      if (usage[lane] < bestCount) {
        best = lane;
        bestCount = usage[lane];
      }
    }
    return best;
  };

  for (let i = 0; i < sorted.length; i += 1) {
    const anchor = sorted[i].timeMs + offsetMs;
    if (anchor > endMs) {
      break;
    }

    // Rotate pattern after N beats
    if (beatsUntilNextPattern <= 0) {
      lastPatternIndex = currentPatternIndex;
      currentPatternIndex = pickPatternIndex();
      patternCursor = 0;
      beatsUntilNextPattern = 4 + Math.floor(rng() * 4);
    }

    const pattern = patternBank[currentPatternIndex];
    const dir = pattern[patternCursor % pattern.length];
    patternCursor += 1;
    beatsUntilNextPattern -= 1;

    if (subsPerBeat >= 1) {
      // Normal and above: 1+ notes per beat
      const subCount = Math.floor(subsPerBeat);
      for (let s = 0; s < subCount; s += 1) {
        const t = anchor + s * subBeatMs;
        if (t > endMs) {
          break;
        }
        // Choose lane from pattern with occasional lane-balancing
        let lane = pattern[(patternCursor + s) % pattern.length];
        lane = balanceLane(lane);
        pushNote(t, lane);
      }
    } else {
      // Easy: one note every two beats
      if (i % 2 === 0) {
        const lane = balanceLane(dir);
        pushNote(anchor, lane);
      }
    }

    // Double-note logic — scaled by difficulty and randomness
    if (options.includeDoubles) {
      const accented =
        options.difficulty === 'expert'
          ? i % 3 === 0
          : options.difficulty === 'hard'
            ? i % 4 === 0
            : i % 8 === 0;

      // Add a small random chance
      const roll = rng();
      const chance =
        options.difficulty === 'expert'
          ? 0.35
          : options.difficulty === 'hard'
            ? 0.2
            : 0.1;

      if (accented && roll < chance) {
        const primary = dir;
        const partner =
          LANES[(LANES.indexOf(primary) + 1 + Math.floor(rng() * 3)) % 4];
        pushNote(anchor, partner);
      }
    }
  }

  // Sort and deduplicate stacked notes
  notes.sort((a, b) => {
    if (a.timeMs !== b.timeMs) {
      return a.timeMs - b.timeMs;
    }
    return LANES.indexOf(a.direction) - LANES.indexOf(b.direction);
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