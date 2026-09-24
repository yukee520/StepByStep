import React from 'react';
import { Text, View } from 'react-native';
import type { PackDownloadState } from '@/types/songPack';
import { formatBytes } from '@/utils/formatting';
import { NEON_PALETTE } from '@/theme/colors';

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: isError ? NEON_PALETTE.danger : NEON_PALETTE.text,
            flexShrink: 1,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: NEON_PALETTE.textDim }}>
          {Math.round(pct * 100)}%
        </Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(0, 229, 255, 0.15)',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            backgroundColor: isError ? NEON_PALETTE.danger : NEON_PALETTE.primary,
          }}
        />
      </View>

      {showBytes && state.totalBytes > 0 && !isError ? (
        <Text
          style={{
            fontSize: 11,
            color: NEON_PALETTE.textDim,
            marginTop: 6,
          }}
        >
          {formatBytes(state.bytesWritten)} / {formatBytes(state.totalBytes)}
        </Text>
      ) : null}
    </View>
  );
}