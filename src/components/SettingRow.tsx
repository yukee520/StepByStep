import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export type SettingRowProps = {
  label: string;
  description?: string;
  valueText?: string;
  icon?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
};

export default function SettingRow({
  label,
  description,
  valueText,
  icon,
  onPress,
  right,
  destructive = false,
  disabled = false,
}: SettingRowProps): React.ReactElement {
  const { colors } = useTheme();
  const tint = destructive ? colors.danger : colors.primary;
  const interactive = onPress !== undefined && !disabled;

  const content = (
    <View className="flex-row items-center py-3">
      {icon ? (
        <View
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${tint}22` }}
        >
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      ) : null}

      <View className="flex-1">
        <Text
          className={[
            'text-base font-medium',
            destructive
              ? 'text-danger dark:text-danger'
              : 'text-text dark:text-dark-text',
          ].join(' ')}
        >
          {label}
        </Text>
        {description ? (
          <Text className="text-xs text-muted dark:text-dark-muted mt-0.5">
            {description}
          </Text>
        ) : null}
      </View>

      {right ?? null}

      {valueText && !right ? (
        <Text className="text-sm text-muted dark:text-dark-muted mr-2">
          {valueText}
        </Text>
      ) : null}

      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      ) : null}
    </View>
  );

  if (!interactive) {
    return (
      <View className={disabled ? 'opacity-50' : ''}>{content}</View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      className="active:opacity-70"
    >
      {content}
    </Pressable>
  );
}