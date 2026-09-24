import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { Judgment } from '@/types/game';

export type PerfectPopProps = {
  judgment: Judgment | null;
  eventKey: string | null;
  color: string;
  fontSize: number;
};

const LABELS: Record<Judgment, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  miss: 'MISS',
};

const SCALES: Record<Judgment, number> = {
  perfect: 1.0,
  great: 0.92,
  good: 0.85,
  miss: 0.8,
};

export default function PerfectPop({
  judgment,
  eventKey,
  color,
  fontSize,
}: PerfectPopProps): React.ReactElement | null {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!judgment || !eventKey) {
      return;
    }

    scaleAnim.setValue(0.6);
    opacityAnim.setValue(0);
    translateAnim.setValue(8);

    const targetScale = SCALES[judgment];

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: targetScale * 1.15,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: targetScale,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: -6,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [judgment, eventKey, scaleAnim, opacityAnim, translateAnim]);

  if (!judgment || !eventKey) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.Text
        key={eventKey}
        style={[
          styles.text,
          {
            color,
            fontSize,
            textShadowColor: color,
            textShadowRadius: 18,
            textShadowOffset: { width: 0, height: 0 },
            transform: [
              { scale: scaleAnim },
              { translateY: translateAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        {LABELS[judgment]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
});
