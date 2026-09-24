export type ThemePalette = {
  primary: string;
  primaryDark: string;
  primaryGlow: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;

  border: string;
  borderBright: string;

  text: string;
  textDim: string;
  muted: string;
  subtle: string;

  danger: string;
  warning: string;
  success: string;

  perfect: string;
  great: string;
  good: string;
  miss: string;

  neon: {
    cyan: string;
    pink: string;
    green: string;
    yellow: string;
    purple: string;
    magenta: string;
  };

  /** Direction-to-color mapping used by lanes, arrows, and notes. */
  lane: {
    left: string;
    right: string;
    up: string;
    down: string;
  };
};

export const NEON_PALETTE: ThemePalette = {
  primary: '#00E5FF',
  primaryDark: '#00B8CC',
  primaryGlow: '#7DF9FF',

  background: '#0A0118',
  surface: '#150829',
  surfaceElevated: '#1F0F3A',
  card: '#1A0B2E',

  border: '#2D1B4E',
  borderBright: '#4A2C7A',

  text: '#F5F0FF',
  textDim: '#B8A9D4',
  muted: '#7B6BA0',
  subtle: '#4A3D68',

  danger: '#FF3B5C',
  warning: '#FFB020',
  success: '#22DD88',

  perfect: '#FFD500',
  great: '#22DD88',
  good: '#00E5FF',
  miss: '#FF3B5C',

  neon: {
    cyan: '#00E5FF',
    pink: '#FF3366',
    green: '#00FF88',
    yellow: '#FFD500',
    purple: '#A855F7',
    magenta: '#FF10F0',
  },

  lane: {
    left: '#FF3366',
    right: '#00E5FF',
    up: '#00FF88',
    down: '#FFD500',
  },
};

export const COLORS = NEON_PALETTE;