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
import { NEON_PALETTE } from '@/theme/colors';

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

const PADDING: Record<ButtonSize, { px: number; py: number }> = {
  sm: { px: 14, py: 8 },
  md: { px: 18, py: 12 },
  lg: { px: 24, py: 16 },
};

const FONT_SIZE: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

const ICON_SIZE: Record<ButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 22,
};

type VariantStyle = {
  base: ViewStyle;
  pressed: ViewStyle;
  textColor: string;
  iconColor: string;
  spinnerColor: string;
};

function getVariantStyle(
  variant: ButtonVariant,
  size: ButtonSize,
): VariantStyle {
  const { px, py } = PADDING[size];

  const base: ViewStyle = {
    paddingHorizontal: px,
    paddingVertical: py,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: py * 2 + FONT_SIZE[size] + 4,
  };

  switch (variant) {
    case 'primary':
      return {
        base: {
          ...base,
          backgroundColor: NEON_PALETTE.primary,
          borderWidth: 2,
          borderColor: NEON_PALETTE.primary,
        },
        pressed: {
          backgroundColor: NEON_PALETTE.primaryGlow,
          borderColor: NEON_PALETTE.primaryGlow,
        },
        textColor: '#0A0118',
        iconColor: '#0A0118',
        spinnerColor: '#0A0118',
      };
    case 'secondary':
      return {
        base: {
          ...base,
          backgroundColor: 'rgba(26, 11, 46, 0.6)',
          borderWidth: 2,
          borderColor: 'rgba(0, 229, 255, 0.5)',
        },
        pressed: {
          backgroundColor: 'rgba(0, 229, 255, 0.15)',
          borderColor: NEON_PALETTE.primary,
        },
        textColor: NEON_PALETTE.text,
        iconColor: NEON_PALETTE.primary,
        spinnerColor: NEON_PALETTE.primary,
      };
    case 'danger':
      return {
        base: {
          ...base,
          backgroundColor: NEON_PALETTE.danger,
          borderWidth: 2,
          borderColor: NEON_PALETTE.danger,
        },
        pressed: {
          backgroundColor: '#FF5777',
          borderColor: '#FF5777',
        },
        textColor: '#FFFFFF',
        iconColor: '#FFFFFF',
        spinnerColor: '#FFFFFF',
      };
    case 'ghost':
    default:
      return {
        base: {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: 'transparent',
        },
        pressed: {
          backgroundColor: 'rgba(0, 229, 255, 0.12)',
        },
        textColor: NEON_PALETTE.primary,
        iconColor: NEON_PALETTE.primary,
        spinnerColor: NEON_PALETTE.primary,
      };
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
  const isDisabled = disabled === true || loading;
  const v = getVariantStyle(variant, size);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        v.base,
        pressed && !isDisabled ? v.pressed : null,
        fullWidth ? { width: '100%' } : null,
        isDisabled ? { opacity: 0.5 } : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.spinnerColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <View style={{ marginRight: 8 }}>
              <Ionicons name={icon} size={ICON_SIZE[size]} color={v.iconColor} />
            </View>
          ) : null}
          <Text
            style={{
              color: v.textColor,
              fontSize: FONT_SIZE[size],
              fontWeight: '700',
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <View style={{ marginLeft: 8 }}>
              <Ionicons name={icon} size={ICON_SIZE[size]} color={v.iconColor} />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}