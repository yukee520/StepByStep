import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { NEON_PALETTE } from '@/theme/colors';

export type FallingNoteProps = {
  /** Absolute x within the lane container (centre). */
  x: number;
  /** Lane height in px. */
  laneHeight: number;
  /** Note size in px. */
  noteSize: number;

  /** Fall duration for this song (ms). */
  fallDurationMs: number;

  /** Current song time in ms — shared value updated each frame by the engine. */
  audioPosition: SharedValue<number>;

  /** Slot-specific shared values (see useNoteSlots). */
  active: SharedValue<number>;
  /** 0 = left, 1 = down, 2 = up, 3 = right. */
  directionIndex: SharedValue<number>;
  noteTimeMs: SharedValue<number>;
};

const ICON_NAMES = ['chevron-back', 'chevron-down', 'chevron-up', 'chevron-forward'];
const LANE_COLORS = [
  NEON_PALETTE.lane.left,
  NEON_PALETTE.lane.down,
  NEON_PALETTE.lane.up,
  NEON_PALETTE.lane.right,
];

const AnimatedView = Animated.createAnimatedComponent(View);

export default function FallingNote({
  x,
  laneHeight,
  noteSize,
  fallDurationMs,
  audioPosition,
  active,
  directionIndex,
  noteTimeMs,
}: FallingNoteProps): React.ReactElement {
  const animatedStyle = useAnimatedStyle(() => {
    if (active.value === 0) {
      return { opacity: 0, transform: [{ translateY: -1000 }, { scale: 1 }] };
    }
    const now = audioPosition.value;
    const delta = noteTimeMs.value - now;
    const ratio = 1 - delta / fallDurationMs;
    const y = ratio * laneHeight - noteSize / 2;

    const fade = interpolate(
      ratio,
      [-0.2, 0, 0.05, 1.05, 1.15],
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
    const idx = Math.min(3, Math.max(0, Math.round(directionIndex.value)));
    const color = LANE_COLORS[idx];
    const icon = ICON_NAMES[idx];
    return { color, icon };
  });

  // Border/icon color is set outside the animated style for simplicity.
  // We use an Animated.Text trick to reflect color; but since RN doesn't
  // easily animate the icon name, we render all 4 icons and fade them.
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
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: Math.max(2, noteSize * 0.06),
        },
        animatedStyle,
        // Static border color derived from direction — see below
        useDirectionalBorderStyle(directionIndex),
      ]}
    >
      <DirectionalIcon
        directionIndex={directionIndex}
        size={noteSize * 0.6}
      />
    </AnimatedView>
  );

  // Silence unused warning
  void colorStyle;
}

/**
 * Border color is derived from the direction shared value.
 */
function useDirectionalBorderStyle(
  directionIndex: SharedValue<number>,
): ReturnType<typeof useAnimatedStyle> {
  return useAnimatedStyle(() => {
    const idx = Math.min(3, Math.max(0, Math.round(directionIndex.value)));
    return {
      borderColor: LANE_COLORS[idx],
    };
  });
}

/**
 * Renders one of four icons, hiding the inactive ones. This avoids needing
 * to conditionally mount/unmount a component per direction change.
 */
function DirectionalIcon({
  directionIndex,
  size,
}: {
  directionIndex: SharedValue<number>;
  size: number;
}): React.ReactElement {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <DirectionalIconSlot
          key={i}
          index={i}
          directionIndex={directionIndex}
          size={size}
        />
      ))}
    </>
  );
}

function DirectionalIconSlot({
  index,
  directionIndex,
  size,
}: {
  index: number;
  directionIndex: SharedValue<number>;
  size: number;
}): React.ReactElement {
  const style = useAnimatedStyle(() => {
    const active = Math.round(directionIndex.value) === index ? 1 : 0;
    return { opacity: active };
  });

  return (
    <Animated.View
      style={[
        { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Ionicons
        name={ICON_NAMES[index]}
        size={size}
        color={LANE_COLORS[index]}
      />
    </Animated.View>
  );
}