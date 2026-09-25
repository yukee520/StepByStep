import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import ArrowButton from '@/components/ArrowButton';
import type { Direction } from '@/types/song';
import { NEON_PALETTE } from '@/theme/colors';

const LANE_ORDER: Direction[] = ['left', 'down', 'up', 'right'];

export type ArrowRowProps = {
  /** Called immediately when a finger enters a lane. */
  onPress: (direction: Direction) => void;
  /** Called when a finger leaves a lane or lifts. */
  onRelease: (direction: Direction) => void;
  /** Size of each button in pixels. */
  buttonSize: number;
  /** Gap between buttons. */
  gap: number;
  /** Hot level (0..1) per direction — how much a note overlaps. */
  hotLevels: Record<Direction, number>;
  /** Padding on the left/right of the row container. */
  horizontalPadding: number;
};

type LaneHit = {
  direction: Direction;
  index: number;
};

/**
 * Manages a row of 4 arrow buttons with native multi-touch support.
 *
 * Each finger is tracked by its unique touch identifier. A single finger
 * moving across lanes will release its previous lane and press the new one.
 * Multiple fingers can press different lanes at the same time (chords).
 *
 * Uses the raw Responder API instead of Pressable so there's no minimum
 * press duration — presses fire on the very first frame the finger lands.
 */
export default function ArrowRow({
  onPress,
  onRelease,
  buttonSize,
  gap,
  hotLevels,
  horizontalPadding,
}: ArrowRowProps): React.ReactElement {
  const [rowWidth, setRowWidth] = useState<number>(0);
  // Map from touch identifier -> lane index currently pressed by that finger
  const activeTouchesRef = useRef<Map<number, number>>(new Map());
  // Map from lane index -> which touch identifier is currently pressing it
  const laneOwnersRef = useRef<Map<number, number>>(new Map());
  // Set of lane indices that are currently pressed (for UI feedback)
  const [pressedSet, setPressedSet] = useState<Set<number>>(new Set());

  const handleLayout = useCallback((e: LayoutChangeEvent): void => {
    setRowWidth(e.nativeEvent.layout.width);
  }, []);

  /**
   * Return which of the 4 lanes a touch at pageX is over, given the row's
   * origin. Uses the touch's pageX minus the row's pageX.
   */
  const hitTest = useCallback(
    (localX: number): LaneHit | null => {
      if (rowWidth <= 0) {
        return null;
      }
      const effectiveWidth = rowWidth - horizontalPadding * 2;
      if (effectiveWidth <= 0) {
        return null;
      }
      // localX here is relative to the row container
      const x = localX - horizontalPadding;
      if (x < 0 || x > effectiveWidth) {
        return null;
      }
      // Total width of 4 buttons + 3 gaps
      const totalButtons = buttonSize * 4 + gap * 3;
      if (totalButtons <= 0) {
        return null;
      }
      // Distribute gaps between buttons
      const slotWidth = effectiveWidth / 4;
      const index = Math.min(3, Math.max(0, Math.floor(x / slotWidth)));
      return { direction: LANE_ORDER[index], index };
    },
    [rowWidth, horizontalPadding, buttonSize, gap],
  );

  /**
   * Update the pressed state for a given touch identifier. If the finger has
   * moved to a different lane, releases the previous and presses the new.
   */
  const updateTouch = useCallback(
    (touchId: number, localX: number): void => {
      const hit = hitTest(localX);
      const previousIndex = activeTouchesRef.current.get(touchId);

      // Finger left the row entirely
      if (!hit) {
        if (previousIndex !== undefined) {
          activeTouchesRef.current.delete(touchId);
          laneOwnersRef.current.delete(previousIndex);
          setPressedSet(new Set(laneOwnersRef.current.keys()));
          onRelease(LANE_ORDER[previousIndex]);
        }
        return;
      }

      // Same lane as before — nothing to do
      if (previousIndex === hit.index) {
        return;
      }

      // Release the old lane if the finger moved
      if (previousIndex !== undefined) {
        laneOwnersRef.current.delete(previousIndex);
        onRelease(LANE_ORDER[previousIndex]);
      }

      // Claim the new lane
      activeTouchesRef.current.set(touchId, hit.index);
      laneOwnersRef.current.set(hit.index, touchId);
      setPressedSet(new Set(laneOwnersRef.current.keys()));
      onPress(hit.direction);
    },
    [hitTest, onPress, onRelease],
  );

  const endTouch = useCallback(
    (touchId: number): void => {
      const index = activeTouchesRef.current.get(touchId);
      if (index === undefined) {
        return;
      }
      activeTouchesRef.current.delete(touchId);
      laneOwnersRef.current.delete(index);
      setPressedSet(new Set(laneOwnersRef.current.keys()));
      onRelease(LANE_ORDER[index]);
    },
    [onRelease],
  );

  const handleResponderGrant = useCallback(
    (e: GestureResponderEvent): void => {
      const touch = e.nativeEvent;
      const id = touch.identifier ?? 0;
      const localX = touch.locationX;
      updateTouch(id, localX);
    },
    [updateTouch],
  );

  const handleResponderMove = useCallback(
    (e: GestureResponderEvent): void => {
      // Multi-touch: iterate over every active touch in the event
      const touches = e.nativeEvent.touches;
      if (!touches || touches.length === 0) {
        return;
      }
      for (const t of touches) {
        const id = t.identifier ?? 0;
        updateTouch(id, t.locationX);
      }
    },
    [updateTouch],
  );

  const handleResponderRelease = useCallback(
    (e: GestureResponderEvent): void => {
      const touches = e.nativeEvent.changedTouches;
      if (!touches || touches.length === 0) {
        // Fallback: release everything
        activeTouchesRef.current.forEach((_v, id) => endTouch(id));
        return;
      }
      for (const t of touches) {
        const id = t.identifier ?? 0;
        endTouch(id);
      }
    },
    [endTouch],
  );

  const handleResponderTerminate = useCallback(
    (e: GestureResponderEvent): void => {
      // Lost responder — release all our touches
      const ids = Array.from(activeTouchesRef.current.keys());
      ids.forEach((id) => endTouch(id));
      void e;
    },
    [endTouch],
  );

  return (
    <View
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleResponderGrant}
      onResponderMove={handleResponderMove}
      onResponderRelease={handleResponderRelease}
      onResponderTerminate={handleResponderTerminate}
      onResponderTerminationRequest={() => false}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalPadding,
        // Prevent layout shift from capture offset
        minHeight: buttonSize,
      }}
    >
      {LANE_ORDER.map((dir, index) => (
        <ArrowButton
          key={dir}
          direction={dir}
          size={buttonSize}
          pressed={pressedSet.has(index)}
          hotLevel={hotLevels[dir] ?? 0}
        />
      ))}
    </View>
  );
}