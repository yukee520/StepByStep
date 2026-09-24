import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { pick, types } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import Toast from 'react-native-toast-message';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import BeatTapPad from '@/components/BeatTapPad';
import TimelineStrip from '@/components/TimelineStrip';
import DifficultyBadge from '@/components/DifficultyBadge';
import PublishToGitHubSheet from '@/components/PublishToGitHubSheet';
import NeonBackground from '@/components/NeonBackground';
import { NEON_PALETTE } from '@/theme/colors';
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
import {
  BUILDER_ROOT,
  EXPORTS_ROOT,
  ensureLibraryDirs,
} from '@/services/songLibrary';
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  type Note,
} from '@/types/song';
import type { BeatMarker, BuilderMetadata } from '@/types/builder';
import { DEFAULT_BUILDER_METADATA } from '@/types/builder';
import type { SongPackManifest } from '@/types/songPack';
import { genId, slugify } from '@/utils/id';

type SectionLabelProps = {
  step: string;
  title: string;
  subtitle?: string;
};

function SectionLabel({ step, title, subtitle }: SectionLabelProps): React.ReactElement {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: 'rgba(0, 229, 255, 0.15)',
            borderWidth: 1,
            borderColor: NEON_PALETTE.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '900',
              color: NEON_PALETTE.primary,
            }}
          >
            {step}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: NEON_PALETTE.text,
          }}
        >
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text
          style={{
            fontSize: 12,
            color: NEON_PALETTE.textDim,
            marginTop: 6,
            marginLeft: 36,
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: InputFieldProps): React.ReactElement {
  return (
    <View style={{ marginTop: 12 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: NEON_PALETTE.textDim,
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={NEON_PALETTE.muted}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: 'rgba(0, 229, 255, 0.25)',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: NEON_PALETTE.text,
          backgroundColor: 'rgba(0, 229, 255, 0.05)',
        }}
      />
    </View>
  );
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '—';
  }
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function readAudioDurationMs(path: string): Promise<number> {
  return new Promise<number>((resolve) => {
    const sound = new Sound(path, '', (error) => {
      if (error) {
        resolve(0);
        return;
      }
      const seconds = sound.getDuration();
      sound.release();
      const ms = Math.round(seconds * 1000);
      resolve(ms);
    });
  });
}

const CHART_LEAD_IN_MS = 2000;

export default function BuilderScreen(): React.ReactElement {
  const [metadata, setMetadata] = useState<BuilderMetadata>(DEFAULT_BUILDER_METADATA);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [durationMs, setDurationMs] = useState<number>(0);
  const [durationDraft, setDurationDraft] = useState<string>('');
  const [taps, setTaps] = useState<number[]>([]);
  const [beats, setBeats] = useState<BeatMarker[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [busy, setBusy] = useState<boolean>(false);

  const [manifestForPublish, setManifestForPublish] = useState<SongPackManifest | null>(null);
  const [audioBase64ForPublish, setAudioBase64ForPublish] = useState<string | null>(null);
  const [audioExtForPublish, setAudioExtForPublish] = useState<string>('mp3');
  const [audioSizeForPublish, setAudioSizeForPublish] = useState<number>(0);
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
        result.fileCopyUri?.replace('file://', '') ??
        result.uri.replace('file://', '');
      await RNFS.copyFile(srcPath, target);

      setAudioPath(target);
      setAudioFileName(result.name ?? 'audio');

      const detected = await readAudioDurationMs(target);
      if (detected > 0) {
        setDurationMs(detected);
        setDurationDraft(String(Math.round(detected / 1000)));
        Toast.show({
          type: 'success',
          text1: 'Audio loaded',
          text2: `${formatDuration(detected)} · ${result.name ?? 'track'}`,
          position: 'bottom',
        });
      } else {
        setDurationMs(0);
        setDurationDraft('');
        Toast.show({
          type: 'info',
          text1: 'Audio loaded, duration unknown',
          text2: 'Enter the seconds manually below',
          position: 'bottom',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not pick audio',
        position: 'bottom',
      });
    }
  }, []);

  const handleApplyDuration = useCallback((): void => {
    const parsed = Number(durationDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Toast.show({
        type: 'info',
        text1: 'Enter a positive number of seconds',
        position: 'bottom',
      });
      return;
    }
    const ms = Math.round(parsed * 1000);
    setDurationMs(ms);
    Toast.show({
      type: 'success',
      text1: 'Duration set',
      text2: formatDuration(ms),
      position: 'bottom',
    });
  }, [durationDraft]);

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
      Toast.show({
        type: 'info',
        text1: 'Tap at least twice',
        position: 'bottom',
      });
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
      Toast.show({
        type: 'info',
        text1: 'Generate beats first',
        position: 'bottom',
      });
      return;
    }
    const dur = durationMs > 0 ? durationMs : 60000;
    const songId = metadata.id.trim() || slugify(metadata.title || 'untitled');
    const chart = generateChart(beats, {
      difficulty: metadata.difficulty,
      bpm: metadata.bpm,
      offsetMs: metadata.offsetMs,
      startAtMs: CHART_LEAD_IN_MS,
      endAtMs: dur,
      includeDoubles:
        metadata.difficulty === 'hard' || metadata.difficulty === 'expert',
      songId,
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
      await RNFS.writeFile(
        manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf8',
      );

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
    let size = 0;
    if (audioPath) {
      try {
        const stat = await RNFS.stat(audioPath);
        size = Number(stat.size) || 0;
        audioBase64 = await RNFS.readFile(audioPath, 'base64');
        ext = audioPath.split('.').pop() ?? 'mp3';
      } catch {
        audioBase64 = null;
        size = 0;
      }
    }

    setManifestForPublish(manifest);
    setAudioBase64ForPublish(audioBase64);
    setAudioExtForPublish(ext);
    setAudioSizeForPublish(size);
    setPublishVisible(true);
  }, [audioPath, buildManifest]);

  const handleClosePublish = useCallback((): void => {
    setPublishVisible(false);
  }, []);

  const chartReady = notes.length > 0;

  return (
    <NeonBackground showGrid={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          title="Chart Builder"
          subtitle="Turn any song into a playable chart"
        />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <SectionLabel
              step="1"
              title="Pick Audio"
              subtitle="Choose an MP3, WAV, M4A, or OGG from your device."
            />
            <Button
              label={audioFileName ? 'Replace Audio' : 'Choose Audio'}
              icon="cloud-upload-outline"
              variant="secondary"
              fullWidth
              onPress={handlePickAudio}
            />
            {audioFileName ? (
              <View
                style={{
                  marginTop: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: 'rgba(0, 229, 255, 0.08)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name="musical-note"
                    size={16}
                    color={NEON_PALETTE.primary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: NEON_PALETTE.text,
                      marginLeft: 8,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {audioFileName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: NEON_PALETTE.primary,
                      fontWeight: '700',
                    }}
                  >
                    {formatDuration(durationMs)}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: NEON_PALETTE.textDim,
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                DURATION (SECONDS)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={durationDraft}
                  onChangeText={setDurationDraft}
                  placeholder="e.g. 185"
                  placeholderTextColor={NEON_PALETTE.muted}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 229, 255, 0.25)',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: NEON_PALETTE.text,
                    backgroundColor: 'rgba(0, 229, 255, 0.05)',
                  }}
                />
                <Button
                  label="Apply"
                  variant="secondary"
                  onPress={handleApplyDuration}
                />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: NEON_PALETTE.textDim,
                  marginTop: 6,
                }}
              >
                Auto-detected: {formatDuration(durationMs)}
                {durationMs > 0
                  ? ` (${Math.round(durationMs / 1000)}s)`
                  : ' — override if wrong'}
              </Text>
            </View>
          </Card>

          <View style={{ marginTop: 16 }}>
            <Card>
              <SectionLabel
                step="2"
                title="Mark the Beat"
                subtitle="Tap the pad on each beat, or auto-generate from BPM."
              />
              <BeatTapPad
                tapCount={taps.length}
                bpm={detectedBpm}
                onTap={handleTap}
                onUndo={handleUndo}
                onClear={handleClear}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Use Taps"
                    icon="checkmark"
                    variant="secondary"
                    fullWidth
                    onPress={handleBeatsFromTaps}
                  />
                </View>
                <View style={{ flex: 1 }}>
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
                <Text
                  style={{
                    fontSize: 12,
                    color: NEON_PALETTE.primary,
                    textAlign: 'center',
                    marginTop: 12,
                    fontWeight: '700',
                  }}
                >
                  {beats.length} beat markers ready
                </Text>
              ) : null}
            </Card>
          </View>

          <View style={{ marginTop: 16 }}>
            <Card>
              <SectionLabel step="3" title="Song Details" />

              <InputField
                label="Title"
                value={metadata.title}
                onChangeText={(text) =>
                  setMetadata((m) => ({ ...m, title: text }))
                }
                placeholder="Song title"
              />
              <InputField
                label="Artist"
                value={metadata.artist}
                onChangeText={(text) =>
                  setMetadata((m) => ({ ...m, artist: text }))
                }
                placeholder="Artist name"
              />
              <InputField
                label="BPM"
                value={String(metadata.bpm)}
                onChangeText={(text) => {
                  const parsed = Number(text);
                  if (Number.isFinite(parsed) && parsed > 0) {
                    setMetadata((m) => ({ ...m, bpm: parsed }));
                  } else if (text === '') {
                    setMetadata((m) => ({ ...m, bpm: 0 }));
                  }
                }}
                placeholder="120"
                keyboardType="numeric"
              />

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: NEON_PALETTE.textDim,
                  letterSpacing: 1,
                  marginTop: 16,
                  marginBottom: 8,
                }}
              >
                DIFFICULTY
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DIFFICULTIES.map((d) => {
                  const active = d === metadata.difficulty;
                  return (
                    <Button
                      key={d}
                      label={DIFFICULTY_LABELS[d]}
                      variant={active ? 'primary' : 'secondary'}
                      size="sm"
                      onPress={() =>
                        setMetadata((m) => ({ ...m, difficulty: d }))
                      }
                    />
                  );
                })}
              </View>
            </Card>
          </View>

          <View style={{ marginTop: 16 }}>
            <Card>
              <SectionLabel
                step="4"
                title="Generate Chart"
                subtitle="Convert your beats into arrows based on difficulty."
              />
              <Button
                label="Generate Notes"
                icon="sparkles-outline"
                fullWidth
                onPress={handleGenerateChart}
              />
              {chartReady ? (
                <View style={{ marginTop: 16 }}>
                  <TimelineStrip
                    notes={notes}
                    durationMs={durationMs > 0 ? durationMs : 60000}
                    cursorMs={0}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: NEON_PALETTE.textDim,
                      }}
                    >
                      {notes.length} notes · {formatDuration(durationMs)}
                    </Text>
                    <DifficultyBadge difficulty={metadata.difficulty} />
                  </View>
                </View>
              ) : null}
            </Card>
          </View>

          <View style={{ marginTop: 16 }}>
            <Card>
              <SectionLabel
                step="5"
                title="Export & Publish"
                subtitle="Save to device, or upload to GitHub."
              />
              <Button
                label="Export to Device"
                icon="download-outline"
                fullWidth
                loading={busy}
                disabled={busy || !chartReady}
                onPress={handleExport}
              />
              <View style={{ marginTop: 12 }}>
                <Button
                  label="Publish to GitHub"
                  icon="cloud-upload-outline"
                  variant="secondary"
                  fullWidth
                  disabled={busy || !chartReady}
                  onPress={handleOpenPublish}
                />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: NEON_PALETTE.textDim,
                  marginTop: 12,
                  lineHeight: 16,
                }}
              >
                Publishing uploads the manifest, audio, and updates the pack
                index so any player can download the song without reinstalling
                the app.
              </Text>
            </Card>
          </View>
        </ScrollView>

        <PublishToGitHubSheet
          visible={publishVisible}
          onClose={handleClosePublish}
          manifest={manifestForPublish}
          audioBase64={audioBase64ForPublish}
          audioExt={audioExtForPublish}
          audioSizeBytes={audioSizeForPublish}
          coverBase64={null}
          coverExt="png"
        />
      </SafeAreaView>
    </NeonBackground>
  );
}