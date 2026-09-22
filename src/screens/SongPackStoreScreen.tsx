import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '@/components/ScreenHeader';
import SongPackCard from '@/components/SongPackCard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { fetchRemoteIndex } from '@/api/songPacks';
import { usePacksStore } from '@/store/usePacksStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { RemotePackEntry } from '@/types/songPack';
import type { RootStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SongPackStore'>;

export default function SongPackStoreScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const indexUrl = useSettingsStore((s) => s.settings.packIndexUrl);
  const remoteIndex = usePacksStore((s) => s.remoteIndex);
  const setRemoteIndex = usePacksStore((s) => s.setRemoteIndex);
  const installed = usePacksStore((s) => s.installed);
  const downloads = usePacksStore((s) => s.downloads);

  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const loadIndex = useCallback(
    async (isRefresh: boolean): Promise<void> => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const index = await fetchRemoteIndex(indexUrl);
        setRemoteIndex(index.packs);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not reach the song server.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setHasLoaded(true);
      }
    },
    [indexUrl, setRemoteIndex],
  );

  useEffect(() => {
    if (!hasLoaded) {
      void loadIndex(false);
    }
  }, [hasLoaded, loadIndex]);

  const handlePress = useCallback(
    (entry: RemotePackEntry): void => {
      navigation.navigate('SongPackDetail', { packId: entry.id });
    },
    [navigation],
  );

  const handleRefresh = useCallback((): void => {
    void loadIndex(true);
  }, [loadIndex]);

  const renderItem = useCallback(
    ({ item }: { item: RemotePackEntry }) => (
      <SongPackCard
        entry={item}
        installed={installed[item.id]}
        download={downloads[item.id] ?? null}
        onPress={handlePress}
      />
    ),
    [downloads, handlePress, installed],
  );

  const keyExtractor = useCallback((item: RemotePackEntry): string => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <ScreenHeader
        title="Song Packs"
        subtitle={indexUrl.replace(/^https?:\/\//, '').slice(0, 36)}
        rightIcon="refresh"
        rightAccessibilityLabel="Refresh packs"
        onRightPress={handleRefresh}
      />

      {loading && !hasLoaded ? (
        <LoadingState fullscreen label="Fetching pack index…" />
      ) : error && remoteIndex.length === 0 ? (
        <ErrorState
          fullscreen
          title="Could not load song packs"
          message={error}
          onRetry={handleRefresh}
        />
      ) : remoteIndex.length === 0 ? (
        <EmptyState
          fullscreen
          icon="cloud-offline-outline"
          title="No song packs available"
          message="Check back later, or change the index URL in Settings."
        />
      ) : (
        <FlatList
          data={remoteIndex}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerClassName="px-4 pb-8 pt-2"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            error ? (
              <View className="mb-3 rounded-xl bg-danger/10 px-3 py-2">
                <Text className="text-xs text-danger dark:text-danger">{error}</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}