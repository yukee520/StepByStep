import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export type ResolvedTheme = 'light' | 'dark';

export type ThemePalette = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  muted: string;
  danger: string;
  success: string;
  border: string;
  perfect: string;
  great: string;
  good: string;
  miss: string;
};

const LIGHT: ThemePalette = {
  primary: '#2563EB',
  secondary: '#64748B',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#94A3B8',
  danger: '#EF4444',
  success: '#10B981',
  border: '#E2E8F0',
  perfect: '#F59E0B',
  great: '#10B981',
  good: '#3B82F6',
  miss: '#EF4444',
};

const DARK: ThemePalette = {
  primary: '#3B82F6',
  secondary: '#94A3B8',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  muted: '#64748B',
  danger: '#F87171',
  success: '#34D399',
  border: '#334155',
  perfect: '#FBBF24',
  great: '#34D399',
  good: '#60A5FA',
  miss: '#F87171',
};

export type UseThemeResult = {
  theme: ResolvedTheme;
  isDark: boolean;
  colors: ThemePalette;
};

export function useTheme(): UseThemeResult {
  const systemScheme = useColorScheme();
  const mode = useSettingsStore((s) => s.settings.themeMode);

  const resolved: ResolvedTheme =
    mode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode === 'dark'
        ? 'dark'
        : 'light';

  return {
    theme: resolved,
    isDark: resolved === 'dark',
    colors: resolved === 'dark' ? DARK : LIGHT,
  };
}