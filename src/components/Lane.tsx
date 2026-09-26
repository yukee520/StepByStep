// src/components/Lane.tsx
import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import FallingNote, { SLOT_COUNT } from '@/components/FallingNote';
import { useTheme } from '@/hooks/useTheme';
import type { LaneGeometry } from '@/types/game';

export { SLOT_COUNT };

export type LaneProps = {
  width: number;
  left: number;
  top: number;
  height: number;
  noteSize: number;
  audioPosition: SharedValue<number>;
  fallDurationMs: number;
  laneActive: SharedValue<number[]>;
  laneTimeMs: SharedValue<number[]>;
  laneDirection: SharedValue<number[]>;
  laneDuration: SharedValue<number[]>;
  laneHeldSlot: SharedValue<number[]>;
  laneHasNotes: SharedValue<number>;
  geometry: LaneGeometry;
};

function LaneBase({
  width,
  left,
  top,
  height,
  noteSize,
  audioPosition,
  fallDurationMs,
  laneActive,
  laneTimeMs,
  laneDirection,
  laneDuration,
  laneHeldSlot,
  laneHasNotes,
  geometry,
}: LaneProps): React.ReactElement {
  const { colors } = useTheme();
  const noteX = (width - noteSize) / 2;

  const slots = React.useMemo(
    () => Array.from({ length: SLOT_COUNT }, (_, i) => i),
    [],
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
      }}
    >
      <LaneBackground
        width={width}
        height={height}
        laneHasNotes={laneHasNotes}
        primaryColor={colors.primary}
      />
      {slots.map((slotIndex) => (
        <FallingNote
          key={slotIndex}
          slotIndex={slotIndex}
          laneActive={laneActive}
          laneTimeMs={laneTimeMs}
          laneDirection={laneDirection}
          laneDuration={laneDuration}
          laneHeldSlot={laneHeldSlot}
          audioPosition={audioPosition}
          fallDurationMs={fallDurationMs}
          geometry={geometry}
          noteSize={noteSize}
          x={noteX}
        />
      ))}
    </View>
  );
}

function LaneBackground({
  width,
  height,
  laneHasNotes,
  primaryColor,
}: {
  width: number;
  height: number;
  laneHasNotes: SharedValue<number>;
  primaryColor: string;
}): React.ReactElement {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor:
        laneHasNotes.value === 1 ? `${primaryColor}0A` : 'transparent',
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
        },
        animatedStyle,
      ]}
    />
  );
}

const Lane = React.memo(LaneBase);
export default Lane;