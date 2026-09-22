import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type LoadingStateProps = {
  label?: string;
  fullscreen?: boolean;
};

export default function LoadingState({
  label = 'Loading…',
  fullscreen = false,
}: LoadingStateProps): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View
      className={[
        'items-center justify-center',
        fullscreen ? 'flex-1 bg-background dark:bg-dark-background' : 'py-10',
      ].join(' ')}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="text-sm text-muted dark:text-dark-muted mt-3">
        {label}
      </Text>
    </View>
  );
}