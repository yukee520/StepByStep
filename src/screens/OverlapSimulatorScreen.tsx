// src/screens/OverlapSimulatorScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {
  OVERLAP_WINDOWS,
  computeOverlap,
  noteTopForRatio,
  overlapToJudgment,
  type Judgment,
  type LaneGeometry,
} from '@/types/game';
import { NEON_PALETTE } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Layout — a self-contained mock of a lane.
// ---------------------------------------------------------------------------

const LANE_WIDTH = 120;
const LANE_HEIGHT = 520;
const BUTTON_HEIGHT = 84;
const NOTE_HEIGHT = 72;

// Button sits at the bottom of the lane area.
const BUTTON_TOP = LANE_HEIGHT - BUTTON_HEIGHT;
const BUTTON_CENTER_Y = BUTTON_TOP + BUTTON_HEIGHT / 2;

const GEOMETRY: LaneGeometry = {
  laneHeight: LANE_HEIGHT,
  buttonHeight: BUTTON_HEIGHT,
  buttonTop: BUTTON_TOP,
  buttonCenterY: BUTTON_CENTER_Y,
  noteHeight: NOTE_HEIGHT,
};

// ratio = 0  → note spawns one lane-height above the button center
// ratio = 1  → note center is exactly on button center (bullseye)
// ratio > 1  → note has fallen past the button
const RATIO_MIN = 0;
const RATIO_MAX = 1.3;
const RATIO_STEP = 0.01;

const JUDGMENT_COLORS: Record<Judgment, string> = {
  perfect: '#7DF9FF',
  great: '#4ADE80',
  good: '#FBBF24',
  miss: '#EF4444',
};

type Preset = {
  label: string;
  overlap: number;
  judgment: Judgment;
};

