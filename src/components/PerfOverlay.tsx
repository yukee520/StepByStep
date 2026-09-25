import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { perfMonitor } from '@/services/perfMonitor';
import { NEON_PALETTE } from '@/theme/colors';

export type PerfOverlayProps = {
  visible: boolean;
};

export default function PerfOverlay({
  visible,
}: PerfOverlayProps): React.ReactElement | null {
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    perfMonitor.setOnUpdate(() => {
      setTick((t) => t + 1);
    });
    return () => {
      perfMonitor.setOnUpdate(null);
    };
  }, []);

  if (!visible) {
    return null;
  }

  void tick;
  const avg = perfMonitor.averages();
  const maxFrame = perfMonitor.max('frame_ms');
  const avgFrame = avg['frame_ms'] ?? 0;
  const fps = avgFrame > 0 ? Math.round(1000 / avgFrame) : 0;
  const visibleCount = avg['visible_notes'] ?? 0;
  const nowMs = avg['get_now_ms'] ?? 0;
  const setVisibleMs = avg['set_visible_ms'] ?? 0;
  const hitMs = avg['hit_ms'] ?? 0;

  const warn = avgFrame > 24 ? NEON_PALETTE.danger : NEON_PALETTE.success;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 60,
        right: 8,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderWidth: 1,
        borderColor: NEON_PALETTE.primary,
        zIndex: 9999,
      }}
    >
      <Text style={{ fontSize: 10, color: warn, fontFamily: 'monospace' }}>
        FPS ~{fps}  frame avg {avgFrame.toFixed(1)}ms  max {maxFrame.toFixed(1)}ms
      </Text>
      <Text style={{ fontSize: 10, color: NEON_PALETTE.text, fontFamily: 'monospace' }}>
        notes {visibleCount.toFixed(0)}
      </Text>
      <Text style={{ fontSize: 10, color: NEON_PALETTE.text, fontFamily: 'monospace' }}>
        now {nowMs.toFixed(2)}ms  setVis {setVisibleMs.toFixed(2)}ms
      </Text>
      <Text style={{ fontSize: 10, color: NEON_PALETTE.text, fontFamily: 'monospace' }}>
        hit {hitMs.toFixed(2)}ms
      </Text>
    </View>
  );
}