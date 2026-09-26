// src/services/chartGenerator.ts
import type { BeatMarker, ChartGenerationOptions } from '@/types/builder';
import type { Difficulty, Direction, Note } from '@/types/song';
import { DIFFICULTY_NOTE_DENSITY } from '@/types/song';
import { genId } from '@/utils/id';

const LANES: Direction[] = ['left', 'down', 'up', 'right'];

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32)
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

const CHORD_CHANCE: Record<Difficulty, number> = {
  easy: 0,
  normal: 0.08,
  hard: 0.2,
  expert: 0.28,
};

const CHORD_MIN_GAP_MS = 250;
const CHORD_SKIP_HEAD_MS = 2000;
const CHORD_SKIP_TAIL_MS = 2000;

// ---------------------------------------------------------------------------
// Hold configuration (Batch 1c-2)
// ---------------------------------------------------------------------------

/**
 * Probability that any given tick *without a chord partner nearby* becomes a
 * hold note. Holds never fire on back-to-back ticks (see HOLD_MIN_GAP_MS).
 */
const HOLD_CHANCE: Record<Difficulty, number> = {
  easy: 0,
  normal: 0.05,
  hard: 0.12,
  expert: 0.18,
};

/**
 * How long a hold lasts, in beats. Chosen per difficulty.
 * The generator picks randomly in [min, max] and snaps to a beat fraction.
 */
const HOLD_BEATS: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 0, max: 0 },
  normal: { min: 1, max: 1 },
  hard: { min: 1, max: 2 },
  expert: { min: 1, max: 2 },
};

/** Minimum gap (ms) between two hold starts in the same song. */
const HOLD_MIN_GAP_MS = 1200;
const HOLD_SKIP_HEAD_MS = 3000;
const HOLD_SKIP_TAIL_MS = 3000;

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

