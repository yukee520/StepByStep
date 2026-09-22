import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SettingRow from '@/components/SettingRow';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useScoresStore } from '@/store/useScoresStore';
import { usePacksStore } from '@/store/usePacksStore';
import {
  DEFAULT_PACK_INDEX_URL,
  INPUT_OFFSET_MAX,
  INPUT_OFFSET_MIN,
  INPUT_OFFSET_STEP,
  NOTE_SPEED_MAX,
  NOTE_SPEED_MIN,
  NOTE_SPEED_STEP,
} from '@/types/settings';
import type { ThemeMode } from '@/types/settings';
import { formatSignedMs } from '@/utils/formatting';

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

export default function SettingsScreen(): React.ReactElement {
  const { colors } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const setNoteSpeed = useSettingsStore((s) => s.setNoteSpeed);
  const setInputOffsetMs = useSettingsStore((s) => s.setInputOffsetMs);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setPackIndexUrl = useSettingsStore((s) => s.setPackIndexUrl);
  const setShowFpsCounter = useSettingsStore((s) => s.setShowFpsCounter);
  const clearScores = useScoresStore((s) => s.clearAll);
  const installed = usePacksStore((s) => s.installed);

  const [indexUrlDraft, setIndexUrlDraft] = useState<string>(settings.packIndexUrl);

  const cycleTheme = useCallback((): void => {
    const idx = THEME_MODES.indexOf(settings.themeMode);
    const next = THEME_MODES[(idx + 1) % THEME_MODES.length];
    setThemeMode(next);
  }, [setThemeMode, settings.themeMode]);

  const handleSaveIndexUrl = useCallback((): void => {
    const trimmed = indexUrlDraft.trim();
    if (!trimmed.startsWith('https://')) {
      Alert.alert('Invalid URL', 'The pack index URL must start with https://');
      return;
    }
    setPackIndexUrl(trimmed);
    Alert.alert('Saved', 'The song pack index URL was updated.');
  }, [indexUrlDraft, setPackIndexUrl]);

  const handleResetIndexUrl = useCallback((): void => {
    setIndexUrlDraft(DEFAULT_PACK_INDEX_URL);
    setPackIndexUrl(DEFAULT_PACK_INDEX_URL);
  }, [setPackIndexUrl]);

  const handleClearScores = useCallback((): void => {
    Alert.alert(
      'Clear all high scores?',
      'This will erase every saved score. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearScores(),
        },
      ],
    );
  }, [clearScores]);

  const installedCount = Object.keys(installed).length;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <ScreenHeader title="Settings" />

      <ScrollView contentContainerClassName="px-4 pb-10" showsVerticalScrollIndicator={false}>
        <Text className="text-xs font-semibold uppercase text-muted dark:text-dark-muted mb-2 ml-1">
          Appearance
        </Text>
        <Card padded={false}>
          <View className="px-4">
            <SettingRow
              label="Theme"
              description="Light, dark, or match system"
              icon="color-palette-outline"
              valueText={settings.themeMode}
              onPress={cycleTheme}
            />
            <View className="h-px bg-border dark:bg-dark-border" />
            <SettingRow
              label="Show FPS counter"
              description="Display during gameplay"
              icon="speedometer-outline"
              right={
                <Switch
                  value={settings.showFpsCounter}
                  onValueChange={setShowFpsCounter}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              }
            />
          </View>
        </Card>

        <Text className="text-xs font-semibold uppercase text-muted dark:text-dark-muted mt-6 mb-2 ml-1">
          Gameplay
        </Text>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-text dark:text-dark-text">
                Note speed
              </Text>
              <Text className="text-xs text-muted dark:text-dark-muted">
                How fast arrows fall. Higher is harder.
              </Text>
            </View>
            <Text className="text-sm font-bold text-primary ml-3">
              {settings.noteSpeed.toFixed(2)}×
            </Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={NOTE_SPEED_MIN}
            maximumValue={NOTE_SPEED_MAX}
            step={NOTE_SPEED_STEP}
            value={settings.noteSpeed}
            onValueChange={setNoteSpeed}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />

          <View className="h-px bg-border dark:bg-dark-border mt-2" />

          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-text dark:text-dark-text">
                Input offset
              </Text>
              <Text className="text-xs text-muted dark:text-dark-muted">
                Shift hit timing. Positive = later.
              </Text>
            </View>
            <Text className="text-sm font-bold text-primary ml-3">
              {formatSignedMs(settings.inputOffsetMs)}
            </Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={INPUT_OFFSET_MIN}
            maximumValue={INPUT_OFFSET_MAX}
            step={INPUT_OFFSET_STEP}
            value={settings.inputOffsetMs}
            onValueChange={setInputOffsetMs}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />

          <View className="h-px bg-border dark:bg-dark-border mt-2" />

          <SettingRow
            label="Sound"
            description="Play audio during songs"
            icon="volume-high-outline"
            right={
              <Switch
                value={settings.soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <View className="h-px bg-border dark:bg-dark-border" />
          <SettingRow
            label="Haptics"
            description="Vibrate on perfect hits"
            icon="pulse-outline"
            right={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
        </Card>

        <Text className="text-xs font-semibold uppercase text-muted dark:text-dark-muted mt-6 mb-2 ml-1">
          Song Packs
        </Text>
        <Card>
          <Text className="text-sm text-text dark:text-dark-text">
            Pack index URL
          </Text>
          <Text className="text-xs text-muted dark:text-dark-muted mt-1">
            The remote JSON listing available song packs. Must be HTTPS.
          </Text>
          <TextInput
            value={indexUrlDraft}
            onChangeText={setIndexUrlDraft}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={DEFAULT_PACK_INDEX_URL}
            placeholderTextColor={colors.muted}
            className="mt-3 border border-border dark:border-dark-border rounded-lg px-3 py-2 text-xs text-text dark:text-dark-text"
          />
          <View className="flex-row mt-3 space-x-3">
            <View className="flex-1">
              <Button
                label="Save"
                icon="checkmark"
                size="sm"
                fullWidth
                onPress={handleSaveIndexUrl}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Reset"
                icon="refresh"
                variant="secondary"
                size="sm"
                fullWidth
                onPress={handleResetIndexUrl}
              />
            </View>
          </View>
          <Text className="text-[11px] text-muted dark:text-dark-muted mt-3">
            {installedCount} pack{installedCount === 1 ? '' : 's'} currently installed.
          </Text>
        </Card>

        <Text className="text-xs font-semibold uppercase text-muted dark:text-dark-muted mt-6 mb-2 ml-1">
          Data
        </Text>
        <Card padded={false}>
          <View className="px-4">
            <SettingRow
              label="Clear all high scores"
              description="Erase every saved score and combo"
              icon="trophy-outline"
              destructive
              onPress={handleClearScores}
            />
          </View>
        </Card>

        <Text className="text-xs font-semibold uppercase text-muted dark:text-dark-muted mt-6 mb-2 ml-1">
          About
        </Text>
        <Card>
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-text dark:text-dark-text">
                StepByStep
              </Text>
              <Text className="text-xs text-muted dark:text-dark-muted mt-0.5">
                Rhythm game · v1.0.0
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted dark:text-dark-muted mt-3">
            Tap the arrows in time with the beat. Hit Perfect, Great, and Good judgments
            to build combos. Higher combos mean higher scores.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}