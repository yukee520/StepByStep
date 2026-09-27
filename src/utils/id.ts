// src/utils/id.ts

/**
 * Turn an arbitrary string (including CJK) into a URL/filesystem-safe slug.
 * Falls back to a hash-based ID when the input has no ASCII alphanumerics.
 */
export function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  if (ascii.length > 0) {
    return ascii;
  }
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `song-${hash.toString(36)}`;
}

let counter = 0;

/**
 * Short, unique-enough ID generator for in-memory objects (notes, events,
 * feedback keys). Not cryptographically secure; don't use for persistence
 * keys that must survive across sessions.
 */
export function genId(prefix: string): string {
  counter = (counter + 1) >>> 0;
  const t = Date.now().toString(36);
  const c = counter.toString(36);
  const r = Math.floor(Math.random() * 0x10000).toString(36);
  return `${prefix}_${t}_${c}_${r}`;
}