// src/store/devLogBus.ts
const MAX_LINES = 100;

let lines: string[] = [];
const listeners = new Set<(l: string[]) => void>();

function emit(): void {
  const snapshot = lines.slice();
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // swallow
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