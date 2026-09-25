import { useCallback, useRef } from 'react';
import { Vibration } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export type HapticStrength = 'light' | 'medium' | 'heavy';

const DURATIONS: Record<HapticStrength, number> = {
  light: 8,
  medium: 20,
  heavy: 40,
};

/**
 * Minimum time between two vibration calls. Rapid-fire taps (like a dense
 * chart) would otherwise queue up and cause input lag on some Android
 * devices, because Vibration.vibrate() blocks the JS bridge briefly.
 */
const DEBOUNCE_MS = 40;

export type UseHapticsResult = {
  enabled: boolean;
  vibrate: (strength?: HapticStrength) => void;
};

export function useHaptics(): UseHapticsResult {
  const enabled = useSettingsStore((s) => s.settings.hapticsEnabled);
  const lastVibrationRef = useRef<number>(0);

  const vibrate = useCallback(
    (strength: HapticStrength = 'light') => {
      if (!enabled) {
        return;
      }
      const now = Date.now();
      if (now - lastVibrationRef.current < DEBOUNCE_MS) {
        return;
      }
      lastVibrationRef.current = now;
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