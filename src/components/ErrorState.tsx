import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/components/Button';
import { NEON_PALETTE } from '@/theme/colors';

export type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullscreen?: boolean;
};

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
  fullscreen = false,
}: ErrorStateProps): React.ReactElement {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        flex: fullscreen ? 1 : undefined,
        paddingVertical: fullscreen ? 0 : 40,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(255, 59, 92, 0.12)',
          borderWidth: 2,
          borderColor: NEON_PALETTE.danger,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons
          name="alert-circle"
          size={32}
          color={NEON_PALETTE.danger}
        />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '800',
          color: NEON_PALETTE.text,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: NEON_PALETTE.textDim,
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: 20 }}>
          <Button label="Retry" icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}