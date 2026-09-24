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

function getStyles(
  variant: ButtonVariant,
  size: ButtonSize,
): {
  container: ViewStyle;
  textColor: string;
  iconColor: string;
  spinnerColor: string;
} {
  const { px, py } = PADDING[size];

  const base: ViewStyle = {
    paddingHorizontal: px,
    paddingVertical: py,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  };

  switch (variant) {
    case 'primary':
      return {
        container: {
          ...base,
          backgroundColor: NEON_PALETTE.primary,
          shadowColor: NEON_PALETTE.primary,
          shadowOpacity: 0.55,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        },
        textColor: '#0A0118',
        iconColor: '#0A0118',
        spinnerColor: '#0A0118',
      };
    case 'secondary':
      return {
        container: {
          ...base,
          backgroundColor: 'rgba(26, 11, 46, 0.6)',
          borderWidth: 1,
          borderColor: NEON_PALETTE.borderBright,
        },
        textColor: NEON_PALETTE.text,
        iconColor: NEON_PALETTE.primary,
        spinnerColor: NEON_PALETTE.primary,
      };
    case 'danger':
      return {
        container: {
          ...base,
          backgroundColor: NEON_PALETTE.danger,
          shadowColor: NEON_PALETTE.danger,
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 5,
        },
        textColor: '#FFFFFF',
        iconColor: '#FFFFFF',
        spinnerColor: '#FFFFFF',
      };
    case 'ghost':
    default:
      return {
        container: {
          ...base,
          backgroundColor: 'transparent',
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
  const s = getStyles(variant, size);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={[
        s.container,
        fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' },
        isDisabled ? { opacity: 0.5 } : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={s.spinnerColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <View style={{ marginRight: 8 }}>
              <Ionicons name={icon} size={ICON_SIZE[size]} color={s.iconColor} />
            </View>
          ) : null}
          <Text
            style={{
              color: s.textColor,
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
              <Ionicons name={icon} size={ICON_SIZE[size]} color={s.iconColor} />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}