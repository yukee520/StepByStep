import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type CountdownOverlayProps = {
  count: number;
  visible: boolean;
};

export default function CountdownOverlay({
  count,
  visible,
}: CountdownOverlayProps): React.ReactElement | null {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  const label = count > 0 ? String(count) : 'GO!';

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
    >
      <View
        className="w-32 h-32 rounded-full items-center justify-center"
        style={{
          borderWidth: 4,
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}22`,
        }}
      >
        <Text
          className="text-6xl font-extrabold"
          style={{ color: colors.primary }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}