// Preset overlaps — one exactly on each threshold, plus a clear miss.
// Use a tiny +epsilon so the preset lands inside the window, not under it.
const EPS = 1e-6;
const PRESETS: Preset[] = [
  { label: 'Perfect (≥80%)', overlap: OVERLAP_WINDOWS.perfect + EPS, judgment: 'perfect' },
  { label: 'Great (≥50%)',   overlap: OVERLAP_WINDOWS.great + EPS,   judgment: 'great'   },
  { label: 'Good (≥20%)',    overlap: OVERLAP_WINDOWS.good + EPS,    judgment: 'good'    },
  { label: 'Miss (<20%)',    overlap: Math.max(0, OVERLAP_WINDOWS.good - 0.05), judgment: 'miss' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Inverse of computeOverlap: given a target overlap (0..1), find the ratio
 * that produces it. Exact when the note is fully inside the button's vertical
 * span (the common case for Perfect/Great/Good), and correct for partial
 * overlap too.
 *
 * Derivation: overlap = intersect / noteHeight, and intersect is the overlap
 * of [noteTop, noteTop+noteHeight] with [buttonTop, buttonTop+buttonHeight].
 * For our geometry (buttonHeight >= noteHeight), the note is fully inside the
 * button when its center is within (buttonTop + noteHeight/2) and
 * (buttonTop + buttonHeight - noteHeight/2). We solve overlap = t on the
 * "entering from above" branch, which is what a player actually sees.
 */
function ratioForOverlap(targetOverlap: number, geom: LaneGeometry): number {
  // intersect = targetOverlap * noteHeight
  const intersect = targetOverlap * geom.noteHeight;
  // On the entry branch, the note's bottom is `intersect` past buttonTop.
  const noteBottom = geom.buttonTop + intersect;
  const noteTop = noteBottom - geom.noteHeight;
  const noteCenter = noteTop + geom.noteHeight / 2;
  // ratio such that noteCenter = buttonCenterY - (1 - ratio) * laneHeight
  const ratio = 1 - (geom.buttonCenterY - noteCenter) / geom.laneHeight;
  return ratio;
}

function round2(v: number): string {
  return v.toFixed(2);
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OverlapSimulatorScreen(): React.ReactElement {
  const [ratio, setRatio] = useState<number>(1.0);
  const [sweeping, setSweeping] = useState<boolean>(false);
  const sweepRafRef = useRef<number | null>(null);

  // Derived state — recomputed on every ratio change.
  const derived = useMemo(() => {
    const noteTopY = noteTopForRatio(ratio, GEOMETRY);
    const noteBottomY = noteTopY + GEOMETRY.noteHeight;
    const buttonBottomY = GEOMETRY.buttonTop + GEOMETRY.buttonHeight;
    const overlap = computeOverlap(noteTopY, GEOMETRY.noteHeight, GEOMETRY);
    const judgment = overlapToJudgment(overlap);
    return {
      noteTopY,
      noteBottomY,
      buttonBottomY,
      overlap,
      judgment,
    };
  }, [ratio]);

  const stopSweep = useCallback((): void => {
    if (sweepRafRef.current !== null) {
      cancelAnimationFrame(sweepRafRef.current);
      sweepRafRef.current = null;
    }
    setSweeping(false);
  }, []);

  const startSweep = useCallback((): void => {
    stopSweep();
    setSweeping(true);
    const start = Date.now();
    const durationMs = 3000;
    const tick = (): void => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / durationMs);
      setRatio(RATIO_MIN + (RATIO_MAX - RATIO_MIN) * t);
      if (t < 1) {
        sweepRafRef.current = requestAnimationFrame(tick);
      } else {
        sweepRafRef.current = null;
        setSweeping(false);
      }
    };
    sweepRafRef.current = requestAnimationFrame(tick);
  }, [stopSweep]);

  useEffect(() => {
    return () => {
      stopSweep();
    };
  }, [stopSweep]);

  const applyPreset = useCallback((preset: Preset): void => {
    const r = ratioForOverlap(preset.overlap, GEOMETRY);
    setRatio(Math.max(RATIO_MIN, Math.min(RATIO_MAX, r)));
  }, []);

  const judgmentColor = JUDGMENT_COLORS[derived.judgment];

  // Vertical positions inside the preview lane. Everything is in lane coords.
  const previewWidth = LANE_WIDTH;
  const previewHeight = LANE_HEIGHT;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Overlap Simulator</Text>
        <Text style={styles.subtitle}>
          Reads the same thresholds the engine uses: perfect ≥{' '}
          {(OVERLAP_WINDOWS.perfect * 100).toFixed(0)}%, great ≥{' '}
          {(OVERLAP_WINDOWS.great * 100).toFixed(0)}%, good ≥{' '}
          {(OVERLAP_WINDOWS.good * 100).toFixed(0)}%.
        </Text>

        {/* ------------------------------ Preview ------------------------------ */}
        <View style={styles.previewRow}>
          <View
            style={[
              styles.laneFrame,
              { width: previewWidth, height: previewHeight },
            ]}
          >
            {/* Button rectangle */}
            <View
              style={[
                styles.buttonRect,
                {
                  top: BUTTON_TOP,
                  height: BUTTON_HEIGHT,
                  borderColor: judgmentColor,
                  backgroundColor: withAlpha(judgmentColor, 0.12),
                },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: judgmentColor }]}>
                BUTTON
              </Text>
            </View>

            {/* Note rectangle */}
            <View
              style={[
                styles.noteRect,
                {
                  top: derived.noteTopY,
                  height: NOTE_HEIGHT,
                  borderColor: judgmentColor,
                },
              ]}
            />

            {/* Overlap highlight — the intersection slice, drawn last */}
            <OverlapSlice
              noteTop={derived.noteTopY}
              noteHeight={NOTE_HEIGHT}
              geometry={GEOMETRY}
              color={judgmentColor}
            />

            {/* Button center line (bullseye) */}
            <View
              style={[
                styles.centerLine,
                { top: BUTTON_CENTER_Y, backgroundColor: '#FFFFFF33' },
              ]}
            />

            {/* Note center line */}
            <View
              style={[
                styles.centerLine,
                {
                  top: derived.noteTopY + NOTE_HEIGHT / 2,
                  backgroundColor: judgmentColor,
                },
              ]}
            />
          </View>

          <View style={styles.readouts}>
            <Readout label="ratio"        value={round2(ratio)} />
            <Readout
              label="note top"
              value={`${derived.noteTopY.toFixed(1)} px`}
            />
            <Readout
              label="note bottom"
              value={`${derived.noteBottomY.toFixed(1)} px`}
            />
            <Readout label="button top"   value={`${BUTTON_TOP} px`} />
            <Readout
              label="button bottom"
              value={`${derived.buttonBottomY.toFixed(1)} px`}
            />
            <View style={styles.divider} />
            <Readout
              label="OVERLAP"
              value={`${(derived.overlap * 100).toFixed(1)}%`}
              emphasize={judgmentColor}
            />
            <Readout
              label="JUDGMENT"
              value={derived.judgment.toUpperCase()}
              emphasize={judgmentColor}
            />
          </View>
        </View>

        {/* ------------------------------ Slider ------------------------------ */}
        <Text style={styles.sectionLabel}>ratio</Text>
        <Slider
          minimumValue={RATIO_MIN}
          maximumValue={RATIO_MAX}
          step={RATIO_STEP}
          value={ratio}
          onValueChange={setRatio}
          minimumTrackTintColor={NEON_PALETTE.primary}
          maximumTrackTintColor={NEON_PALETTE.border}
          thumbTintColor={NEON_PALETTE.primary}
        />

        <View style={styles.sweepRow}>
          <Pressable
            onPress={sweeping ? stopSweep : startSweep}
            style={[styles.pill, sweeping ? styles.pillActive : null]}
          >
            <Text style={styles.pillText}>
              {sweeping ? 'STOP SWEEP' : 'SWEEP 0 → 1.30'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRatio(1.0)}
            style={[styles.pill, styles.pillGhost]}
          >
            <Text style={styles.pillGhostText}>BULLSEYE (1.00)</Text>
          </Pressable>
        </View>

        {/* ------------------------------ Presets ------------------------------ */}
        <Text style={styles.sectionLabel}>threshold presets</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => {
            const r = ratioForOverlap(p.overlap, GEOMETRY);
            return (
              <Pressable
                key={p.label}
                onPress={() => applyPreset(p)}
                style={[
                  styles.presetCard,
                  { borderColor: JUDGMENT_COLORS[p.judgment] },
                ]}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    { color: JUDGMENT_COLORS[p.judgment] },
                  ]}
                >
                  {p.label}
                </Text>
                <Text style={styles.presetMeta}>
                  overlap {Math.round(p.overlap * 100)}% · ratio {round2(r)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ------------------------------ Table ------------------------------ */}
        <Text style={styles.sectionLabel}>tier map</Text>
        <TierTable geometry={GEOMETRY} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Readout({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: string;
}): React.ReactElement {
  return (
    <View style={styles.readoutRow}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text
        style={[
          styles.readoutValue,
          emphasize ? { color: emphasize } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function OverlapSlice({
  noteTop,
  noteHeight,
  geometry,
  color,
}: {
  noteTop: number;
  noteHeight: number;
  geometry: LaneGeometry;
  color: string;
}): React.ReactElement | null {
  const noteBottom = noteTop + noteHeight;
  const buttonBottom = geometry.buttonTop + geometry.buttonHeight;
  const interTop = Math.max(noteTop, geometry.buttonTop);
  const interBottom = Math.min(noteBottom, buttonBottom);
  const inter = Math.max(0, interBottom - interTop);
  if (inter <= 0) {
    return null;
  }
  return (
    <View
      style={{
        position: 'absolute',
        left: 6,
        right: 6,
        top: interTop,
        height: inter,
        backgroundColor: withAlpha(color, 0.45),
        borderColor: color,
        borderWidth: 1,
      }}
    />
  );
}

function TierTable({ geometry }: { geometry: LaneGeometry }): React.ReactElement {
  const tiers: { name: string; minOverlap: number; maxOverlap: number }[] = [
    { name: 'Perfect', minOverlap: OVERLAP_WINDOWS.perfect, maxOverlap: 1.0 },
    { name: 'Great',   minOverlap: OVERLAP_WINDOWS.great,   maxOverlap: OVERLAP_WINDOWS.perfect },
    { name: 'Good',    minOverlap: OVERLAP_WINDOWS.good,    maxOverlap: OVERLAP_WINDOWS.great },
    { name: 'Miss',    minOverlap: 0,                        maxOverlap: OVERLAP_WINDOWS.good },
  ];

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHead]}>
        <Text style={[styles.tableCell, styles.tableHeadText, styles.cellWide]}>
          tier
        </Text>
        <Text style={[styles.tableCell, styles.tableHeadText]}>overlap</Text>
        <Text style={[styles.tableCell, styles.tableHeadText]}>ratio from</Text>
        <Text style={[styles.tableCell, styles.tableHeadText]}>ratio to</Text>
      </View>
      {tiers.map((t) => {
        const rMin = ratioForOverlap(t.minOverlap, geometry);
        const rMax = ratioForOverlap(t.maxOverlap, geometry);
        return (
          <View key={t.name} style={styles.tableRow}>
            <Text
              style={[
                styles.tableCell,
                styles.cellWide,
                { color: JUDGMENT_COLORS[t.name.toLowerCase() as Judgment] },
              ]}
            >
              {t.name}
            </Text>
            <Text style={styles.tableCell}>
              {(t.minOverlap * 100).toFixed(0)}–{(t.maxOverlap * 100).toFixed(0)}%
            </Text>
            <Text style={styles.tableCell}>{round2(rMin)}</Text>
            <Text style={styles.tableCell}>{round2(rMax)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function withAlpha(hex: string, alpha: number): string {
  // Supports #RRGGBB.
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NEON_PALETTE.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  title: {
    color: NEON_PALETTE.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: NEON_PALETTE.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  laneFrame: {
    position: 'relative',
    borderWidth: 1,
    borderColor: NEON_PALETTE.border,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  buttonRect: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  noteRect: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  readouts: {
    flex: 1,
    gap: 6,
  },
  readoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readoutLabel: {
    color: NEON_PALETTE.textDim,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  readoutValue: {
    color: NEON_PALETTE.text,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: NEON_PALETTE.border,
    marginVertical: 6,
  },
  sectionLabel: {
    color: NEON_PALETTE.textDim,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  sweepRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: NEON_PALETTE.primary,
    backgroundColor: 'rgba(125,249,255,0.08)',
  },
  pillActive: {
    backgroundColor: 'rgba(125,249,255,0.22)',
  },
  pillText: {
    color: NEON_PALETTE.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pillGhost: {
    borderColor: NEON_PALETTE.border,
    backgroundColor: 'transparent',
  },
  pillGhostText: {
    color: NEON_PALETTE.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  presets: {
    gap: 8,
  },
  presetCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetMeta: {
    color: NEON_PALETTE.textDim,
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  table: {
    borderWidth: 1,
    borderColor: NEON_PALETTE.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: NEON_PALETTE.border,
  },
  tableHead: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 0,
  },
  tableCell: {
    flex: 1,
    color: NEON_PALETTE.text,
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontVariant: ['tabular-nums'],
  },
  tableHeadText: {
    color: NEON_PALETTE.textDim,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  cellWide: {
    flex: 1.2,
  },
});