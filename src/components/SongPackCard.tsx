import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DifficultyBadge from '@/components/DifficultyBadge';
import DownloadProgress from '@/components/DownloadProgress';
import { useTheme } from '@/hooks/useTheme';
import { formatBytes } from '@/utils/formatting';
import type { InstalledPack, PackDownloadState, RemotePackEntry } from '@/types/songPack';

export type SongPackCardProps = {
  entry: RemotePackEntry;
  installed?: InstalledPack;
  download?: PackDownloadState | null;
  onPress: (entry: RemotePackEntry) => void;
};

export default function SongPackCard({
  entry,
  installed,
  download,
  onPress,
}: SongPackCardProps): React.ReactElement {
  const { colors } = useTheme();
  const isInstalled = installed !== undefined;
  const needsUpdate = isInstalled && installed.version < entry.version;
  const isDownloading =
    download !== undefined &&
    download !== null &&
    download.phase !== 'idle' &&
    download.phase !== 'done' &&
    download.phase !== 'error' &&
    download.phase !== 'cancelled';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.title} by ${entry.artist}`}
      onPress={() => onPress(entry)}
      className="bg-card dark:bg-dark-card rounded-2xl border border-border dark:border-dark-border mb-3 p-4 active:opacity-90"
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 items-center justify-center mr-3">
          <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
        </View>

        <View className="flex-1">
          <Text
            className="text-base font-semibold text-text dark:text-dark-text"
            numberOfLines={1}
          >
            {entry.title}
          </Text>
          <Text
            className="text-xs text-muted dark:text-dark-muted mt-0.5"
            numberOfLines={1}
          >
            {entry.artist} · {entry.bpm} BPM
          </Text>

          <View className="flex-row items-center mt-2">
            <DifficultyBadge difficulty={entry.difficulty} />
            <Text className="text-[11px] text-muted dark:text-dark-muted ml-2">
              {formatBytes(entry.sizeBytes)}
            </Text>
            {isInstalled ? (
              <View className="flex-row items-center ml-3">
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text className="text-[11px] text-success ml-1">
                  {needsUpdate ? 'Update available' : 'Installed'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>

      {isDownloading && download ? (
        <View className="mt-3">
          <DownloadProgress state={download} />
        </View>
      ) : null}
    </Pressable>
  );
}