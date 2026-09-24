import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NEON_PALETTE } from '@/theme/colors';

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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(10, 1, 24, 0.85)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 229, 255, 0.12)',
      }}
    >
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={handleBack}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
          }}
        >
          <Ionicons name="chevron-back" size={24} color={NEON_PALETTE.text} />
        </Pressable>
      ) : (
        <View style={{ width: 40, height: 40 }} />
      )}

      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '800',
            color: NEON_PALETTE.text,
            letterSpacing: 0.3,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 12,
              color: NEON_PALETTE.textDim,
              marginTop: 2,
              letterSpacing: 0.5,
            }}
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
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
          }}
        >
          <Ionicons name={rightIcon} size={22} color={NEON_PALETTE.primary} />
        </Pressable>
      ) : (
        <View style={{ width: 40, height: 40 }} />
      )}
    </View>
  );
}