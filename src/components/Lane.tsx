import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import FallingNote from '@/components/FallingNote';
import { useTheme } from '@/hooks/useTheme';
import type { Note } from '@/types/song';

export type LaneProps = {
  width: number;
  left: number;
  top: number;
  height: number;
  notes: Array<{ note: Note; yRatio: number }>;
  noteSize: number;
  isActive?: boolean;
  isPressed?: boolean;
  pressColor: string;
};

export default function Lane({
  width,
  left,
  top,
  height,
  notes,
  noteSize,
  isActive = false,
  isPressed = false,
  pressColor,
}: LaneProps): React.ReactElement {
  const { colors } = useTheme();
  const noteX = (width - noteSize) / 2;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPressed) {
      glowAnim.setValue(1);
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [isPressed, glowAnim]);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: isActive ? `${colors.primary}0A` : 'transparent',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: pressColor,
          opacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.35],
          }),
        }}
      />
      {notes.map(({ note, yRatio }) => (
        <FallingNote
          key={note.id}
          direction={note.direction}
          x={noteX}
          y={yRatio * height - noteSize / 2}
          size={noteSize}
          opacity={yRatio < 0 ? 0.4 : yRatio > 1 ? 0.85 : 1}
        />
      ))}
    </View>
  );
}