import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/components/Button';
import { NEON_PALETTE } from '@/theme/colors';

export type EmptyStateProps = {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  fullscreen?: boolean;
};

export default function EmptyState({
  icon = 'musical-notes-outline',
  title,
  message,
  actionLabel,
  onAction,
  fullscreen = false,
}: EmptyStateProps): React.ReactElement {
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
          backgroundColor: 'rgba(0, 229, 255, 0.12)',
          borderWidth: 2,
          borderColor: NEON_PALETTE.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name={icon} size={32} color={NEON_PALETTE.primary} />
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
      {message ? (
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
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 20 }}>
          <Button label={actionLabel} icon="add-circle-outline" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}