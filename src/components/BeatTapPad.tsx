import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export type BeatTapPadProps = {
  tapCount: number;
  bpm: number | null;
  onTap: (timeMs: number) => void;
  onUndo: () => void;
  onClear: () => void;
};

export default function BeatTapPad({
  tapCount,
  bpm,
  onTap,
  onUndo,
  onClear,
}: BeatTapPadProps): React.ReactElement {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState<boolean>(false);

  const handlePressIn = useCallback((): void => {
    setPressed(true);
    onTap(Date.now());
  }, [onTap]);

  const handlePressOut = useCallback((): void => {
    setPressed(false);
  }, []);

  return (
    <View className="items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tap on each beat"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          width: 180,
          height: 180,
          borderRadius: 90,
          borderWidth: 4,
          borderColor: colors.primary,
          backgroundColor: pressed ? `${colors.primary}33` : `${colors.primary}11`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="hand-left-outline" size={48} color={colors.primary} />
        <Text className="text-base font-semibold text-primary mt-2">
          Tap the beat
        </Text>
      </Pressable>

      <View className="flex-row items-center mt-6 space-x-6">
        <View className="items-center">
          <Text className="text-xs text-muted dark:text-dark-muted">Taps</Text>
          <Text className="text-xl font-bold text-text dark:text-dark-text">
            {tapCount}
          </Text>
        </View>

        <View className="items-center">
          <Text className="text-xs text-muted dark:text-dark-muted">BPM</Text>
          <Text className="text-xl font-bold text-text dark:text-dark-text">
            {bpm !== null ? bpm.toFixed(1) : '—'}
          </Text>
        </View>
      </View>

      <View className="flex-row mt-6 space-x-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo last tap"
          onPress={onUndo}
          disabled={tapCount === 0}
          className={[
            'px-4 py-2 rounded-lg border border-border dark:border-dark-border',
            tapCount === 0 ? 'opacity-40' : 'active:opacity-70',
          ].join(' ')}
        >
          <Text className="text-sm text-text dark:text-dark-text">Undo</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear all taps"
          onPress={onClear}
          disabled={tapCount === 0}
          className={[
            'px-4 py-2 rounded-lg border border-border dark:border-dark-border',
            tapCount === 0 ? 'opacity-40' : 'active:opacity-70',
          ].join(' ')}
        >
          <Text className="text-sm text-danger dark:text-danger">Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}