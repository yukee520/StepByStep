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

  const hitTest = useCallback(
    (absoluteX: number, absoluteY: number): number | null => {
      const frame = frameRef.current;
      if (frame.width <= 0) return null;

      const localX = absoluteX - frame.x;
      const localY = absoluteY - frame.y;

      if (
        localY < -VERTICAL_TOLERANCE ||
        localY > frame.height + VERTICAL_TOLERANCE
      ) {
        return null;
      }

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

  // Claim a touch on down. Once claimed, the lane never changes on move.
  const processTouchDown = useCallback(
    (touch: TouchData): void => {
      const id = touch.id;
      if (activeTouchesRef.current.has(id)) return;
      const index = hitTest(touch.absoluteX, touch.absoluteY);
      if (index === null) return;
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
      for (const t of e.allTouches) processTouchDown(t);
    },
    [processTouchDown],
  );

  // Movement is a strict no-op. Do not switch lanes, do not release.
  const handleTouchesMove = useCallback(
    (_e: GestureTouchEvent): void => {
      // intentionally empty
    },
    [],
  );

  const handleTouchesUp = useCallback(
    (e: GestureTouchEvent): void => {
      for (const t of e.changedTouches) releaseTouchById(t.id);
    },
    [releaseTouchById],
  );

  // Cancellation is a strict no-op. Android can fire spurious cancels mid-hold
  // when a system gesture or gesture-handler state machine deactivates the
  // touch stream. Releasing on cancel breaks holds; we rely on onTouchesUp.
  const handleTouchesCancelled = useCallback(
    (_e: GestureTouchEvent): void => {
      // intentionally empty
    },
    [],
  );

  // Gesture.Manual gives raw touch callbacks without the movement-based
  // activation/cancellation logic that Gesture.Pan applies. Pan was
  // cancelling our holds ~600ms in, when a small finger jitter or system
  // gesture caused Pan to change state.
  const manualGesture = React.useMemo(
    () =>
      Gesture.Manual()
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
    <GestureDetector gesture={manualGesture}>
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