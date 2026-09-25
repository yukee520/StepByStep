import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { perfMonitor } from '@/services/perfMonitor';
import { NEON_PALETTE } from '@/theme/colors';

export type PerfOverlayProps = {
  visible: boolean;
};

type Snapshot = {
  fps: number;
  frameAvg: number;
  frameMax: number;
  notes: number;
  nowMs: number;
  setVisibleMs: number;
  hitMs: number;
};

const EMPTY: Snapshot = {
  fps: 0,
  frameAvg: 0,
  frameMax: 0,
  notes: 0,
  nowMs: 0,
  setVisibleMs: 0,
  hitMs: 0,
};

function PerfOverlayBase({
  visible,
}: PerfOverlayProps): React.ReactElement | null {
  const [snap, setSnap] = useState<Snapshot>(EMPTY);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const id = setInterval(() => {
      const avg = perfMonitor.averages();
      const frameAvg = avg['frame_ms'] ?? 0;
      const fps = frameAvg > 0 ? Math.round(1000 / frameAvg) : 0;
      setSnap({
        fps,
        frameAvg,
        frameMax: perfMonitor.max('frame_ms'),
        notes: avg['visible_notes'] ?? 0,
        nowMs: avg['get_now_ms'] ?? 0,
        setVisibleMs: avg['set_visible_ms'] ?? 0,
        hitMs: avg['hit_ms'] ?? 0,
      });
    }, 500);
    return () => {
      clearInterval(id);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const warn = snap.frameAvg > 24 ? NEON_PALETTE.danger : NEON_PALETTE.success;

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
        FPS ~{snap.fps}  frame avg {snap.frameAvg.toFixed(1)}ms  max{' '}
        {snap.frameMax.toFixed(1)}ms
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: NEON_PALETTE.text,
          fontFamily: 'monospace',
        }}
      >
        notes {snap.notes.toFixed(0)}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: NEON_PALETTE.text,
          fontFamily: 'monospace',
        }}
      >
        now {snap.nowMs.toFixed(2)}ms  setVis {snap.setVisibleMs.toFixed(2)}ms
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: NEON_PALETTE.text,
          fontFamily: 'monospace',
        }}
      >
        hit {snap.hitMs.toFixed(2)}ms
      </Text>
    </View>
  );
}

const PerfOverlay = React.memo(PerfOverlayBase);
export default PerfOverlay;