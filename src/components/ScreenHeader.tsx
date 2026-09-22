import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
};

export default function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
}: ScreenHeaderProps): React.ReactElement {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleBack = (): void => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View className="flex-row items-center px-4 py-3 bg-background dark:bg-dark-background">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      ) : (
        <View className="w-10 h-10" />
      )}

      <View className="flex-1 ml-2">
        <Text
          className="text-lg font-semibold text-text dark:text-dark-text"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-xs text-muted dark:text-dark-muted mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightIcon && onRightPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rightAccessibilityLabel ?? 'Action'}
          hitSlop={12}
          onPress={onRightPress}
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name={rightIcon} size={22} color={colors.text} />
        </Pressable>
      ) : (
        <View className="w-10 h-10" />
      )}
    </View>
  );
}