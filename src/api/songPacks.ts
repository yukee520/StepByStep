import type { RemotePackEntry, RemotePackIndex } from '@/types/songPack';

function assertHttps(url: string): void {
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS URLs are allowed');
  }
}

function isValidEntry(value: unknown): value is RemotePackEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.artist === 'string' &&
    typeof v.bpm === 'number' &&
    typeof v.difficulty === 'string' &&
    typeof v.manifestUrl === 'string'
  );
}

function normalizeIndex(parsed: unknown): RemotePackIndex {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Pack index is malformed');
  }
  const obj = parsed as Record<string, unknown>;
  const packsRaw = obj.packs;
  if (!Array.isArray(packsRaw)) {
    throw new Error('Pack index is missing packs array');
  }
  const packs = packsRaw.filter(isValidEntry).map<RemotePackEntry>((entry) => ({
    id: entry.id,
    title: entry.title,
    artist: entry.artist,
    bpm: entry.bpm,
    difficulty: entry.difficulty,
    sizeBytes: typeof entry.sizeBytes === 'number' ? entry.sizeBytes : 0,
    manifestUrl: entry.manifestUrl,
    audioUrl: entry.audioUrl,
    coverUrl: entry.coverUrl,
    version: typeof entry.version === 'number' ? entry.version : 1,
  }));
  const version = typeof obj.version === 'number' ? obj.version : 1;
  return { version, packs };
}

export async function fetchRemoteIndex(indexUrl: string): Promise<RemotePackIndex> {
  assertHttps(indexUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(indexUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Pack index is not valid JSON');
    }
    return normalizeIndex(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}