// src/components/ArrowRow.tsx
import React, { useCallback, useEffect, useRef } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import {
  Gesture,
  GestureDetector,
  type GestureTouchEvent,
  type TouchData,
} from 'react-native-gesture-handler';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import ArrowButton from '@/components/ArrowButton';
import type { Direction } from '@/types/song';

const LANE_ORDER: Direction[] = ['left', 'down', 'up', 'right'];

/**
 * Vertical tolerance (px) around the button row. A finger drifting within
 * this many pixels above or below the row still counts as "on the button".
 * Without this, tiny finger movement during a hold causes a false release.
 */
const VERTICAL_TOLERANCE = 80;

export type ArrowRowProps = {
  onPress: (direction: Direction) => void;
  onRelease: (direction: Direction) => void;
  buttonSize: number;
  gap: number;
  hotValues: Record<Direction, SharedValue<number>>;
  heldValues: Record<Direction, SharedValue<number>>;
  horizontalPadding: number;
};

type RowFrame = { x: number; y: number; width: number; height: number };

const PRESS_IN_MS = 60;
const PRESS_OUT_MS = 120;

function ArrowRowBase({
  onPress,
  onRelease,
  buttonSize,
  gap: _gap,
  hotValues,
  heldValues,
  horizontalPadding,
}: ArrowRowProps): React.ReactElement {
  const rowRef = useRef<View>(null);
  const frameRef = useRef<RowFrame>({ x: 0, y: 0, width: 0, height: 0 });

  const pressed0 = useSharedValue(0);
  const pressed1 = useSharedValue(0);
  const pressed2 = useSharedValue(0);
  const pressed3 = useSharedValue(0);

  const pressedValuesRef = useRef([pressed0, pressed1, pressed2, pressed3]);
  const activeTouchesRef = useRef<Map<number, number>>(new Map());

  const onPressRef = useRef(onPress);
  const onReleaseRef = useRef(onRelease);
  useEffect(() => {
    onPressRef.current = onPress;
    onReleaseRef.current = onRelease;
  }, [onPress, onRelease]);

  const measureRow = useCallback((): void => {
    const node = rowRef.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) => {
      frameRef.current = { x, y, width, height };
    });
  }, []);

  const handleLayout = useCallback(
    (_e: LayoutChangeEvent): void => {
      measureRow();
    },
    [measureRow],
  );

  useEffect(() => {
    measureRow();
  }, [measureRow]);

  /**
   * Hit-test a touch point. Returns the lane index if inside the row
   * (with vertical tolerance), or null otherwise.
   */
  const hitTest = useCallback(
    (absoluteX: number, absoluteY: number): number | null => {
      const frame = frameRef.current;
      if (frame.width <= 0) return null;

      const localX = absoluteX - frame.x;
      const localY = absoluteY - frame.y;

      // Vertical tolerance: allow drift within ±VERTICAL_TOLERANCE.
      if (localY < -VERTICAL_TOLERANCE || localY > frame.height + VERTICAL_TOLERANCE) {
        return null;
      }

      // Horizontal: must be inside the row's padding-adjusted span.
      const x = localX - horizontalPadding;
      const effectiveWidth = frame.width - horizontalPadding * 2;
      if (x < 0 || x > effectiveWidth) return null;

      const slotWidth = effectiveWidth / 4;
      return Math.min(3, Math.max(0, Math.floor(x / slotWidth)));
    },
    [horizontalPadding],
  );

  const setLanePressed = useCallback((index: number, pressed: boolean): void => {
    const value = pressedValuesRef.current[index];
    value.value = withTiming(pressed ? 1 : 0, {
      duration: pressed ? PRESS_IN_MS : PRESS_OUT_MS,
    });
  }, []);

  /**
   * Touch-move handler. If the touch is already assigned to a lane, we do
   * NOT release it just because the finger drifted out of bounds. We only
   * release when the finger is lifted (see releaseTouchById), or if the
   * touch clearly moved into a *different* lane horizontally.
   *
   * This is the fix for "hold breaks on finger jitter."
   */
  const processTouch = useCallback(
    (touch: TouchData): void => {
      const id = touch.id;
      const index = hitTest(touch.absoluteX, touch.absoluteY);
      const previous = activeTouchesRef.current.get(id);

      // Out of bounds now.
      if (index === null) {
        // If we previously claimed a lane for this touch, KEEP it claimed.
        // Do not fire release here. Release is handled by onTouchesUp.
        return;
      }

      // Same lane as before — no change.
      if (previous === index) {
        return;
      }

      // Moved to a different lane horizontally: release old, press new.
      if (previous !== undefined) {
        onReleaseRef.current(LANE_ORDER[previous]);
        setLanePressed(previous, false);
      }
      activeTouchesRef.current.set(id, index);
      onPressRef.current(LANE_ORDER[index]);
      setLanePressed(index, true);
    },
    [hitTest, setLanePressed],
  );

  const releaseTouchById = useCallback(
    (id: number): void => {
      const index = activeTouchesRef.current.get(id);
      if (index === undefined) return;
      activeTouchesRef.current.delete(id);
      onReleaseRef.current(LANE_ORDER[index]);
      setLanePressed(index, false);
    },
    [setLanePressed],
  );

  const handleTouchesDown = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.allTouches) processTouch(t);
    },
    [processTouch],
  );

  const handleTouchesMove = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.allTouches) processTouch(t);
    },
    [processTouch],
  );

  const handleTouchesUp = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.changedTouches) releaseTouchById(t.id);
    },
    [releaseTouchById],
  );

  const handleTouchesCancelled = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.changedTouches) releaseTouchById(t.id);
    },
    [releaseTouchById],
  );

  const panGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .minPointers(1)
        .maxPointers(4)
        .shouldCancelWhenOutside(false)
        .onTouchesDown(handleTouchesDown)
        .onTouchesMove(handleTouchesMove)
        .onTouchesUp(handleTouchesUp)
        .onTouchesCancelled(handleTouchesCancelled),
    [
      handleTouchesDown,
      handleTouchesMove,
      handleTouchesUp,
      handleTouchesCancelled,
    ],
  );

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
        <ArrowButton
          direction="left"
          size={buttonSize}
          pressedValue={pressed0}
          hotValue={hotValues.left}
          heldValue={heldValues.left}
        />
        <ArrowButton
          direction="down"
          size={buttonSize}
          pressedValue={pressed1}
          hotValue={hotValues.down}
          heldValue={heldValues.down}
        />
        <ArrowButton
          direction="up"
          size={buttonSize}
          pressedValue={pressed2}
          hotValue={hotValues.up}
          heldValue={heldValues.up}
        />
        <ArrowButton
          direction="right"
          size={buttonSize}
          pressedValue={pressed3}
          hotValue={hotValues.right}
          heldValue={heldValues.right}
        />
      </View>
    </GestureDetector>
  );
}

const ArrowRow = React.memo(ArrowRowBase);
export default ArrowRow;