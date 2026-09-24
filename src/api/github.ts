import type {
  SongPackManifest,
  RemotePackEntry,
  RemotePackIndex,
} from '@/types/songPack';

export type GitHubRepoConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  packsPath: string;
  indexPath: string;
};

export type GitHubPublishFile = {
  path: string;
  content: string;
  isBinary?: boolean;
  message: string;
};

export type GitHubPublishResult =
  | { ok: true; url: string }
  | { ok: false; error: string; status: number };

function assertConfig(cfg: GitHubRepoConfig): string | null {
  if (!cfg.token || cfg.token.length < 20) {
    return 'GitHub token is missing or too short. Add it in Settings.';
  }
  if (!cfg.owner) {
    return 'GitHub owner is missing.';
  }
  if (!cfg.repo) {
    return 'GitHub repo name is missing.';
  }
  if (!cfg.branch) {
    return 'GitHub branch is missing.';
  }
  if (!cfg.packsPath) {
    return 'Packs folder is missing.';
  }
  if (!cfg.indexPath) {
    return 'Index path is missing.';
  }
  return null;
}

function encodeBase64(input: string): string {
  const g = globalThis as unknown as { btoa?: (s: string) => string };
  if (typeof g.btoa === 'function') {
    return g.btoa(unescape(encodeURIComponent(input)));
  }
  return input;
}

function decodeBase64(input: string): string {
  const g = globalThis as unknown as { atob?: (s: string) => string };
  if (typeof g.atob === 'function') {
    return decodeURIComponent(escape(g.atob(input.replace(/\s+/g, ''))));
  }
  return input;
}

export async function getExistingFile(
  cfg: GitHubRepoConfig,
  path: string,
): Promise<{ sha: string; content: string } | null> {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    path,
  )}?ref=${encodeURIComponent(cfg.branch)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as { sha?: string; content?: string };
    if (!json.sha) {
      return null;
    }
    const content = json.content ? decodeBase64(json.content) : '';
    return { sha: json.sha, content };
  } catch {
    return null;
  }
}

export async function publishFile(
  cfg: GitHubRepoConfig,
  file: GitHubPublishFile,
): Promise<GitHubPublishResult> {
  const configError = assertConfig(cfg);
  if (configError) {
    return { ok: false, error: configError, status: 0 };
  }

  const existing = await getExistingFile(cfg, file.path);
  const contentBase64 = file.isBinary ? file.content : encodeBase64(file.content);

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    file.path,
  )}`;

  const body: Record<string, unknown> = {
    message: file.message,
    content: contentBase64,
    branch: cfg.branch,
  };
  if (existing) {
    body.sha = existing.sha;
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error:
          'GitHub rejected the token. It may be expired or missing "repo" scope.',
        status: res.status,
      };
    }
    if (res.status === 409) {
      return {
        ok: false,
        error: 'GitHub conflict — the file changed between reads. Try again.',
        status: res.status,
      };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        error: `GitHub returned ${res.status}. ${text.slice(0, 200)}`,
        status: res.status,
      };
    }
    const json = (await res.json()) as {
      content?: { html_url?: string };
      commit?: { html_url?: string };
    };
    const html = json.content?.html_url ?? json.commit?.html_url ?? '';
    return { ok: true, url: html };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { ok: false, error: msg, status: 0 };
  }
}

export type PublishPackInput = {
  config: GitHubRepoConfig;
  manifest: SongPackManifest;
  audioBase64: string | null;
  audioExt: string;
  coverBase64: string | null;
  coverExt: string;
  audioSizeBytes: number;
};

export type PublishPackOutcome = {
  ok: boolean;
  message: string;
  manifestUrl?: string;
  indexUrl?: string;
};

function rawUrl(cfg: GitHubRepoConfig, path: string): string {
  return `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${path}`;
}

async function updateIndex(
  cfg: GitHubRepoConfig,
  manifest: SongPackManifest,
  sizeBytes: number,
  audioExt: string,
): Promise<{ ok: boolean; error?: string }> {
  const existing = await getExistingFile(cfg, cfg.indexPath);

  let index: RemotePackIndex;
  if (existing && existing.content) {
    try {
      index = JSON.parse(existing.content) as RemotePackIndex;
      if (!index || !Array.isArray(index.packs)) {
        index = { version: 1, packs: [] };
      }
    } catch {
      index = { version: 1, packs: [] };
    }
  } else {
    index = { version: 1, packs: [] };
  }

  const audioUrl = rawUrl(
    cfg,
    `${cfg.packsPath}/${manifest.id}/audio.${audioExt}`,
  );

  const entry: RemotePackEntry = {
    id: manifest.id,
    title: manifest.title,
    artist: manifest.artist,
    bpm: manifest.bpm,
    difficulty: manifest.difficulty,
    sizeBytes,
    manifestUrl: rawUrl(cfg, `${cfg.packsPath}/${manifest.id}/manifest.json`),
    audioUrl,
    coverUrl: undefined,
    version: manifest.version,
  };

  const without = index.packs.filter((p) => p.id !== manifest.id);
  const updated: RemotePackIndex = {
    version: index.version + 1,
    packs: [entry, ...without],
  };

  const result = await publishFile(cfg, {
    path: cfg.indexPath,
    content: JSON.stringify(updated, null, 2),
    message: `Update pack index: ${manifest.title}`,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}

export async function publishPack(
  input: PublishPackInput,
): Promise<PublishPackOutcome> {
  const {
    config,
    manifest,
    audioBase64,
    audioExt,
    coverBase64,
    coverExt,
    audioSizeBytes,
  } = input;
  const basePath = `${config.packsPath}/${manifest.id}`;

  const manifestResult = await publishFile(config, {
    path: `${basePath}/manifest.json`,
    content: JSON.stringify(manifest, null, 2),
    message: `Add pack: ${manifest.title} (manifest)`,
  });
  if (!manifestResult.ok) {
    return {
      ok: false,
      message: `Manifest upload failed: ${manifestResult.error}`,
    };
  }

  if (audioBase64) {
    const audioResult = await publishFile(config, {
      path: `${basePath}/audio.${audioExt}`,
      content: audioBase64,
      isBinary: true,
      message: `Add pack: ${manifest.title} (audio)`,
    });
    if (!audioResult.ok) {
      return {
        ok: false,
        message: `Manifest uploaded but audio failed: ${audioResult.error}`,
      };
    }
  }

  if (coverBase64) {
    await publishFile(config, {
      path: `${basePath}/cover.${coverExt}`,
      content: coverBase64,
      isBinary: true,
      message: `Add pack: ${manifest.title} (cover)`,
    });
  }

  const indexResult = await updateIndex(
    config,
    manifest,
    audioSizeBytes,
    audioExt,
  );
  if (!indexResult.ok) {
    return {
      ok: false,
      message: `Pack uploaded, but the index update failed: ${
        indexResult.error ?? 'unknown'
      }`,
      manifestUrl: manifestResult.url,
    };
  }

  return {
    ok: true,
    message: 'Pack published and index updated.',
    manifestUrl: manifestResult.url,
    indexUrl: rawUrl(config, config.indexPath),
  };
}