function subdivisionsFor(difficulty: Difficulty): number {
  const density = DIFFICULTY_NOTE_DENSITY[difficulty];
  if (density <= 0.5) return 0.5;
  if (density <= 1) return 1;
  if (density <= 2) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Chord pass (1c-1) — unchanged
// ---------------------------------------------------------------------------

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

    if (t - lastChordTime > CHORD_MIN_GAP_MS * 4) {
      recentlyUsedLanes.clear();
    }

    const canChord =
      t >= headLimit && t <= tailLimit && rng() < chance;

    if (!canChord) {
      output.push(anchor);
      i = j;
      continue;
    }

    const candidates: Direction[] = LANES.filter((d) => {
      if (d === anchor.direction) return false;
      if (recentlyUsedLanes.has(d)) return false;
      if (hasNeighbourWithin(byLane[d], t, CHORD_MIN_GAP_MS)) return false;
      return true;
    });

    if (candidates.length === 0) {
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

function hasNeighbourWithin(
  laneNotes: Note[],
  t: number,
  gapMs: number,
): boolean {
  for (let i = 0; i < laneNotes.length; i += 1) {
    const dt = Math.abs(laneNotes[i].timeMs - t);
    if (dt === 0) continue;
    if (dt <= gapMs) return true;
    if (laneNotes[i].timeMs > t + gapMs) break;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Hold pass (1c-2) — new
// ---------------------------------------------------------------------------

/**
 * Convert some tap notes into hold notes.
 *
 * Rules:
 * - A note can be converted regardless of whether it's a chord member.
 * - A chord where BOTH notes are holds is skipped (would require holding two
 *   buttons at once; disorienting).
 * - Holds in different lanes can overlap in time.
 * - A hold's tail must not collide with another note in the SAME lane —
 *   ensure the hold ends before the next note in that lane.
 * - Consecutive holds in the same song are spaced by HOLD_MIN_GAP_MS.
 */
/**
 * Convert some tap notes into hold notes.
 *
 * Safety rules — the "max 2 simultaneous inputs" guarantee:
 * - A hold's duration must not overlap with any CHORD tick (a tick with 2
 *   notes). Chord + hold at the SAME tick is fine (2 fingers), but a chord
 *   starting while a hold is ongoing would require 3 fingers.
 * - A hold's duration must not overlap with any other note in the SAME lane.
 * - Consecutive holds are spaced by HOLD_MIN_GAP_MS.
 * - Only one note per tick may become a hold.
 */
function applyHolds(
  notes: Note[],
  difficulty: Difficulty,
  songId: string,
  bpm: number,
  durationMs: number,
): Note[] {
  const chance = HOLD_CHANCE[difficulty];
  if (chance <= 0 || notes.length === 0) {
    return notes;
  }

  const seed = hashString(`${songId}|holds|${difficulty}`);
  const rng = mulberry32(seed);
  const beatMs = 60000 / Math.max(1, bpm);
  const { min: minBeats, max: maxBeats } = HOLD_BEATS[difficulty];

  const headLimit = HOLD_SKIP_HEAD_MS;
  const tailLimit = durationMs - HOLD_SKIP_TAIL_MS;

  // Index by lane for same-lane collision checks.
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

  /**
   * A tick is a "chord tick" if 2+ notes share its timeMs.
   * Precompute a set of chord tick times for O(1) lookup.
   */
  const chordTicks = new Set<number>();
  {
    let i = 0;
    while (i < notes.length) {
      let j = i + 1;
      while (j < notes.length && notes[j].timeMs === notes[i].timeMs) {
        j += 1;
      }
      if (j - i >= 2) {
        chordTicks.add(notes[i].timeMs);
      }
      i = j;
    }
  }

  /**
   * Does the time window (startExclusive, endExclusive) contain any chord
   * tick? Chords at exactly `start` are OK (that's a "hold + tap" chord).
   */
  const hasChordInside = (start: number, end: number): boolean => {
    for (const t of chordTicks) {
      if (t > start && t < end) return true;
    }
    return false;
  };

  const result: Note[] = notes.map((n) => ({ ...n }));

  let lastHoldEnd = -Infinity;
  let lastHoldTime = -Infinity;

  for (let i = 0; i < result.length; i += 1) {
    const note = result[i];

    if (note.timeMs < headLimit || note.timeMs > tailLimit) continue;
    if (note.timeMs - lastHoldTime < HOLD_MIN_GAP_MS) continue;
    if (note.timeMs < lastHoldEnd) continue;

    // Skip if a hold already exists at this tick.
    // (Iterating in order means the first note at a tick is the winner.)
    let tickHasHold = false;
    for (const other of result) {
      if (other.timeMs !== note.timeMs) continue;
      if ((other.durationMs ?? 0) > 0) {
        tickHasHold = true;
        break;
      }
    }
    if (tickHasHold) continue;

    if (rng() >= chance) continue;

    const beats = minBeats + rng() * (maxBeats - minBeats);
    const snappedBeats = Math.round(beats * 2) / 2;
    let holdMs = Math.max(200, snappedBeats * beatMs);

    // Clamp against the next same-lane note.
    const laneNotes = byLane[note.direction];
    const idx = laneNotes.findIndex((n) => n.id === note.id);
    const nextInLane = idx >= 0 ? laneNotes[idx + 1] : undefined;
    if (nextInLane) {
      const maxMs = nextInLane.timeMs - note.timeMs - 120;
      if (maxMs < 200) continue;
      holdMs = Math.min(holdMs, maxMs);
    }

    // Clamp against any chord tick during the hold span.
    // Find the earliest chord tick strictly after this note.
    let nextChordTime = Infinity;
    for (const t of chordTicks) {
      if (t > note.timeMs && t < note.timeMs + holdMs) {
        if (t < nextChordTime) nextChordTime = t;
      }
    }
    if (nextChordTime < Infinity) {
      const maxMs = nextChordTime - note.timeMs - 60;
      if (maxMs < 200) continue;
      holdMs = Math.min(holdMs, maxMs);
    }

    // Final safety: nothing that would create a chord should be inside.
    if (hasChordInside(note.timeMs, note.timeMs + holdMs)) {
      continue;
    }

    note.durationMs = Math.round(holdMs);
    lastHoldEnd = note.timeMs + note.durationMs;
    lastHoldTime = note.timeMs;
  }

  return result;
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

  const recentLanes: Direction[] = [];
  let currentPatternIndex = Math.floor(rng() * patternBank.length);
  let patternCursor = 0;
  let beatsUntilNextPattern = 4 + Math.floor(rng() * 4);
  let lastPatternIndex = -1;

  const notes: Note[] = [];

  const pushNote = (timeMs: number, direction: Direction): void => {
    if (timeMs < startMs || timeMs > endMs) return;
    notes.push({
      id: genId('note'),
      timeMs: Math.round(timeMs),
      direction,
    });
    recentLanes.push(direction);
    if (recentLanes.length > 8) recentLanes.shift();
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
    if (recentUse < 3) return direction;
    const usage: Record<Direction, number> = { left: 0, down: 0, up: 0, right: 0 };
    for (const d of recentLanes) usage[d] += 1;
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
    if (anchor > endMs) break;

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
        if (t > endMs) break;
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

  notes.sort((a, b) => {
    if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
    return LANES.indexOf(a.direction) - LANES.indexOf(b.direction);
  });

  const deduped = dedupeStacked(notes);

  const effectiveDuration =
    options.endAtMs > 0
      ? options.endAtMs
      : deduped.length > 0
        ? deduped[deduped.length - 1].timeMs + 2000
        : 0;

  // 1) Chords first — adds partners.
  const withChords = applyChords(
    deduped,
    options.difficulty,
    options.songId ?? 'default',
    effectiveDuration,
  );

  // 2) Holds second — converts taps (chord members included) into holds.
  const withHolds = applyHolds(
    withChords,
    options.difficulty,
    options.songId ?? 'default',
    options.bpm,
    effectiveDuration,
  );

  withHolds.sort((a, b) => {
    if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
    return LANES.indexOf(a.direction) - LANES.indexOf(b.direction);
  });

  return withHolds;
}

function dedupeStacked(notes: Note[]): Note[] {
  const out: Note[] = [];
  for (const note of notes) {
    const clash = out.find(
      (n) => n.timeMs === note.timeMs && n.direction === note.direction,
    );
    if (!clash) out.push(note);
  }
  return out;
}

export function maxPossibleScore(noteCount: number): number {
  return noteCount * 300;
}

export function estimateChartDuration(notes: Note[]): number {
  if (notes.length === 0) return 0;
  return notes[notes.length - 1].timeMs;
}