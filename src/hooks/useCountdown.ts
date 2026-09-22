import { useCallback, useEffect, useRef, useState } from 'react';

export type UseCountdownResult = {
  count: number;
  isRunning: boolean;
  start: (from?: number) => void;
  cancel: () => void;
};

export function useCountdown(
  initial: number,
  onComplete: () => void,
  stepMs = 700,
): UseCountdownResult {
  const [count, setCount] = useState<number>(initial);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(
    (current: number): void => {
      if (current > 1) {
        timerRef.current = setTimeout(() => {
          const next = current - 1;
          setCount(next);
          tick(next);
        }, stepMs);
      } else {
        timerRef.current = setTimeout(() => {
          setCount(0);
          setIsRunning(false);
          onCompleteRef.current();
        }, stepMs);
      }
    },
    [stepMs],
  );

  const start = useCallback(
    (from?: number): void => {
      clearTimer();
      const startValue = typeof from === 'number' && from > 0 ? from : initial;
      setCount(startValue);
      setIsRunning(true);
      tick(startValue);
    },
    [clearTimer, initial, tick],
  );

  const cancel = useCallback((): void => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return { count, isRunning, start, cancel };
}