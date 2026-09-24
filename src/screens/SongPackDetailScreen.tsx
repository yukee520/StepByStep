import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import DifficultyBadge from '@/components/DifficultyBadge';
import DownloadProgress from '@/components/DownloadProgress';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import NeonBackground from '@/components/NeonBackground';
import { NEON_PALETTE } from '@/theme/colors';
import { usePackDownload } from '@/hooks/usePackDownload';
import { uninstallPack } from '@/services/packInstaller';
import { usePacksStore } from '@/store/usePacksStore';
import { formatBytes, formatDate } from '@/utils/formatting';
import type { RootStackParamList } from '@/types/navigation';

type DetailRoute = RouteProp<RootStackParamList, 'SongPackDetail'>;

type RowProps = {
  label: string;
  value: string;
};

function Row({ label, value }: RowProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
      }}
    >
      <Text style={{ fontSize: 13, color: NEON_PALETTE.textDim }}>{label}</Text>
      <Text
        style={{
          fontSize: 13,
          color: NEON_PALETTE.text,
          flexShrink: 1,
          textAlign: 'right',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export default function SongPackDetailScreen(): React.ReactElement {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const packId = route.params.packId;

  const entry = usePacksStore((s) => s.remoteIndex.find((e) => e.id === packId));
  const installed = usePacksStore((s) => s.installed[packId]);
  const removeInstalled = usePacksStore((s) => s.removeInstalled);
  const { download, isDownloading, error, start, reset } = usePackDownload(packId);

  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const statusLabel = useMemo((): string => {
    if (!installed) {
      return 'Not installed';
    }
    if (entry && installed.version < entry.version) {
      return `Update available · v${installed.version} → v${entry.version}`;
    }
    return `Installed · v${installed.version}`;
  }, [entry, installed]);

  const handleInstall = useCallback(async (): Promise<void> => {
    if (!entry) {
      return;
    }
    setBusy(true);
    await start(entry);
    setBusy(false);
  }, [entry, start]);

  const handleUninstall = useCallback((): void => {
    Alert.alert(
      'Remove song pack?',
      'The audio and chart files will be deleted from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const ok = await uninstallPack(packId);
            if (ok) {
              removeInstalled(packId);
            }
            setBusy(false);
          },
        },
      ],
    );
  }, [packId, removeInstalled]);

  if (!entry) {
    return (
      <NeonBackground showGrid={false}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScreenHeader title="Song Pack" />
          <EmptyState
            fullscreen
            icon="alert-circle-outline"
            title="Pack not found"
            message="Refresh the song pack list and try again."
          />
        </SafeAreaView>
      </NeonBackground>
    );
  }

  const needsUpdate =
    installed !== undefined && installed.version < entry.version;
  const canInstall = !installed || needsUpdate;

  return (
    <NeonBackground showGrid={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Song Pack" subtitle={entry.title} />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  backgroundColor: 'rgba(0, 229, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="musical-notes"
                  size={30}
                  color={NEON_PALETTE.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '800',
                    color: NEON_PALETTE.text,
                  }}
                >
                  {entry.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: NEON_PALETTE.textDim,
                    marginTop: 2,
                  }}
                >
                  {entry.artist}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <DifficultyBadge difficulty={entry.difficulty} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: NEON_PALETTE.textDim,
                      marginLeft: 8,
                    }}
                  >
                    {entry.bpm} BPM · {formatBytes(entry.sizeBytes)}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(0, 229, 255, 0.12)',
              }}
            >
              <Row label="Status" value={statusLabel} />
              <Row label="Pack version" value={`v${entry.version}`} />
              {installed ? (
                <Row label="Installed on" value={formatDate(installed.installedAt)} />
              ) : null}
            </View>
          </Card>

          {download ? (
            <View style={{ marginTop: 16 }}>
              <Card>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: NEON_PALETTE.text,
                    marginBottom: 8,
                  }}
                >
                  Download
                </Text>
                <DownloadProgress state={download} />
                {error ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: NEON_PALETTE.danger,
                      marginTop: 8,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}
              </Card>
            </View>
          ) : null}

          <View style={{ marginTop: 24, gap: 12 }}>
            {isDownloading ? (
              <LoadingState label="Downloading…" />
            ) : canInstall ? (
              <Button
                label={needsUpdate ? 'Update Pack' : 'Download & Install'}
                icon="cloud-download-outline"
                size="lg"
                fullWidth
                loading={busy}
                disabled={busy}
                onPress={handleInstall}
              />
            ) : (
              <Button
                label="Play Now"
                icon="play"
                size="lg"
                fullWidth
                onPress={() => {
                  navigation.navigate(
                    'Game' as never,
                    { songId: entry.id } as never,
                  );
                }}
              />
            )}

            {installed ? (
              <Button
                label="Remove Pack"
                icon="trash-outline"
                variant="danger"
                size="lg"
                fullWidth
                disabled={busy}
                onPress={handleUninstall}
              />
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </NeonBackground>
  );
}