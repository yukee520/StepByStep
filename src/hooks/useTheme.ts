import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { NEON_PALETTE, type ThemePalette } from '@/theme/colors';

export type ResolvedTheme = 'light' | 'dark';

export type UseThemeResult = {
  theme: ResolvedTheme;
  isDark: boolean;
  colors: ThemePalette;
};

export type { ThemePalette };

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
    colors: NEON_PALETTE,
  };
}
