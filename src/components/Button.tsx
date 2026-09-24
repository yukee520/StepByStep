import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NEON_PALETTE } from '@/theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

const HEIGHT: Record<ButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 56,
};

const FONT: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

const ICON: Record<ButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 22,
};

export default function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  onPress,
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;

  let bgColor = 'transparent';
  let borderColor = 'transparent';
  let textColor = NEON_PALETTE.primary;

  if (variant === 'primary') {
    bgColor = NEON_PALETTE.primary;
    borderColor = NEON_PALETTE.primary;
    textColor = '#0A0118';
  } else if (variant === 'danger') {
    bgColor = NEON_PALETTE.danger;
    borderColor = NEON_PALETTE.danger;
    textColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    bgColor = 'rgba(26, 11, 46, 0.6)';
    borderColor = 'rgba(0, 229, 255, 0.5)';
    textColor = NEON_PALETTE.text;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        height: HEIGHT[size],
        width: fullWidth ? '100%' : undefined,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: bgColor,
        borderWidth: 2,
        borderColor: borderColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <View style={{ marginRight: 8 }}>
              <Ionicons name={icon} size={ICON[size]} color={textColor} />
            </View>
          ) : null}
          <Text
            style={{
              color: textColor,
              fontSize: FONT[size],
              fontWeight: '700',
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <View style={{ marginLeft: 8 }}>
              <Ionicons name={icon} size={ICON[size]} color={textColor} />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
