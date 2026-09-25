import React, { useCallback, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import {
  Gesture,
  GestureDetector,
  type GestureTouchEvent,
  type TouchData,
} from 'react-native-gesture-handler';
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

type RowFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function ArrowRow({
  onPress,
  onRelease,
  buttonSize,
  gap,
  hotLevels,
  horizontalPadding,
}: ArrowRowProps): React.ReactElement {
  const rowRef = useRef<View>(null);
  const frameRef = useRef<RowFrame>({ x: 0, y: 0, width: 0, height: 0 });

  // Map from touch id -> lane index currently pressed by that finger
  const activeTouchesRef = useRef<Map<number, number>>(new Map());
  const [pressedSet, setPressedSet] = useState<Set<number>>(new Set());

  const handleLayout = useCallback((_e: LayoutChangeEvent): void => {
    // Measure the row's position on screen so we can convert
    // absolute touch coordinates into row-local coordinates.
    const node = rowRef.current;
    if (!node) {
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      frameRef.current = { x, y, width, height };
    });
  }, []);

  const updatePressedSet = useCallback((): void => {
    setPressedSet(new Set(activeTouchesRef.current.values()));
  }, []);

  /**
   * Given an absolute (window-space) touch position, determine which of
   * the 4 lanes the finger is over. Returns the lane index or null if
   * outside the row.
   */
  const hitTest = useCallback(
    (absoluteX: number, absoluteY: number): number | null => {
      const frame = frameRef.current;
      if (frame.width <= 0) {
        return null;
      }
      const localX = absoluteX - frame.x;
      const localY = absoluteY - frame.y;
      if (localY < 0 || localY > frame.height) {
        return null;
      }
      const x = localX - horizontalPadding;
      const effectiveWidth = frame.width - horizontalPadding * 2;
      if (x < 0 || x > effectiveWidth) {
        return null;
      }
      const slotWidth = effectiveWidth / 4;
      const index = Math.min(3, Math.max(0, Math.floor(x / slotWidth)));
      return index;
    },
    [horizontalPadding],
  );

  const pressLane = useCallback(
    (index: number): void => {
      onPress(LANE_ORDER[index]);
      updatePressedSet();
    },
    [onPress, updatePressedSet],
  );

  const releaseLane = useCallback(
    (index: number): void => {
      onRelease(LANE_ORDER[index]);
      updatePressedSet();
    },
    [onRelease, updatePressedSet],
  );

  /**
   * Process a single gesture-handler touch: either press a new lane,
   * release the old one, or move between lanes.
   */
  const processTouch = useCallback(
    (touch: TouchData): void => {
      const id = touch.id;
      const index = hitTest(touch.absoluteX, touch.absoluteY);
      const previous = activeTouchesRef.current.get(id);

      if (index === null) {
        if (previous !== undefined) {
          activeTouchesRef.current.delete(id);
          releaseLane(previous);
        }
        return;
      }

      if (previous === index) {
        return;
      }

      if (previous !== undefined) {
        releaseLane(previous);
      }
      activeTouchesRef.current.set(id, index);
      pressLane(index);
    },
    [hitTest, pressLane, releaseLane],
  );

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

  /**
   * Remap: gesture-handler gives us an array of touches for each event.
   * We iterate the full array so multi-touch is handled natively.
   */
  const handleTouchesDown = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.allTouches) {
        processTouch(t);
      }
    },
    [processTouch],
  );

  const handleTouchesMove = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.allTouches) {
        processTouch(t);
      }
    },
    [processTouch],
  );

  const handleTouchesUp = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.changedTouches) {
        releaseTouchById(t.id);
      }
    },
    [releaseTouchById],
  );

  const handleTouchesCancelled = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.changedTouches) {
        releaseTouchById(t.id);
      }
    },
    [releaseTouchById],
  );

  /**
   * Build the gesture. Pan with up to 4 simultaneous pointers.
   * We only care about the touch-tracking callbacks — the pan callbacks
   * themselves are no-ops.
   */
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(4)
    .shouldCancelWhenOutside(false)
    .onTouchesDown(handleTouchesDown)
    .onTouchesMove(handleTouchesMove)
    .onTouchesUp(handleTouchesUp)
    .onTouchesCancelled(handleTouchesCancelled);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        ref={rowRef}
        onLayout={handleLayout}
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
    </GestureDetector>
  );
}