import RNFS from 'react-native-fs';
import { builtInSongs } from '@/services/builtInSongs';
import type { Song } from '@/types/song';
import type { InstalledPack, SongPackManifest } from '@/types/songPack';


export const SONGS_ROOT = `${RNFS.DocumentDirectoryPath}/StepByStep/songs`;
export const BUILDER_ROOT = `${RNFS.DocumentDirectoryPath}/StepByStep/builder`;
export const EXPORTS_ROOT = `${RNFS.DocumentDirectoryPath}/StepByStep/exports`;

export async function ensureLibraryDirs(): Promise<void> {
  const dirs = [SONGS_ROOT, BUILDER_ROOT, EXPORTS_ROOT];
  for (const dir of dirs) {
    const exists = await RNFS.exists(dir);
    if (!exists) {
      await RNFS.mkdir(dir);
    }
  }
}

export function packDir(packId: string): string {
  return `${SONGS_ROOT}/${packId}`;
}

export function packManifestPath(packId: string): string {
  return `${packDir(packId)}/manifest.json`;
}

export function packAudioPath(packId: string, ext = 'mp3'): string {
  return `${packDir(packId)}/audio.${ext}`;
}

export function packCoverPath(packId: string, ext = 'png'): string {
  return `${packDir(packId)}/cover.${ext}`;
}

function extFromUrl(url: string, fallback: string): string {
  const clean = url.split('?')[0];
  const dot = clean.lastIndexOf('.');
  if (dot < 0) {
    return fallback;
  }
  const ext = clean.slice(dot + 1).toLowerCase();
  if (ext.length === 0 || ext.length > 5) {
    return fallback;
  }
  return ext;
}

export function pickAudioExt(url: string | undefined): string {
  if (!url) {
    return 'mp3';
  }
  return extFromUrl(url, 'mp3');
}

export function pickCoverExt(url: string | undefined): string {
  if (!url) {
    return 'png';
  }
  return extFromUrl(url, 'png');
}

function manifestToSong(pack: InstalledPack, manifest: SongPackManifest): Song {
  return {
    id: manifest.id,
    title: manifest.title,
    artist: manifest.artist,
    bpm: manifest.bpm,
    durationMs: manifest.durationMs,
    difficulty: manifest.difficulty,
    offsetMs: manifest.offsetMs,
    source: 'pack',
    packId: pack.id,
    audioPath: pack.audioPath,
    coverPath: pack.coverPath,
    chart: {
      difficulty: manifest.difficulty,
      laneCount: 4,
      notes: manifest.chart,
    },
    version: manifest.version,
    license: manifest.license,
    generatedBy: manifest.generatedBy,
  };
}

async function loadInstalledSong(pack: InstalledPack): Promise<Song | null> {
  try {
    const exists = await RNFS.exists(pack.manifestPath);
    if (!exists) {
      return null;
    }
    const raw = await RNFS.readFile(pack.manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as SongPackManifest;
    if (!parsed || !Array.isArray(parsed.chart)) {
      return null;
    }
    return manifestToSong(pack, parsed);
  } catch {
    return null;
  }
}

export async function loadAllSongs(installedPacks: InstalledPack[]): Promise<Song[]> {
  await ensureLibraryDirs();
  const packSongs = await Promise.all(installedPacks.map(loadInstalledSong));
  const valid = packSongs.filter((s): s is Song => s !== null);
  return [...builtInSongs, ...valid];
}

export function findSongById(songs: Song[], id: string): Song | undefined {
  return songs.find((s) => s.id === id);
}

export function sortSongs(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === 'pack' ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });
}