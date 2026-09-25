import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export type ComboOverlayProps = {
  combo: number;
  accentColor: string;
  mutedColor: string;
  fontSize: number;
  labelSize: number;
};

function ComboOverlayBase({
  combo,
  accentColor,
  mutedColor,
  fontSize,
  labelSize,
}: ComboOverlayProps): React.ReactElement | null {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const prevComboRef = useRef<number>(combo);

  useEffect(() => {
    if (combo > prevComboRef.current) {
      scaleAnim.setValue(1.12);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }
    if (combo < prevComboRef.current) {
      opacityAnim.setValue(0.4);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    prevComboRef.current = combo;
  }, [combo, scaleAnim, opacityAnim]);

  if (combo < 2) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          alignItems: 'center',
        }}
      >
        <Text
          style={[
            styles.comboNumber,
            {
              fontSize,
              color: accentColor,
              textShadowColor: accentColor,
            },
          ]}
        >
          {combo}
        </Text>
        <Text
          style={[
            styles.comboLabel,
            {
              fontSize: labelSize,
              color: mutedColor,
            },
          ]}
        >
          COMBO
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  comboNumber: {
    fontWeight: '900',
    letterSpacing: 3,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  comboLabel: {
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: 2,
  },
});

const ComboOverlay = React.memo(ComboOverlayBase);
export default ComboOverlay;