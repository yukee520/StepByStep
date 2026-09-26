// src/services/chartGenerator.ts
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
// Chord configuration (Batch 1c-1)
// ---------------------------------------------------------------------------

/**
 * Probability that any given "note tick" gets a chord partner.
 *
 *   easy:   none
 *   normal: casual (~8%)
 *   hard:   standard (~20%)
 *   expert: standard+ (~28%)
 */
const CHORD_CHANCE: Record<Difficulty, number> = {
  easy: 0,
  normal: 0.08,
  hard: 0.2,
  expert: 0.28,
};

/**
 * Minimum time gap (ms) to the *next* note in either candidate lane for a
 * chord to be fair. If either lane has a note within this window (before or
 * after), the chord is skipped for this tick.
 */
const CHORD_MIN_GAP_MS = 250;

/**
 * Skip chords during the first and last N ms of the song — openings and
 * endings should breathe.
 */
const CHORD_SKIP_HEAD_MS = 2000;
const CHORD_SKIP_TAIL_MS = 2000;

// ---------------------------------------------------------------------------
// Pattern banks
// ---------------------------------------------------------------------------

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
    return 0.5;
  }
  if (density <= 1) {
    return 1;
  }
  if (density <= 2) {
    return 2;
  }
  return 3;
}

// ---------------------------------------------------------------------------
// Chord pass (Batch 1c-1)
// ---------------------------------------------------------------------------

/**
 * Given a set of tap notes (already sorted by time), return a NEW array with
 * chord partners added based on difficulty.
 *
 * A chord is two notes in DIFFERENT lanes with the exact same `timeMs`.
 * Never three or more. Never two in the same lane.
 *
 * Deterministic: same input + same `songId` produces the same output.
 */
function applyChords(
  notes: Note[],
  difficulty: Difficulty,
  songId: string,
  durationMs: number,
): Note[] {
  const chance = CHORD_CHANCE[difficulty];
  if (chance <= 0 || notes.length === 0) {
    return notes;
  }

  const seed = hashString(`${songId}|chords|${difficulty}`);
  const rng = mulberry32(seed);

  // Bucket notes by lane for fast neighbour checks. We rebuild these
  // incrementally as we add chord partners, so later chords see earlier ones.
  const byLane: Record<Direction, Note[]> = {
    left: [],
    down: [],
    up: [],
    right: [],
  };
  for (const n of notes) {
    byLane[n.direction].push(n);
  }
  for (const d of LANES) {
    byLane[d].sort((a, b) => a.timeMs - b.timeMs);
  }

  const headLimit = CHORD_SKIP_HEAD_MS;
  const tailLimit = durationMs - CHORD_SKIP_TAIL_MS;

  const output: Note[] = [];
  const recentlyUsedLanes = new Set<Direction>();
  let lastChordTime = -Infinity;

  // Group notes by exact timeMs so we only chord once per tick.
  let i = 0;
  while (i < notes.length) {
    const group: Note[] = [notes[i]];
    let j = i + 1;
    while (j < notes.length && notes[j].timeMs === notes[i].timeMs) {
      group.push(notes[j]);
      j += 1;
    }

    const anchor = group[0];
    const t = anchor.timeMs;

    // Already a chord at this tick? (Shouldn't happen from base generator,
    // but be safe.) Push as-is and move on.
    if (group.length >= 2) {
      for (const n of group) {
        output.push({ ...n, isChord: true });
      }
      recentlyUsedLanes.clear();
      recentlyUsedLanes.add(group[0].direction);
      recentlyUsedLanes.add(group[1].direction);
      lastChordTime = t;
      i = j;
      continue;
    }

    // Clear "recently used lanes" memory after enough time has passed.
    if (t - lastChordTime > CHORD_MIN_GAP_MS * 4) {
      recentlyUsedLanes.clear();
    }

    // Eligibility checks.
    const canChord =
      t >= headLimit && t <= tailLimit && rng() < chance;

    if (!canChord) {
      output.push(anchor);
      i = j;
      continue;
    }

    // Candidate lanes: different from anchor's, not recently used, and no
    // nearby note within CHORD_MIN_GAP_MS.
    const candidates: Direction[] = LANES.filter((d) => {
      if (d === anchor.direction) {
        return false;
      }
      if (recentlyUsedLanes.has(d)) {
        return false;
      }
      if (hasNeighbourWithin(byLane[d], t, CHORD_MIN_GAP_MS)) {
        return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      // Can't safely chord — just push the anchor.
      output.push(anchor);
      i = j;
      continue;
    }

    const partnerLane = candidates[Math.floor(rng() * candidates.length)];
    const partnerNote: Note = {
      id: genId('note'),
      timeMs: t,
      direction: partnerLane,
      isChord: true,
    };

    output.push({ ...anchor, isChord: true });
    output.push(partnerNote);

    // Register the new note for future neighbour checks.
    byLane[partnerLane].push(partnerNote);
    byLane[partnerLane].sort((a, b) => a.timeMs - b.timeMs);

    recentlyUsedLanes.clear();
    recentlyUsedLanes.add(anchor.direction);
    recentlyUsedLanes.add(partnerLane);
    lastChordTime = t;

    i = j;
  }

  return output;
}

/**
 * Returns true if `laneNotes` (sorted by time) contains any note within
 * `gapMs` of `t`, excluding a note at exactly `t`.
 */
function hasNeighbourWithin(
  laneNotes: Note[],
  t: number,
  gapMs: number,
): boolean {
  for (let i = 0; i < laneNotes.length; i += 1) {
    const dt = Math.abs(laneNotes[i].timeMs - t);
    if (dt === 0) {
      continue;
    }
    if (dt <= gapMs) {
      return true;
    }
    if (laneNotes[i].timeMs > t + gapMs) {
      break;
    }
  }
  return false;
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
  let beatsUntilNextPattern = 4 + Math.floor(rng() * 4);
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

  const balanceLane = (direction: Direction): Direction => {
    const recentUse = recentLanes.filter((d) => d === direction).length;
    if (recentUse < 3) {
      return direction;
    }
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
      const subCount = Math.floor(subsPerBeat);
      for (let s = 0; s < subCount; s += 1) {
        const t = anchor + s * subBeatMs;
        if (t > endMs) {
          break;
        }
        let lane = pattern[(patternCursor + s) % pattern.length];
        lane = balanceLane(lane);
        pushNote(t, lane);
      }
    } else {
      if (i % 2 === 0) {
        const lane = balanceLane(dir);
        pushNote(anchor, lane);
      }
    }
  }

  // Sort by time then by lane order.
  notes.sort((a, b) => {
    if (a.timeMs !== b.timeMs) {
      return a.timeMs - b.timeMs;
    }
    return LANES.indexOf(a.direction) - LANES.indexOf(b.direction);
  });

  const deduped = dedupeStacked(notes);

  // Chord pass — Batch 1c-1.
  const withChords = applyChords(
    deduped,
    options.difficulty,
    options.songId ?? 'default',
    options.endAtMs > 0 ? options.endAtMs : deduped.length > 0
      ? deduped[deduped.length - 1].timeMs + 2000
      : 0,
  );

  // Final sort to ensure chord partners interleave correctly.
  withChords.sort((a, b) => {
    if (a.timeMs !== b.timeMs) {
      return a.timeMs - b.timeMs;
    }
    return LANES.indexOf(a.direction) - LANES.indexOf(b.direction);
  });

  return withChords;
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