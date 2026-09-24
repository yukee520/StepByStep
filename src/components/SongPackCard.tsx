import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DifficultyBadge from '@/components/DifficultyBadge';
import DownloadProgress from '@/components/DownloadProgress';
import { formatBytes } from '@/utils/formatting';
import { NEON_PALETTE } from '@/theme/colors';
import type {
  InstalledPack,
  PackDownloadState,
  RemotePackEntry,
} from '@/types/songPack';

export type SongPackCardProps = {
  entry: RemotePackEntry;
  installed?: InstalledPack;
  download?: PackDownloadState | null;
  onPress: (entry: RemotePackEntry) => void;
};

const CARD_BG = '#1A0B2E';
const CARD_BORDER = 'rgba(0, 229, 255, 0.22)';

export default function SongPackCard({
  entry,
  installed,
  download,
  onPress,
}: SongPackCardProps): React.ReactElement {
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
      android_ripple={{ color: 'rgba(0, 229, 255, 0.12)' }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#241243' : CARD_BG,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: pressed ? NEON_PALETTE.primary : CARD_BORDER,
        marginBottom: 12,
        padding: 14,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: 'rgba(0, 229, 255, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons
            name="cloud-download-outline"
            size={22}
            color={NEON_PALETTE.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: NEON_PALETTE.text,
            }}
            numberOfLines={1}
          >
            {entry.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: NEON_PALETTE.textDim,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {entry.artist} · {entry.bpm} BPM
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              flexWrap: 'wrap',
            }}
          >
            <DifficultyBadge difficulty={entry.difficulty} />
            <Text
              style={{
                fontSize: 11,
                color: NEON_PALETTE.textDim,
                marginLeft: 8,
              }}
            >
              {formatBytes(entry.sizeBytes)}
            </Text>
            {isInstalled ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 12,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={NEON_PALETTE.success}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: NEON_PALETTE.success,
                    marginLeft: 4,
                  }}
                >
                  {needsUpdate ? 'Update available' : 'Installed'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={NEON_PALETTE.textDim}
        />
      </View>

      {isDownloading && download ? (
        <View style={{ marginTop: 12 }}>
          <DownloadProgress state={download} />
        </View>
      ) : null}
    </Pressable>
  );
}