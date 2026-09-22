import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
};

const SIZE_PADDING: Record<ButtonSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
};

const SIZE_TEXT: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const SIZE_ICON: Record<ButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 22,
};

function variantClass(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return 'bg-primary dark:bg-primary';
    case 'secondary':
      return 'bg-secondary/10 dark:bg-dark-border/40 border border-border dark:border-dark-border';
    case 'danger':
      return 'bg-danger';
    case 'ghost':
    default:
      return 'bg-transparent';
  }
}

function variantTextClass(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return 'text-white';
    case 'secondary':
      return 'text-text dark:text-dark-text';
    case 'ghost':
    default:
      return 'text-primary dark:text-primary';
  }
}

function variantIconColor(variant: ButtonVariant, fallback: string): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return '#FFFFFF';
    case 'secondary':
    case 'ghost':
    default:
      return fallback;
  }
}

export default function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps): React.ReactElement {
  const { colors } = useTheme();
  const isDisabled = disabled === true || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={style}
      className={[
        'flex-row items-center justify-center rounded-xl',
        SIZE_PADDING[size],
        variantClass(variant),
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : 'active:opacity-80',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <View className="mr-2">
              <Ionicons
                name={icon}
                size={SIZE_ICON[size]}
                color={variantIconColor(variant, colors.primary)}
              />
            </View>
          ) : null}
          <Text
            className={[
              'font-semibold',
              SIZE_TEXT[size],
              variantTextClass(variant),
            ].join(' ')}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <View className="ml-2">
              <Ionicons
                name={icon}
                size={SIZE_ICON[size]}
                color={variantIconColor(variant, colors.primary)}
              />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}