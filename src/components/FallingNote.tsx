// src/components/FallingNote.tsx
import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import type { Direction } from '@/types/song';
import { NEON_PALETTE } from '@/theme/colors';
import type { LaneGeometry } from '@/types/game';

const SLOT_COUNT = 12;

export { SLOT_COUNT };

const ICON_NAMES: Record<Direction, string> = {
  left: 'chevron-back',
  right: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
};

const LANE_COLORS: Record<Direction, string> = {
  left: NEON_PALETTE.lane.left,
  down: NEON_PALETTE.lane.down,
  up: NEON_PALETTE.lane.up,
  right: NEON_PALETTE.lane.right,
};

const INDEX_TO_DIRECTION: Direction[] = ['left', 'down', 'up', 'right'];

const AnimatedView = Animated.createAnimatedComponent(View);

export type FallingNoteProps = {
  slotIndex: number;
  laneActive: SharedValue<number[]>;
  laneTimeMs: SharedValue<number[]>;
  laneDirection: SharedValue<number[]>;
  laneDuration: SharedValue<number[]>;
  /** Per-slot flag: 1 if this slot's hold is currently being held. */
  laneHeldSlot: SharedValue<number[]>;
  audioPosition: SharedValue<number>;
  fallDurationMs: number;
  geometry: LaneGeometry;
  noteSize: number;
  x: number;
};

export default function FallingNote({
  slotIndex,
  laneActive,
  laneTimeMs,
  laneDirection,
  laneDuration,
  laneHeldSlot,
  audioPosition,
  fallDurationMs,
  geometry,
  noteSize,
  x,
}: FallingNoteProps): React.ReactElement {
  const borderWidth = Math.max(2, noteSize * 0.06);

  // Hold bar: positioned ABOVE the head (bar sits between head and tail).
  // Length is the visual travel distance covered by the hold's duration.
  const bodyStyle = useAnimatedStyle(() => {
    const active = laneActive.value[slotIndex] ?? 0;
    if (active === 0) {
      return { opacity: 0, height: 0 };
    }
    const dur = laneDuration.value[slotIndex] ?? 0;
    if (dur <= 0) {
      return { opacity: 0, height: 0 };
    }
    const lengthPx = (dur / fallDurationMs) * geometry.laneHeight;
    const held = laneHeldSlot.value[slotIndex] ?? 0;
    return {
      opacity: 1,
      height: lengthPx,
      // Fill opacity: 0.08 outline-idle, 0.55 while held.
      backgroundColor:
        held > 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.08)',
    };
  });

  const headStyle = useAnimatedStyle(() => {
    const active = laneActive.value[slotIndex] ?? 0;
    if (active === 0) {
      return {
        opacity: 0,
        transform: [{ translateY: -1000 }, { scale: 1 }],
      };
    }
    const now = audioPosition.value;
    const noteTimeMs = laneTimeMs.value[slotIndex] ?? 0;
    const delta = noteTimeMs - now;
    const ratio = 1 - delta / fallDurationMs;

    const centerY = geometry.buttonCenterY - (1 - ratio) * geometry.laneHeight;
    const y = centerY - noteSize / 2;

    const fade = interpolate(
      ratio,
      [-0.2, 0, 0.05, 1.05, 1.2],
      [0, 1, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      ratio,
      [0.7, 1],
      [1, 1.15],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY: y }, { scale }],
      opacity: fade,
    };
  });

  const colorStyle = useAnimatedStyle(() => {
    const idx = laneDirection.value[slotIndex] ?? 0;
    const dir = INDEX_TO_DIRECTION[idx] ?? 'left';
    return { borderColor: LANE_COLORS[dir] };
  });

  const bodyOutlineStyle = useAnimatedStyle(() => {
    const idx = laneDirection.value[slotIndex] ?? 0;
    const dir = INDEX_TO_DIRECTION[idx] ?? 'left';
    return { borderColor: LANE_COLORS[dir] };
  });

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x,
          top: 0,
          width: noteSize,
          height: noteSize,
          borderRadius: noteSize / 5,
          borderWidth,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        colorStyle,
        headStyle,
      ]}
    >
      {/* Hold bar extends UPWARD from the head (tail is higher than head). */}
      <AnimatedView
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: noteSize - borderWidth,
            left: borderWidth,
            right: borderWidth,
            borderRadius: noteSize / 6,
            borderWidth: 1,
          },
          bodyOutlineStyle,
          bodyStyle,
        ]}
      />

      <DirectionalIcon
        slotIndex={slotIndex}
        laneDirection={laneDirection}
        size={noteSize * 0.6}
      />
    </AnimatedView>
  );
}

function DirectionalIcon({
  slotIndex,
  laneDirection,
  size,
}: {
  slotIndex: number;
  laneDirection: SharedValue<number[]>;
  size: number;
}): React.ReactElement {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <DirectionalIconLayer
          key={i}
          index={i}
          slotIndex={slotIndex}
          laneDirection={laneDirection}
          size={size}
        />
      ))}
    </>
  );
}

function DirectionalIconLayer({
  index,
  slotIndex,
  laneDirection,
  size,
}: {
  index: number;
  slotIndex: number;
  laneDirection: SharedValue<number[]>;
  size: number;
}): React.ReactElement {
  const dir = INDEX_TO_DIRECTION[index];
  const color = LANE_COLORS[dir];
  const iconName = ICON_NAMES[dir];

  const style = useAnimatedStyle(() => {
    const idx = laneDirection.value[slotIndex] ?? 0;
    return { opacity: idx === index ? 1 : 0 };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}