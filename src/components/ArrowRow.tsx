import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import ArrowButton from '@/components/ArrowButton';
import type { Direction } from '@/types/song';

const LANE_ORDER: Direction[] = ['left', 'down', 'up', 'right'];

export type ArrowRowProps = {
  onPress: (direction: Direction) => void;
  onRelease: (direction: Direction) => void;
  buttonSize: number;
  gap: number;
  hotLevels: Record<Direction, number>;
  horizontalPadding: number;
};

type NativeTouch = {
  identifier?: number;
  locationX: number;
  locationY: number;
  pageX: number;
  pageY: number;
};

/**
 * Manages a row of 4 arrow buttons with native multi-touch support.
 *
 * Every responder event processes the full `nativeEvent.touches` array,
 * so multiple fingers landing on different buttons are all registered.
 *
 * A single finger sliding across the row releases its previous lane and
 * presses the new one. Multiple fingers can hold different lanes at once.
 *
 * The responder is set up with `onStartShouldSetResponderCapture` so the
 * row claims every touch before any child view sees it — this prevents
 * Android from routing the 2nd finger to a child that isn't listening.
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

  // Map from touch identifier -> lane index currently pressed
  const activeTouchesRef = useRef<Map<number, number>>(new Map());
  // Set of lane indices that are currently pressed by any finger
  const [pressedSet, setPressedSet] = useState<Set<number>>(new Set());

  const handleLayout = useCallback((e: LayoutChangeEvent): void => {
    setRowWidth(e.nativeEvent.layout.width);
  }, []);

  const hitTest = useCallback(
    (localX: number): number | null => {
      if (rowWidth <= 0) {
        return null;
      }
      const x = localX - horizontalPadding;
      const effectiveWidth = rowWidth - horizontalPadding * 2;
      if (x < 0 || x > effectiveWidth) {
        return null;
      }
      const slotWidth = effectiveWidth / 4;
      const index = Math.min(3, Math.max(0, Math.floor(x / slotWidth)));
      return index;
    },
    [rowWidth, horizontalPadding],
  );

  const updatePressSet = useCallback((): void => {
    setPressedSet(new Set(activeTouchesRef.current.values()));
  }, []);

  const pressLane = useCallback(
    (index: number): void => {
      onPress(LANE_ORDER[index]);
      updatePressSet();
    },
    [onPress, updatePressSet],
  );

  const releaseLane = useCallback(
    (index: number): void => {
      onRelease(LANE_ORDER[index]);
      updatePressSet();
    },
    [onRelease, updatePressSet],
  );

  /**
   * Process a single touch from a native touch event. Called for every
   * touch in nativeEvent.touches on every responder event.
   */
  const processTouch = useCallback(
    (t: NativeTouch): void => {
      const id = t.identifier ?? 0;
      const index = hitTest(t.locationX);
      const previous = activeTouchesRef.current.get(id);

      if (index === null) {
        // Finger is outside the row — release whatever it was pressing
        if (previous !== undefined) {
          activeTouchesRef.current.delete(id);
          releaseLane(previous);
        }
        return;
      }

      if (previous === index) {
        return;
      }

      // Finger moved to a different lane or just landed
      if (previous !== undefined) {
        releaseLane(previous);
      }
      activeTouchesRef.current.set(id, index);
      pressLane(index);
    },
    [hitTest, pressLane, releaseLane],
  );

  /**
   * Release a specific touch identifier. Called from release / terminate
   * events with the changedTouches array.
   */
  const releaseTouchById = useCallback(
    (id: number): void => {
      const index = activeTouchesRef.current.get(id);
      if (index === undefined) {
        return;
      }
      activeTouchesRef.current.delete(id);
      releaseLane(index);
    },
    [releaseLane],
  );

  const processAllActiveTouches = useCallback(
    (e: GestureResponderEvent): void => {
      const nativeTouches = (e.nativeEvent as unknown as { touches?: NativeTouch[] })
        .touches;
      if (!nativeTouches || nativeTouches.length === 0) {
        return;
      }
      for (const t of nativeTouches) {
        processTouch(t);
      }
    },
    [processTouch],
  );

  const processChangedTouches = useCallback(
    (e: GestureResponderEvent): void => {
      const changed = (
        e.nativeEvent as unknown as { changedTouches?: NativeTouch[] }
      ).changedTouches;
      if (!changed || changed.length === 0) {
        return;
      }
      for (const t of changed) {
        const id = t.identifier ?? 0;
        releaseTouchById(id);
      }
    },
    [releaseTouchById],
  );

  const handleResponderGrant = useCallback(
    (e: GestureResponderEvent): void => {
      processAllActiveTouches(e);
    },
    [processAllActiveTouches],
  );

  const handleResponderMove = useCallback(
    (e: GestureResponderEvent): void => {
      processAllActiveTouches(e);
    },
    [processAllActiveTouches],
  );

  const handleResponderRelease = useCallback(
    (e: GestureResponderEvent): void => {
      processChangedTouches(e);
      // In case native's changedTouches is empty on some devices, also
      // release anything that is no longer present in `touches`.
      const stillTouching = (
        e.nativeEvent as unknown as { touches?: NativeTouch[] }
      ).touches;
      const stillIds = new Set<number>(
        (stillTouching ?? []).map((t) => t.identifier ?? 0),
      );
      const ids = Array.from(activeTouchesRef.current.keys());
      for (const id of ids) {
        if (!stillIds.has(id)) {
          releaseTouchById(id);
        }
      }
    },
    [processChangedTouches, releaseTouchById],
  );

  const handleResponderTerminate = useCallback(
    (_e: GestureResponderEvent): void => {
      const ids = Array.from(activeTouchesRef.current.keys());
      for (const id of ids) {
        releaseTouchById(id);
      }
    },
    [releaseTouchById],
  );

  return (
    <View
      onLayout={handleLayout}
      // Capture every touch before children see it — mandatory for multi-touch
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponderCapture={() => true}
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