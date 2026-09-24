import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useDevModeStore, DEV_MODE_REQUIRED_TAPS } from '@/store/useDevModeStore';
import { NEON_PALETTE } from '@/theme/colors';

export type DeveloperUnlockTapProps = {
  /** Optional prefix rendered before the version, e.g. "StepByStep · ". */
  label: string;
  /** Optional suffix after the label. */
  subtitle?: string;
};

export default function DeveloperUnlockTap({
  label,
  subtitle,
}: DeveloperUnlockTapProps): React.ReactElement {
  const tapVersion = useDevModeStore((s) => s.tapVersion);
  const enabled = useDevModeStore((s) => s.enabled);

  const handlePress = useCallback((): void => {
    const result = tapVersion();

    if (result.unlocked) {
      if (enabled) {
        Toast.show({
          type: 'info',
          text1: 'Developer mode disabled',
          text2: 'The Builder is hidden again.',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Developer mode enabled',
          text2: 'Library and Chart Builder are now available.',
          position: 'bottom',
          visibilityTime: 4000,
        });
      }
      return;
    }

    if (result.remaining <= 3) {
      Toast.show({
        type: 'info',
        text1: `${result.remaining} more tap${
          result.remaining === 1 ? '' : 's'
        } to unlock`,
        position: 'bottom',
        visibilityTime: 1500,
      });
    }
  }, [enabled, tapVersion]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={{ paddingVertical: 4 }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '800',
          color: NEON_PALETTE.text,
        }}
      >
        {label}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 12,
            color: NEON_PALETTE.textDim,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}