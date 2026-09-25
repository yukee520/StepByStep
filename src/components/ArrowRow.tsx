import React, { useCallback, useEffect, useRef } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import {
  Gesture,
  GestureDetector,
  type GestureTouchEvent,
  type TouchData,
} from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
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

const PRESS_IN_MS = 60;
const PRESS_OUT_MS = 120;

function ArrowRowBase({
  onPress,
  onRelease,
  buttonSize,
  gap: _gap,
  hotLevels,
  horizontalPadding,
}: ArrowRowProps): React.ReactElement {
  const rowRef = useRef<View>(null);
  const frameRef = useRef<RowFrame>({ x: 0, y: 0, width: 0, height: 0 });

  const pressed0 = useSharedValue(0);
  const pressed1 = useSharedValue(0);
  const pressed2 = useSharedValue(0);
  const pressed3 = useSharedValue(0);

  const hot0 = useSharedValue(0);
  const hot1 = useSharedValue(0);
  const hot2 = useSharedValue(0);
  const hot3 = useSharedValue(0);

  const pressedValuesRef = useRef([pressed0, pressed1, pressed2, pressed3]);
  const hotValuesRef = useRef([hot0, hot1, hot2, hot3]);
  const activeTouchesRef = useRef<Map<number, number>>(new Map());

  // Keep refs for the callbacks so we don't need to rebuild the gesture
  // when the parent re-renders with new closures.
  const onPressRef = useRef(onPress);
  const onReleaseRef = useRef(onRelease);
  useEffect(() => {
    onPressRef.current = onPress;
    onReleaseRef.current = onRelease;
  }, [onPress, onRelease]);

  useEffect(() => {
    const map: Direction[] = ['left', 'down', 'up', 'right'];
    for (let i = 0; i < 4; i += 1) {
      const level = hotLevels[map[i]] ?? 0;
      hotValuesRef.current[i].value = withTiming(level, { duration: 80 });
    }
  }, [hotLevels]);

  const measureRow = useCallback((): void => {
    const node = rowRef.current;
    if (!node) {
      return;
    }
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

  const processTouch = useCallback(
    (touch: TouchData): void => {
      const id = touch.id;
      const index = hitTest(touch.absoluteX, touch.absoluteY);
      const previous = activeTouchesRef.current.get(id);

      if (index === null) {
        if (previous !== undefined) {
          activeTouchesRef.current.delete(id);
          onReleaseRef.current(LANE_ORDER[previous]);
          setLanePressed(previous, false);
        }
        return;
      }

      if (previous === index) {
        return;
      }

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
      if (index === undefined) {
        return;
      }
      activeTouchesRef.current.delete(id);
      onReleaseRef.current(LANE_ORDER[index]);
      setLanePressed(index, false);
    },
    [setLanePressed],
  );

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

  // Gesture is built once and reused across renders. Callbacks are stable
  // (they use refs to reach the latest props).
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
          hotValue={hot0}
        />
        <ArrowButton
          direction="down"
          size={buttonSize}
          pressedValue={pressed1}
          hotValue={hot1}
        />
        <ArrowButton
          direction="up"
          size={buttonSize}
          pressedValue={pressed2}
          hotValue={hot2}
        />
        <ArrowButton
          direction="right"
          size={buttonSize}
          pressedValue={pressed3}
          hotValue={hot3}
        />
      </View>
    </GestureDetector>
  );
}

const ArrowRow = React.memo(ArrowRowBase);
export default ArrowRow;