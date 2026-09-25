import React, { useCallback, useEffect, useRef, useState } from 'react';
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

/**
 * Manages a row of 4 arrow buttons with native multi-touch support.
 *
 * Uses react-native-gesture-handler's Pan gesture with up to 4 pointers
 * so each finger gets its own touch identifier and independent lane.
 *
 * Pressed-state updates are batched with `requestAnimationFrame` so a
 * burst of touch events produces at most one re-render per frame.
 */
export default function ArrowRow({
  onPress,
  onRelease,
  buttonSize,
  gap: _gap,
  hotLevels,
  horizontalPadding,
}: ArrowRowProps): React.ReactElement {
  const rowRef = useRef<View>(null);
  const frameRef = useRef<RowFrame>({ x: 0, y: 0, width: 0, height: 0 });
  const hasMeasuredRef = useRef<boolean>(false);

  // Map from touch id -> lane index currently pressed by that finger
  const activeTouchesRef = useRef<Map<number, number>>(new Map());

  // Committed pressed set (used for rendering)
  const [pressedSet, setPressedSet] = useState<Set<number>>(new Set());

  // Pending flag so we only schedule one rAF per burst
  const framePendingRef = useRef<boolean>(false);

  /**
   * Schedule a pressed-set update on the next animation frame. If many
   * touch events arrive in the same frame, we still only update once.
   */
  const schedulePressedSetUpdate = useCallback((): void => {
    if (framePendingRef.current) {
      return;
    }
    framePendingRef.current = true;
    requestAnimationFrame(() => {
      framePendingRef.current = false;
      const next = new Set(activeTouchesRef.current.values());
      setPressedSet((prev) => {
        if (prev.size === next.size) {
          let same = true;
          for (const v of next) {
            if (!prev.has(v)) {
              same = false;
              break;
            }
          }
          if (same) {
            return prev;
          }
        }
        return next;
      });
    });
  }, []);

  const measureRow = useCallback((): void => {
    const node = rowRef.current;
    if (!node) {
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      frameRef.current = { x, y, width, height };
      hasMeasuredRef.current = true;
    });
  }, []);

  const handleLayout = useCallback(
    (_e: LayoutChangeEvent): void => {
      measureRow();
    },
    [measureRow],
  );

  // Re-measure when the screen resizes (rotation, split-screen) — rare, but
  // safe. This runs once.
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
      const index = Math.min(3, Math.max(0, Math.floor(x / slotWidth)));
      return index;
    },
    [horizontalPadding],
  );

  const pressLane = useCallback(
    (index: number): void => {
      onPress(LANE_ORDER[index]);
    },
    [onPress],
  );

  const releaseLane = useCallback(
    (index: number): void => {
      onRelease(LANE_ORDER[index]);
    },
    [onRelease],
  );

  const processTouch = useCallback(
    (touch: TouchData): void => {
      const id = touch.id;
      const index = hitTest(touch.absoluteX, touch.absoluteY);
      const previous = activeTouchesRef.current.get(id);

      if (index === null) {
        if (previous !== undefined) {
          activeTouchesRef.current.delete(id);
          releaseLane(previous);
          schedulePressedSetUpdate();
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
      schedulePressedSetUpdate();
    },
    [hitTest, pressLane, releaseLane, schedulePressedSetUpdate],
  );

  const releaseTouchById = useCallback(
    (id: number): void => {
      const index = activeTouchesRef.current.get(id);
      if (index === undefined) {
        return;
      }
      activeTouchesRef.current.delete(id);
      releaseLane(index);
      schedulePressedSetUpdate();
    },
    [releaseLane, schedulePressedSetUpdate],
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