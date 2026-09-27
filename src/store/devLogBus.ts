// src/store/devLogBus.ts
//
// Simple in-memory log bus for the on-screen dev overlay.
// Deliberately does NOT use Zustand so it can be called from any thread/context
// without dependency on store initialization order.

const MAX_LINES = 40;

let lines: string[] = [];
const listeners = new Set<(l: string[]) => void>();

function emit(): void {
  // Emit a shallow copy so listeners can't mutate our internal array.
  const snapshot = lines.slice();
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // Swallow listener errors — they must not break the game loop.
    }
  });
}

export function pushLog(line: string): void {
  lines = lines.concat(line);
  if (lines.length > MAX_LINES) {
    lines = lines.slice(lines.length - MAX_LINES);
  }
  emit();
}

export function clearLog(): void {
  lines = [];
  emit();
}

export function subscribeLog(fn: (l: string[]) => void): () => void {
  listeners.add(fn);
  fn(lines.slice());
  return () => {
    listeners.delete(fn);
  };
}