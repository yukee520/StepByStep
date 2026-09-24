import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SettingRow from '@/components/SettingRow';
import NeonBackground from '@/components/NeonBackground';
import DeveloperUnlockTap from '@/components/DeveloperUnlockTap';
import { NEON_PALETTE } from '@/theme/colors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useScoresStore } from '@/store/useScoresStore';
import { usePacksStore } from '@/store/usePacksStore';
import { useDevModeStore } from '@/store/useDevModeStore';
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

function SectionLabel({ children }: { children: string }): React.ReactElement {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        color: NEON_PALETTE.textDim,
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 4,
      }}
    >
      {children}
    </Text>
  );
}

export default function SettingsScreen(): React.ReactElement {
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
  const devModeEnabled = useDevModeStore((s) => s.enabled);

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
    <NeonBackground showGrid>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Settings" />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel>APPEARANCE</SectionLabel>
          <Card padded={false}>
            <View style={{ paddingHorizontal: 16 }}>
              <SettingRow
                label="Theme"
                description="Light, dark, or match system"
                icon="color-palette-outline"
                valueText={settings.themeMode}
                onPress={cycleTheme}
              />
              <View style={{ height: 1, backgroundColor: 'rgba(0, 229, 255, 0.1)' }} />
              <SettingRow
                label="Show FPS counter"
                description="Display during gameplay"
                icon="speedometer-outline"
                right={
                  <Switch
                    value={settings.showFpsCounter}
                    onValueChange={setShowFpsCounter}
                    trackColor={{
                      false: 'rgba(0, 229, 255, 0.2)',
                      true: NEON_PALETTE.primary,
                    }}
                    thumbColor={NEON_PALETTE.text}
                  />
                }
              />
            </View>
          </Card>

          <SectionLabel>GAMEPLAY</SectionLabel>
          <Card>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: NEON_PALETTE.text,
                  }}
                >
                  Note speed
                </Text>
                <Text
                  style={{ fontSize: 12, color: NEON_PALETTE.textDim, marginTop: 2 }}
                >
                  How fast arrows fall. Higher is harder.
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: NEON_PALETTE.primary,
                  marginLeft: 12,
                }}
              >
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
              minimumTrackTintColor={NEON_PALETTE.primary}
              maximumTrackTintColor="rgba(0, 229, 255, 0.2)"
              thumbTintColor={NEON_PALETTE.primary}
            />

            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                marginTop: 6,
                marginBottom: 12,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: NEON_PALETTE.text,
                  }}
                >
                  Input offset
                </Text>
                <Text
                  style={{ fontSize: 12, color: NEON_PALETTE.textDim, marginTop: 2 }}
                >
                  Shift hit timing. Positive = later.
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: NEON_PALETTE.primary,
                  marginLeft: 12,
                }}
              >
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
              minimumTrackTintColor={NEON_PALETTE.primary}
              maximumTrackTintColor="rgba(0, 229, 255, 0.2)"
              thumbTintColor={NEON_PALETTE.primary}
            />

            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                marginTop: 6,
              }}
            />

            <SettingRow
              label="Sound"
              description="Play audio during songs"
              icon="volume-high-outline"
              right={
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{
                    false: 'rgba(0, 229, 255, 0.2)',
                    true: NEON_PALETTE.primary,
                  }}
                  thumbColor={NEON_PALETTE.text}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: 'rgba(0, 229, 255, 0.1)' }} />
            <SettingRow
              label="Haptics"
              description="Vibrate on tap"
              icon="pulse-outline"
              right={
                <Switch
                  value={settings.hapticsEnabled}
                  onValueChange={setHapticsEnabled}
                  trackColor={{
                    false: 'rgba(0, 229, 255, 0.2)',
                    true: NEON_PALETTE.primary,
                  }}
                  thumbColor={NEON_PALETTE.text}
                />
              }
            />
          </Card>

          <SectionLabel>SONG PACKS</SectionLabel>
          <Card>
            <Text style={{ fontSize: 14, color: NEON_PALETTE.text }}>
              Pack index URL
            </Text>
            <Text
              style={{ fontSize: 12, color: NEON_PALETTE.textDim, marginTop: 4 }}
            >
              The remote JSON listing available song packs. Must be HTTPS.
            </Text>
            <TextInput
              value={indexUrlDraft}
              onChangeText={setIndexUrlDraft}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={DEFAULT_PACK_INDEX_URL}
              placeholderTextColor={NEON_PALETTE.muted}
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: 'rgba(0, 229, 255, 0.25)',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 12,
                color: NEON_PALETTE.text,
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Save"
                  icon="checkmark"
                  size="sm"
                  fullWidth
                  onPress={handleSaveIndexUrl}
                />
              </View>
              <View style={{ flex: 1 }}>
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
            <Text
              style={{
                fontSize: 11,
                color: NEON_PALETTE.textDim,
                marginTop: 12,
              }}
            >
              {installedCount} pack{installedCount === 1 ? '' : 's'} currently installed.
            </Text>
          </Card>

          <SectionLabel>DATA</SectionLabel>
          <Card padded={false}>
            <View style={{ paddingHorizontal: 16 }}>
              <SettingRow
                label="Clear all high scores"
                description="Erase every saved score and combo"
                icon="trophy-outline"
                destructive
                onPress={handleClearScores}
              />
            </View>
          </Card>

          <SectionLabel>ABOUT</SectionLabel>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={NEON_PALETTE.primary}
              />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <DeveloperUnlockTap
                label="StepByStep"
                subtitle="Rhythm game · v1.0.0 ·"
              />
           </View>
    {devModeEnabled ? (
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: NEON_PALETTE.primary,
          backgroundColor: 'rgba(0, 229, 255, 0.12)',
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: NEON_PALETTE.primary,
            letterSpacing: 1,
          }}
        >
          DEV
        </Text>
      </View>
    ) : null}
  </View>
</Card>

        </ScrollView>
      </SafeAreaView>
    </NeonBackground>
  );
}