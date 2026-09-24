import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type CountdownOverlayProps = {
  count: number;
  visible: boolean;
};

const HUD_RATIO = 0.10;
const BUTTON_ROW_RATIO = 0.74;
const CIRCLE_SIZE = 140;

export default function CountdownOverlay({
  count,
  visible,
}: CountdownOverlayProps): React.ReactElement | null {
  const { colors } = useTheme();
  const { height: SCREEN_H } = useWindowDimensions();

  if (!visible) {
    return null;
  }

  const label = count > 0 ? String(count) : 'GO!';
  const accent = count > 0 ? colors.primary : colors.success;

  const laneTop = SCREEN_H * HUD_RATIO;
  const laneHeight = SCREEN_H * (BUTTON_ROW_RATIO - HUD_RATIO);
  const circleTop = laneTop + (laneHeight - CIRCLE_SIZE) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: circleTop,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          borderRadius: CIRCLE_SIZE / 2,
          borderWidth: 4,
          borderColor: accent,
          backgroundColor: `${accent}22`,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: accent,
          shadowOpacity: 0.9,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        }}
      >
        <Text
          style={{
            fontSize: 72,
            fontWeight: '900',
            color: accent,
            letterSpacing: 2,
            textShadowColor: accent,
            textShadowRadius: 12,
            textShadowOffset: { width: 0, height: 0 },
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}