import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { pick, types } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import BeatTapPad from '@/components/BeatTapPad';
import TimelineStrip from '@/components/TimelineStrip';
import DifficultyBadge from '@/components/DifficultyBadge';
import PublishToGitHubSheet from '@/components/PublishToGitHubSheet';
import { useTheme } from '@/hooks/useTheme';
import { generateChart } from '@/services/chartGenerator';
import {
  addTap,
  clearTaps,
  createTapDetector,
  estimateBpmFromTaps,
  generateBeatMarkersFromBpm,
  removeLastTap,
  tapTimesToMarkers,
} from '@/services/beatDetector';
import { BUILDER_ROOT, EXPORTS_ROOT, ensureLibraryDirs } from '@/services/songLibrary';
import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty, type Note } from '@/types/song';
import type { BeatMarker, BuilderMetadata } from '@/types/builder';
import { DEFAULT_BUILDER_METADATA } from '@/types/builder';
import type { SongPackManifest } from '@/types/songPack';
import { formatSignedMs } from '@/utils/formatting';
import { genId, slugify } from '@/utils/id';

export default function BuilderScreen(): React.ReactElement {
  const { colors } = useTheme();
  const [metadata, setMetadata] = useState<BuilderMetadata>(DEFAULT_BUILDER_METADATA);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [durationMs, setDurationMs] = useState<number>(0);
  const [taps, setTaps] = useState<number[]>([]);
  const [beats, setBeats] = useState<BeatMarker[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [busy, setBusy] = useState<boolean>(false);

  // Publishing state
  const [manifestForPublish, setManifestForPublish] = useState<SongPackManifest | null>(null);
  const [audioBase64ForPublish, setAudioBase64ForPublish] = useState<string | null>(null);
  const [audioExtForPublish, setAudioExtForPublish] = useState<string>('mp3');
  const [publishVisible, setPublishVisible] = useState<boolean>(false);

  const tapDetector = useMemo(() => createTapDetector(), []);
  const detectedBpm = useMemo(() => estimateBpmFromTaps(taps), [taps]);

  const handlePickAudio = useCallback(async (): Promise<void> => {
    try {
      const [result] = await pick({
        type: [types.audio],
        allowMultiSelection: false,
        copyTo: 'documentDirectory',
      });
      if (!result) {
        return;
      }
      await ensureLibraryDirs();
      const ext = result.name?.split('.').pop() ?? 'mp3';
      const target = `${BUILDER_ROOT}/source-${Date.now()}.${ext}`;
      const srcPath =
        result.fileCopyUri?.replace('file://', '') ?? result.uri.replace('file://', '');
      await RNFS.copyFile(srcPath, target);
      setAudioPath(target);
      setAudioFileName(result.name ?? 'audio');
      setDurationMs(0);
      Toast.show({
        type: 'success',
        text1: 'Audio loaded',
        text2: result.name ?? 'Track ready',
        position: 'bottom',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not pick audio',
        position: 'bottom',
      });
    }
  }, []);

  const handleTap = useCallback(
    (timeMs: number): void => {
      addTap(tapDetector, timeMs);
      setTaps([...tapDetector.taps]);
    },
    [tapDetector],
  );

  const handleUndo = useCallback((): void => {
    removeLastTap(tapDetector);
    setTaps([...tapDetector.taps]);
  }, [tapDetector]);

  const handleClear = useCallback((): void => {
    clearTaps(tapDetector);
    setTaps([]);
  }, [tapDetector]);

  const handleBeatsFromTaps = useCallback((): void => {
    if (taps.length < 2) {
      Toast.show({ type: 'info', text1: 'Tap at least twice', position: 'bottom' });
      return;
    }
    const markers = tapTimesToMarkers(taps);
    setBeats(markers);
    if (detectedBpm !== null) {
      setMetadata((m) => ({ ...m, bpm: detectedBpm }));
    }
    Toast.show({
      type: 'success',
      text1: 'Beats captured',
      text2: `${markers.length} markers`,
      position: 'bottom',
    });
  }, [detectedBpm, taps]);

  const handleGenerateFromBpm = useCallback((): void => {
    const dur = durationMs > 0 ? durationMs : 60000;
    const markers = generateBeatMarkersFromBpm(metadata.bpm, dur, 0);
    setBeats(markers);
    Toast.show({
      type: 'success',
      text1: 'Beats generated',
      text2: `${markers.length} markers`,
      position: 'bottom',
    });
  }, [durationMs, metadata.bpm]);

  const handleGenerateChart = useCallback((): void => {
    if (beats.length === 0) {
      Toast.show({ type: 'info', text1: 'Generate beats first', position: 'bottom' });
      return;
    }
    const dur = durationMs > 0 ? durationMs : 60000;
    const chart = generateChart(beats, {
      difficulty: metadata.difficulty,
      bpm: metadata.bpm,
      offsetMs: metadata.offsetMs,
      startAtMs: 0,
      endAtMs: dur,
      includeDoubles: metadata.difficulty === 'hard' || metadata.difficulty === 'expert',
    });
    setNotes(chart);
    Toast.show({
      type: 'success',
      text1: 'Chart generated',
      text2: `${chart.length} notes`,
      position: 'bottom',
    });
  }, [beats, durationMs, metadata]);

  const buildManifest = useCallback((): SongPackManifest | null => {
    if (notes.length === 0) {
      return null;
    }
    const title = metadata.title.trim() || 'Untitled Song';
    const id = metadata.id.trim() || slugify(title) || `pack-${genId('p')}`;
    const dur = durationMs > 0 ? durationMs : 60000;
    return {
      formatVersion: 1,
      id,
      title,
      artist: metadata.artist.trim() || 'Unknown Artist',
      bpm: metadata.bpm,
      durationMs: dur,
      difficulty: metadata.difficulty,
      offsetMs: metadata.offsetMs,
      chart: notes,
      version: 1,
      license: metadata.license || 'CC0',
      generatedBy: 'StepByStep Builder 1.0',
    };
  }, [durationMs, metadata, notes]);

  const handleExport = useCallback(async (): Promise<void> => {
    const manifest = buildManifest();
    if (!manifest) {
      Toast.show({
        type: 'info',
        text1: 'Generate a chart first',
        position: 'bottom',
      });
      return;
    }
    setBusy(true);
    try {
      await ensureLibraryDirs();
      const outDir = `${EXPORTS_ROOT}/${manifest.id}`;
      const exists = await RNFS.exists(outDir);
      if (exists) {
        await RNFS.unlink(outDir);
      }
      await RNFS.mkdir(outDir);

      const manifestPath = `${outDir}/manifest.json`;
      await RNFS.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

      if (audioPath) {
        const ext = audioPath.split('.').pop() ?? 'mp3';
        const audioOut = `${outDir}/audio.${ext}`;
        await RNFS.copyFile(audioPath, audioOut);
      }

      Toast.show({
        type: 'success',
        text1: 'Export complete',
        text2: `Saved to ${manifest.id}/`,
        position: 'bottom',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      Toast.show({
        type: 'error',
        text1: 'Export failed',
        text2: message,
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  }, [audioPath, buildManifest]);

  const handleOpenPublish = useCallback(async (): Promise<void> => {
    const manifest = buildManifest();
    if (!manifest) {
      Toast.show({
        type: 'info',
        text1: 'Generate a chart first',
        position: 'bottom',
      });
      return;
    }

    let audioBase64: string | null = null;
    let ext = 'mp3';
    if (audioPath) {
      try {
        audioBase64 = await RNFS.readFile(audioPath, 'base64');
        ext = audioPath.split('.').pop() ?? 'mp3';
      } catch {
        audioBase64 = null;
      }
    }

    setManifestForPublish(manifest);
    setAudioBase64ForPublish(audioBase64);
    setAudioExtForPublish(ext);
    setPublishVisible(true);
  }, [audioPath, buildManifest]);

  const handleClosePublish = useCallback((): void => {
    setPublishVisible(false);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <ScreenHeader
        title="Chart Builder"
        subtitle="Turn any song into a playable chart"
      />

      <ScrollView contentContainerClassName="px-4 pb-10" showsVerticalScrollIndicator={false}>
        <Card>
          <Text className="text-base font-semibold text-text dark:text-dark-text">
            1. Pick Audio
          </Text>
          <Text className="text-xs text-muted dark:text-dark-muted mt-1">
            Choose an MP3, WAV, or M4A from your device.
          </Text>
          <View className="mt-3">
            <Button
              label={audioFileName ? 'Replace Audio' : 'Choose Audio'}
              icon="cloud-upload-outline"
              variant="secondary"
              fullWidth
              onPress={handlePickAudio}
            />
          </View>
          {audioFileName ? (
            <View className="flex-row items-center mt-3">
              <Ionicons name="musical-note" size={16} color={colors.primary} />
              <Text
                className="text-xs text-text dark:text-dark-text ml-2 flex-1"
                numberOfLines={1}
              >
                {audioFileName}
              </Text>
            </View>
          ) : null}
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-semibold text-text dark:text-dark-text">
            2. Mark the Beat
          </Text>
          <Text className="text-xs text-muted dark:text-dark-muted mt-1">
            Tap the big pad on each beat, or auto-generate from BPM.
          </Text>
          <View className="mt-4">
            <BeatTapPad
              tapCount={taps.length}
              bpm={detectedBpm}
              onTap={handleTap}
              onUndo={handleUndo}
              onClear={handleClear}
            />
          </View>

          <View className="flex-row mt-4 space-x-3">
            <View className="flex-1">
              <Button
                label="Use Taps"
                icon="checkmark"
                variant="secondary"
                fullWidth
                onPress={handleBeatsFromTaps}
              />
            </View>
            <View className="flex-1">
              <Button
                label="From BPM"
                icon="speedometer-outline"
                variant="secondary"
                fullWidth
                onPress={handleGenerateFromBpm}
              />
            </View>
          </View>

          {beats.length > 0 ? (
            <Text className="text-xs text-muted dark:text-dark-muted mt-3 text-center">
              {beats.length} beat markers ready
            </Text>
          ) : null}
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-semibold text-text dark:text-dark-text">
            3. Song Details
          </Text>

          <Text className="text-xs text-muted dark:text-dark-muted mt-3">Title</Text>
          <TextInput
            value={metadata.title}
            onChangeText={(text) => setMetadata((m) => ({ ...m, title: text }))}
            placeholder="Song title"
            placeholderTextColor={colors.muted}
            className="mt-1 border border-border dark:border-dark-border rounded-lg px-3 py-2 text-text dark:text-dark-text"
          />

          <Text className="text-xs text-muted dark:text-dark-muted mt-3">Artist</Text>
          <TextInput
            value={metadata.artist}
            onChangeText={(text) => setMetadata((m) => ({ ...m, artist: text }))}
            placeholder="Artist name"
            placeholderTextColor={colors.muted}
            className="mt-1 border border-border dark:border-dark-border rounded-lg px-3 py-2 text-text dark:text-dark-text"
          />

          <Text className="text-xs text-muted dark:text-dark-muted mt-3">BPM</Text>
          <TextInput
            value={String(metadata.bpm)}
            onChangeText={(text) => {
              const parsed = Number(text);
              if (Number.isFinite(parsed) && parsed > 0) {
                setMetadata((m) => ({ ...m, bpm: parsed }));
              }
            }}
            keyboardType="numeric"
            placeholder="120"
            placeholderTextColor={colors.muted}
            className="mt-1 border border-border dark:border-dark-border rounded-lg px-3 py-2 text-text dark:text-dark-text"
          />

          <Text className="text-xs text-muted dark:text-dark-muted mt-3">Difficulty</Text>
          <View className="flex-row mt-2 space-x-2">
            {DIFFICULTIES.map((d) => {
              const active = d === metadata.difficulty;
              return (
                <Button
                  key={d}
                  label={DIFFICULTY_LABELS[d]}
                  variant={active ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => setMetadata((m) => ({ ...m, difficulty: d }))}
                />
              );
            })}
          </View>
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-semibold text-text dark:text-dark-text">
            4. Generate Chart
          </Text>
          <Text className="text-xs text-muted dark:text-dark-muted mt-1">
            Convert your beats into arrows based on difficulty.
          </Text>
          <View className="mt-3">
            <Button
              label="Generate Notes"
              icon="sparkles-outline"
              fullWidth
              onPress={handleGenerateChart}
            />
          </View>

          {notes.length > 0 ? (
            <View className="mt-4">
              <TimelineStrip
                notes={notes}
                durationMs={durationMs > 0 ? durationMs : 60000}
                cursorMs={0}
              />
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-xs text-muted dark:text-dark-muted">
                  {notes.length} notes
                </Text>
                <DifficultyBadge difficulty={metadata.difficulty} />
              </View>
            </View>
          ) : null}
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-semibold text-text dark:text-dark-text">
            5. Export & Publish
          </Text>
          <Text className="text-xs text-muted dark:text-dark-muted mt-1">
            Save to device, or upload directly to GitHub.
          </Text>
          <View className="mt-3">
            <Button
              label="Export to Device"
              icon="download-outline"
              fullWidth
              loading={busy}
              disabled={busy || notes.length === 0}
              onPress={handleExport}
            />
          </View>
          <View className="mt-3">
            <Button
              label="Publish to GitHub"
              icon="cloud-upload-outline"
              variant="secondary"
              fullWidth
              disabled={busy || notes.length === 0}
              onPress={handleOpenPublish}
            />
          </View>
          <Text className="text-[11px] text-muted dark:text-dark-muted mt-3">
            Files are written to app storage under StepByStep/exports/. Publishing
            uploads directly to the GitHub repo configured in the publish sheet.
          </Text>
        </Card>
      </ScrollView>

      <PublishToGitHubSheet
        visible={publishVisible}
        onClose={handleClosePublish}
        manifest={manifestForPublish}
        audioBase64={audioBase64ForPublish}
        audioExt={audioExtForPublish}
        coverBase64={null}
        coverExt="png"
      />
    </SafeAreaView>
  );
}