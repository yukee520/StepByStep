import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NEON_PALETTE } from '@/theme/colors';

export type LoadingStateProps = {
  label?: string;
  fullscreen?: boolean;
};

export default function LoadingState({
  label = 'Loading…',
  fullscreen = false,
}: LoadingStateProps): React.ReactElement {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: fullscreen ? 1 : undefined,
        paddingVertical: fullscreen ? 0 : 40,
      }}
    >
      <ActivityIndicator size="large" color={NEON_PALETTE.primary} />
      <Text
        style={{
          fontSize: 13,
          color: NEON_PALETTE.textDim,
          marginTop: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}