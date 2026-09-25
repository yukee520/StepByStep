import React, { useMemo } from 'react';
import { useWindowDimensions, View, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NEON_PALETTE } from '@/theme/colors';

export type NeonBackgroundProps = {
  children?: React.ReactNode;
  showGrid?: boolean;
  gridColor?: string;
  showTopGlow?: boolean;
  style?: ViewStyle;
};

const GRID_SPACING = 40;

function NeonBackgroundBase({
  children,
  showGrid = false,
  gridColor,
  showTopGlow = true,
  style,
}: NeonBackgroundProps): React.ReactElement {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const gridLines = gridColor ?? NEON_PALETTE.primary;

  const horizontalLines = useMemo<number[]>(() => {
    const count = Math.ceil(SCREEN_H / GRID_SPACING);
    return Array.from({ length: count }, (_, i) => i * GRID_SPACING);
  }, [SCREEN_H]);

  const verticalLines = useMemo<number[]>(() => {
    const count = Math.ceil(SCREEN_W / GRID_SPACING);
    return Array.from({ length: count }, (_, i) => i * GRID_SPACING);
  }, [SCREEN_W]);

  return (
    <View style={[{ flex: 1, backgroundColor: NEON_PALETTE.background }, style]}>
      <LinearGradient
        colors={['#1F0F3A', '#0F0524', NEON_PALETTE.background]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {showTopGlow ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -SCREEN_H * 0.15,
            left: -SCREEN_W * 0.2,
            width: SCREEN_W * 1.4,
            height: SCREEN_H * 0.55,
            borderRadius: SCREEN_W * 0.7,
            backgroundColor: NEON_PALETTE.primary,
            opacity: 0.06,
          }}
        />
      ) : null}

      {showGrid ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.055,
          }}
        >
          {horizontalLines.map((y) => (
            <View
              key={`h-${y}`}
              style={{
                position: 'absolute',
                top: y,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: gridLines,
              }}
            />
          ))}
          {verticalLines.map((x) => (
            <View
              key={`v-${x}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: x,
                width: 1,
                backgroundColor: gridLines,
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const NeonBackground = React.memo(NeonBackgroundBase);
export default NeonBackground;