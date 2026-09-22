import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <View
      className={[
        'items-center justify-center px-8',
        fullscreen ? 'flex-1 bg-background dark:bg-dark-background' : 'py-10',
      ].join(' ')}
    >
      <View className="w-16 h-16 rounded-full bg-danger/10 items-center justify-center mb-4">
        <Ionicons name="alert-circle" size={32} color={colors.danger} />
      </View>
      <Text className="text-lg font-semibold text-text dark:text-dark-text text-center">
        {title}
      </Text>
      <Text className="text-sm text-muted dark:text-dark-muted text-center mt-2">
        {message}
      </Text>
      {onRetry ? (
        <View className="mt-6">
          <Button label="Retry" icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}