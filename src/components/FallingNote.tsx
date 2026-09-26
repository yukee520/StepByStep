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

// Direction index for shared arrays: 0=left, 1=down, 2=up, 3=right
const INDEX_TO_DIRECTION: Direction[] = ['left', 'down', 'up', 'right'];

const AnimatedView = Animated.createAnimatedComponent(View);

export type FallingNoteProps = {
  slotIndex: number;
  laneActive: SharedValue<number[]>;
  laneTimeMs: SharedValue<number[]>;
  laneDirection: SharedValue<number[]>;
  audioPosition: SharedValue<number>;
  fallDurationMs: number;
  geometry: LaneGeometry;
  noteSize: number;
  /** Absolute x within the lane container. */
  x: number;
};

export default function FallingNote({
  slotIndex,
  laneActive,
  laneTimeMs,
  laneDirection,
  audioPosition,
  fallDurationMs,
  geometry,
  noteSize,
  x,
}: FallingNoteProps): React.ReactElement {
  const borderWidth = Math.max(2, noteSize * 0.06);

  const animatedStyle = useAnimatedStyle(() => {
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

    // Center the note on the button at ratio=1; travel distance = laneHeight.
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
        },
        colorStyle,
        animatedStyle,
      ]}
    >
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