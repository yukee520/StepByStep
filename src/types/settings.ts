export type ThemeMode = 'system' | 'light' | 'dark';

export type Settings = {
  themeMode: ThemeMode;
  noteSpeed: number;
  inputOffsetMs: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  packIndexUrl: string;
  showFpsCounter: boolean;

  /** GitHub Personal Access Token for publishing packs. */
  githubToken: string;
  /** GitHub repo owner (username or org). */
  githubOwner: string;
  /** GitHub repo name. */
  githubRepo: string;
  /** Branch to commit to. Defaults to main. */
  githubBranch: string;
  /** Path prefix inside the repo where packs are stored. */
  githubPacksPath: string;
};

export const DEFAULT_PACK_INDEX_URL =
  'https://raw.githubusercontent.com/yukee520/StepByStep/main/packs/index.json';

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  noteSpeed: 1,
  inputOffsetMs: 0,
  soundEnabled: true,
  hapticsEnabled: true,
  packIndexUrl: DEFAULT_PACK_INDEX_URL,
  showFpsCounter: false,
  githubToken: '',
  githubOwner: 'yukee520',
  githubRepo: 'StepByStep',
  githubBranch: 'main',
  githubPacksPath: 'packs',
};

export const NOTE_SPEED_MIN = 0.5;
export const NOTE_SPEED_MAX = 2.5;
export const NOTE_SPEED_STEP = 0.05;

export const INPUT_OFFSET_MIN = -200;
export const INPUT_OFFSET_MAX = 200;
export const INPUT_OFFSET_STEP = 5;