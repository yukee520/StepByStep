// src/components/EngineProbe.tsx
import React, { useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { pushLog } from '@/store/devLogBus';

export type EngineProbeProps = {
  enabled: boolean;
  audioPosition: SharedValue<number>;
  lane0Active: SharedValue<number[]>;
  lane0Duration: SharedValue<number[]>;
  lane0HeldSlot: SharedValue<number[]>;
  lane0TimeMs: SharedValue<number[]>;
};

/**
 * Polls the given shared values on the JS thread every 200 ms and dumps them
 * into the dev log store. Purely diagnostic — remove once holds are verified.
 */
export default function EngineProbe({
  enabled,
  audioPosition,
  lane0Active,
  lane0Duration,
  lane0HeldSlot,
  lane0TimeMs,
}: EngineProbeProps): null {
  const lastDumpRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const id = setInterval(() => {
      const now = Date.now();
      // Throttle to ~5 dumps per second.
      if (now - lastDumpRef.current < 200) return;
      lastDumpRef.current = now;

      const pos = audioPosition.value;
      const active = lane0Active.value;
      const dur = lane0Duration.value;
      const held = lane0HeldSlot.value;
      const time = lane0TimeMs.value;

      // Only dump slots that are active or held, to keep the log readable.
      const rows: string[] = [];
      for (let s = 0; s < active.length; s += 1) {
        const isActive = active[s] === 1;
        const isHeld = held[s] === 1;
        if (!isActive && !isHeld) continue;
        rows.push(
          `s${s} act=${active[s]} dur=${dur[s]} held=${held[s]} t=${Math.round(
            time[s] ?? 0,
          )}`,
        );
      }
      pushLog(
        `[PROBE] now=${Math.round(pos)} | ${
          rows.length > 0 ? rows.join(' | ') : '(no active slots)'
        }`,
      );
    }, 100);

    return () => {
      clearInterval(id);
    };
  }, [enabled, audioPosition, lane0Active, lane0Duration, lane0HeldSlot, lane0TimeMs]);

  return null;
}