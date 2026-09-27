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
      if (now - lastDumpRef.current < 200) return;
      lastDumpRef.current = now;

      const pos = audioPosition.value;
      const active = lane0Active.value;
      const dur = lane0Duration.value;
      const held = lane0HeldSlot.value;
      const time = lane0TimeMs.value;

      // Compact single-character-per-slot dump for the whole lane.
      // Each column is a slot. Values shown only where active or held.
      const actStr = active.map((v) => (v ? '1' : '.')).join('');
      const heldStr = held.map((v) => (v ? '1' : '.')).join('');
      const durStr = dur.map((v) => (v > 0 ? 'H' : '.')).join('');

      // Also find the first slot that has a hold note (dur > 0), for detail.
      let dslot = -1;
      for (let s = 0; s < dur.length; s += 1) {
        if (dur[s] > 0) {
          dslot = s;
          break;
        }
      }
      const detail =
        dslot >= 0
          ? ` s${dslot}[act=${active[dslot]} dur=${dur[dslot]} held=${held[dslot]} t=${Math.round(
              time[dslot] ?? 0,
            )}]`
          : ' (no hold)';

      pushLog(
        `P now=${Math.round(pos)} act=${actStr} held=${heldStr} dur=${durStr}${detail}`,
      );
    }, 100);

    return () => {
      clearInterval(id);
    };
  }, [enabled, audioPosition, lane0Active, lane0Duration, lane0HeldSlot, lane0TimeMs]);

  return null;
}