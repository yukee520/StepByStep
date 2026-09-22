import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  ensureLibraryDirs,
  packAudioPath,
  packCoverPath,
  packDir,
  packManifestPath,
  pickAudioExt,
  pickCoverExt,
} from '@/services/songLibrary';
import type {
  InstalledPack,
  PackDownloadPhase,
  PackDownloadState,
  RemotePackEntry,
  SongPackManifest,
} from '@/types/songPack';

export type DownloadProgressCallback = (state: PackDownloadState) => void;

export type InstallResult =
  | { ok: true; pack: InstalledPack }
  | { ok: false; error: string };

function initial(packId: string): PackDownloadState {
  return {
    packId,
    phase: 'idle',
    progress: 0,
    bytesWritten: 0,
    totalBytes: 0,
  };
}

function phaseState(
  packId: string,
  phase: PackDownloadPhase,
  extra: Partial<PackDownloadState> = {},
): PackDownloadState {
  return { ...initial(packId), phase, ...extra };
}

function validateManifest(raw: string): SongPackManifest | null {
  try {
    const parsed = JSON.parse(raw) as SongPackManifest;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
      return null;
    }
    if (typeof parsed.title !== 'string') {
      return null;
    }
    if (typeof parsed.bpm !== 'number' || parsed.bpm <= 0) {
      return null;
    }
    if (typeof parsed.durationMs !== 'number' || parsed.durationMs <= 0) {
      return null;
    }
    if (!Array.isArray(parsed.chart)) {
      return null;
    }
    for (const note of parsed.chart) {
      if (
        !note ||
        typeof note.timeMs !== 'number' ||
        typeof note.direction !== 'string'
      ) {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string> {
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS URLs are allowed');
  }
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}

export async function fetchManifest(url: string): Promise<SongPackManifest> {
  const raw = await fetchText(url);
  const manifest = validateManifest(raw);
  if (!manifest) {
    throw new Error('Song pack manifest is invalid');
  }
  return manifest;
}

async function downloadFile(
  url: string,
  dest: string,
  onProgress: (written: number, total: number) => void,
): Promise<string> {
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS URLs are allowed');
  }
  const res = await ReactNativeBlobUtil.config({
    path: dest,
    overwrite: true,
    timeout: 30000,
  })
    .fetch('GET', url)
    .progress({ interval: 250 }, (written, total) => {
      onProgress(Number(written), Number(total));
    });
  const status = res.info().status;
  if (status < 200 || status >= 300) {
    throw new Error(`Download failed with status ${status}`);
  }
  return res.path();
}

export type InstallPackOptions = {
  entry: RemotePackEntry;
  onProgress?: DownloadProgressCallback;
};

export async function installPack(options: InstallPackOptions): Promise<InstallResult> {
  const { entry, onProgress } = options;
  const packId = entry.id;
  const dir = packDir(packId);

  try {
    onProgress?.(phaseState(packId, 'manifest', { message: 'Fetching manifest' }));
    const manifest = await fetchManifest(entry.manifestUrl);

    await ensureLibraryDirs();
    const dirExists = await RNFS.exists(dir);
    if (dirExists) {
      await RNFS.unlink(dir);
    }
    await RNFS.mkdir(dir);

    const manifestPath = packManifestPath(packId);
    await RNFS.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    let audioPath: string | undefined;
    if (entry.audioUrl) {
      const ext = pickAudioExt(entry.audioUrl);
      audioPath = packAudioPath(packId, ext);
      onProgress?.(
        phaseState(packId, 'audio', { message: 'Downloading audio', progress: 0 }),
      );
      await downloadFile(entry.audioUrl, audioPath, (written, total) => {
        const progress = total > 0 ? written / total : 0;
        onProgress?.(
          phaseState(packId, 'audio', {
            message: 'Downloading audio',
            progress,
            bytesWritten: written,
            totalBytes: total,
          }),
        );
      });
    }

    let coverPath: string | undefined;
    if (entry.coverUrl) {
      const ext = pickCoverExt(entry.coverUrl);
      coverPath = packCoverPath(packId, ext);
      onProgress?.(
        phaseState(packId, 'cover', { message: 'Downloading cover', progress: 0 }),
      );
      try {
        await downloadFile(entry.coverUrl, coverPath, (written, total) => {
          const progress = total > 0 ? written / total : 0;
          onProgress?.(
            phaseState(packId, 'cover', {
              message: 'Downloading cover',
              progress,
              bytesWritten: written,
              totalBytes: total,
            }),
          );
        });
      } catch {
        coverPath = undefined;
      }
    }

    onProgress?.(phaseState(packId, 'saving', { message: 'Finalizing' }));

    const stat = await RNFS.stat(manifestPath);
    const pack: InstalledPack = {
      id: manifest.id,
      title: manifest.title,
      artist: manifest.artist,
      bpm: manifest.bpm,
      difficulty: manifest.difficulty,
      version: manifest.version,
      installedAt: Date.now(),
      sizeBytes: Number(stat.size) + (entry.sizeBytes > 0 ? 0 : 0),
      manifestPath,
      audioPath,
      coverPath,
    };

    onProgress?.(phaseState(packId, 'done', { progress: 1, message: 'Installed' }));
    return { ok: true, pack };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Install failed';
    onProgress?.(phaseState(packId, 'error', { message }));
    return { ok: false, error: message };
  }
}

export async function uninstallPack(packId: string): Promise<boolean> {
  try {
    const dir = packDir(packId);
    const exists = await RNFS.exists(dir);
    if (exists) {
      await RNFS.unlink(dir);
    }
    return true;
  } catch {
    return false;
  }
}