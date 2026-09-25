import React from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Lane from '@/components/Lane';
import { NEON_PALETTE } from '@/theme/colors';
import type { LaneSharedValues } from '@/hooks/useGameEngine';

export type LaneAreaProps = {
  width: number;
  height: number;
  top: number;
  left: number;
  laneWidth: number;
  noteSize: number;
  audioPosition: SharedValue<number>;
  fallDurationMs: number;
  lanes: [LaneSharedValues, LaneSharedValues, LaneSharedValues, LaneSharedValues];
};

function LaneAreaBase({
  width,
  height,
  top,
  left,
  laneWidth,
  noteSize,
  audioPosition,
  fallDurationMs,
  lanes,
}: LaneAreaProps): React.ReactElement {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: NEON_PALETTE.border,
        backgroundColor: 'rgba(21, 8, 41, 0.55)',
        overflow: 'hidden',
      }}
    >
      {lanes.map((lane, index) => (
        <Lane
          key={index}
          width={laneWidth}
          left={index * laneWidth}
          top={0}
          height={height}
          noteSize={noteSize}
          audioPosition={audioPosition}
          fallDurationMs={fallDurationMs}
          laneActive={lane.active}
          laneTimeMs={lane.timeMs}
          laneDirection={lane.direction}
          laneHasNotes={lane.hasNotes}
        />
      ))}
    </View>
  );
}

const LaneArea = React.memo(LaneAreaBase);
export default LaneArea;