import { useCallback } from 'react';
import { Vibration } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export type HapticStrength = 'light' | 'medium' | 'heavy';

const DURATIONS: Record<HapticStrength, number> = {
  light: 12,
  medium: 24,
  heavy: 45,
};

export type UseHapticsResult = {
  enabled: boolean;
  vibrate: (strength?: HapticStrength) => void;
};

export function useHaptics(): UseHapticsResult {
  const enabled = useSettingsStore((s) => s.settings.hapticsEnabled);

  const vibrate = useCallback(
    (strength: HapticStrength = 'light') => {
      if (!enabled) {
        return;
      }
      try {
        Vibration.vibrate(DURATIONS[strength]);
      } catch {
        // Vibration is best-effort; ignore failures silently.
      }
    },
    [enabled],
  );

  return { enabled, vibrate };
}