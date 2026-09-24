import type { SongPackManifest } from '@/types/songPack';

export type GitHubRepoConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  packsPath: string;
};

export type GitHubPublishFile = {
  /** Path inside the repo, e.g. "packs/my-song/manifest.json" */
  path: string;
  /** Plain-text content. If isBinary=true, must be base64. */
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
  return null;
}

function encodeBase64(input: string): string {
  // Use a small polyfill because Hermes has no global btoa for UTF-8.
  // Falls back gracefully if the util exists.
  const g = globalThis as unknown as { btoa?: (s: string) => string };
  if (typeof g.btoa === 'function') {
    return g.btoa(unescape(encodeURIComponent(input)));
  }
  // Not available → assume caller passed base64 already.
  return input;
}

export async function getExistingFileSha(
  cfg: GitHubRepoConfig,
  path: string,
): Promise<string | null> {
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
    const json = (await res.json()) as { sha?: string };
    return json.sha ?? null;
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

  const existingSha = await getExistingFileSha(cfg, file.path);
  const contentBase64 = file.isBinary
    ? file.content
    : encodeBase64(file.content);

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    file.path,
  )}`;

  const body: Record<string, unknown> = {
    message: file.message,
    content: contentBase64,
    branch: cfg.branch,
  };
  if (existingSha) {
    body.sha = existingSha;
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
    const url_ = json.content?.html_url ?? json.commit?.html_url ?? '';
    return { ok: true, url: url_ };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { ok: false, error: msg, status: 0 };
  }
}

export type PublishPackInput = {
  config: GitHubRepoConfig;
  manifest: SongPackManifest;
  /** Base64-encoded audio file, or null if no audio. */
  audioBase64: string | null;
  audioExt: string;
  /** Base64-encoded cover image, or null. */
  coverBase64: string | null;
  coverExt: string;
};

export type PublishPackOutcome = {
  ok: boolean;
  message: string;
  manifestUrl?: string;
};

export async function publishPack(
  input: PublishPackInput,
): Promise<PublishPackOutcome> {
  const { config, manifest, audioBase64, audioExt, coverBase64, coverExt } = input;
  const basePath = `${config.packsPath}/${manifest.id}`;

  // 1. Manifest
  const manifestResult = await publishFile(config, {
    path: `${basePath}/manifest.json`,
    content: JSON.stringify(manifest, null, 2),
    message: `Add pack: ${manifest.title} (manifest)`,
  });
  if (!manifestResult.ok) {
    return { ok: false, message: manifestResult.error };
  }

  // 2. Audio (optional)
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

  // 3. Cover (optional)
  if (coverBase64) {
    const coverResult = await publishFile(config, {
      path: `${basePath}/cover.${coverExt}`,
      content: coverBase64,
      isBinary: true,
      message: `Add pack: ${manifest.title} (cover)`,
    });
    if (!coverResult.ok) {
      // Non-fatal — cover is optional
      return {
        ok: true,
        message: 'Pack uploaded (cover skipped).',
        manifestUrl: manifestResult.url,
      };
    }
  }

  return {
    ok: true,
    message: 'Pack published to GitHub.',
    manifestUrl: manifestResult.url,
  };
}