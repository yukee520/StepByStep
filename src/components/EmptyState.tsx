import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <View
      className={[
        'items-center justify-center px-8',
        fullscreen ? 'flex-1 bg-background dark:bg-dark-background' : 'py-10',
      ].join(' ')}
    >
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text className="text-lg font-semibold text-text dark:text-dark-text text-center">
        {title}
      </Text>
      {message ? (
        <Text className="text-sm text-muted dark:text-dark-muted text-center mt-2">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-6">
          <Button label={actionLabel} icon="add-circle-outline" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}