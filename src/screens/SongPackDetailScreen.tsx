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
import { usePackDownload } from '@/hooks/usePackDownload';
import { useTheme } from '@/hooks/useTheme';
import { uninstallPack } from '@/services/packInstaller';
import { usePacksStore } from '@/store/usePacksStore';
import { formatBytes, formatDate } from '@/utils/formatting';
import type { RootStackParamList } from '@/types/navigation';

type DetailRoute = RouteProp<RootStackParamList, 'SongPackDetail'>;

export default function SongPackDetailScreen(): React.ReactElement {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const { colors } = useTheme();
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
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
        <ScreenHeader title="Song Pack" />
        <EmptyState
          fullscreen
          icon="alert-circle-outline"
          title="Pack not found"
          message="Refresh the song pack list and try again."
        />
      </SafeAreaView>
    );
  }

  const needsUpdate = installed !== undefined && installed.version < entry.version;
  const canInstall = !installed || needsUpdate;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <ScreenHeader title="Song Pack" subtitle={entry.title} />

      <ScrollView contentContainerClassName="px-4 pb-8" showsVerticalScrollIndicator={false}>
        <Card>
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-primary/15 items-center justify-center">
              <Ionicons name="musical-notes" size={30} color={colors.primary} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-xl font-bold text-text dark:text-dark-text">
                {entry.title}
              </Text>
              <Text className="text-sm text-muted dark:text-dark-muted mt-0.5">
                {entry.artist}
              </Text>
              <View className="flex-row items-center mt-2">
                <DifficultyBadge difficulty={entry.difficulty} />
                <Text className="text-xs text-muted dark:text-dark-muted ml-2">
                  {entry.bpm} BPM · {formatBytes(entry.sizeBytes)}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 border-t border-border dark:border-dark-border pt-3">
            <Row label="Status" value={statusLabel} />
            <Row label="Pack version" value={`v${entry.version}`} />
            {installed ? (
              <Row label="Installed on" value={formatDate(installed.installedAt)} />
            ) : null}
          </View>
        </Card>

        {download ? (
          <View className="mt-4">
            <Card>
              <Text className="text-sm font-semibold text-text dark:text-dark-text mb-2">
                Download
              </Text>
              <DownloadProgress state={download} />
              {error ? (
                <Text className="text-xs text-danger dark:text-danger mt-2">{error}</Text>
              ) : null}
            </Card>
          </View>
        ) : null}

        <View className="mt-6 space-y-3">
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
                navigation.navigate('Game' as never, { songId: entry.id } as never);
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
  );
}

type RowProps = {
  label: string;
  value: string;
};

function Row({ label, value }: RowProps): React.ReactElement {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-muted dark:text-dark-muted">{label}</Text>
      <Text className="text-sm text-text dark:text-dark-text" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}