import React from 'react';
import { Text, View } from 'react-native';
import type { PackDownloadState } from '@/types/songPack';
import { formatBytes } from '@/utils/formatting';

export type DownloadProgressProps = {
  state: PackDownloadState;
  showBytes?: boolean;
};

function phaseLabel(state: PackDownloadState): string {
  switch (state.phase) {
    case 'queued':
      return 'Queued';
    case 'manifest':
      return 'Fetching manifest';
    case 'audio':
      return 'Downloading audio';
    case 'cover':
      return 'Downloading cover';
    case 'saving':
      return 'Finalizing';
    case 'done':
      return 'Done';
    case 'error':
      return state.message ?? 'Download failed';
    case 'cancelled':
      return 'Cancelled';
    case 'idle':
    default:
      return 'Preparing';
  }
}

export default function DownloadProgress({
  state,
  showBytes = true,
}: DownloadProgressProps): React.ReactElement {
  const pct = Math.max(0, Math.min(1, state.progress));
  const label = phaseLabel(state);
  const isError = state.phase === 'error';

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text
          className={[
            'text-xs font-medium',
            isError
              ? 'text-danger dark:text-danger'
              : 'text-text dark:text-dark-text',
          ].join(' ')}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text className="text-xs text-muted dark:text-dark-muted">
          {Math.round(pct * 100)}%
        </Text>
      </View>

      <View className="h-2 rounded-full bg-border dark:bg-dark-border overflow-hidden">
        <View
          className={isError ? 'bg-danger h-full' : 'bg-primary h-full'}
          style={{ width: `${pct * 100}%` }}
        />
      </View>

      {showBytes && state.totalBytes > 0 && !isError ? (
        <Text className="text-[11px] text-muted dark:text-dark-muted mt-1">
          {formatBytes(state.bytesWritten)} / {formatBytes(state.totalBytes)}
        </Text>
      ) : null}
    </View>
  );
}