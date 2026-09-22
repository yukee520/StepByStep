import React, { useCallback } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '@/components/ScreenHeader';
import SongListItem from '@/components/SongListItem';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { useSongs } from '@/hooks/useSongs';
import { useScoresStore } from '@/store/useScoresStore';
import type { Song } from '@/types/song';
import type { RootStackParamList } from '@/types/navigation';

type SongSelectNavigation = NativeStackNavigationProp<RootStackParamList, 'SongSelect'>;

export default function SongSelectScreen(): React.ReactElement {
  const navigation = useNavigation<SongSelectNavigation>();
  const { songs, isLoading, isError, error, isRefetching, refetch } = useSongs();
  const scores = useScoresStore((s) => s.scores);

  const handlePress = useCallback(
    (song: Song): void => {
      navigation.navigate('Game', { songId: song.id });
    },
    [navigation],
  );

  const handleRefresh = useCallback((): void => {
    void refetch();
  }, [refetch]);

  const goPacks = useCallback((): void => {
    navigation.navigate('SongPackStore');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongListItem song={item} highScore={scores[item.id]} onPress={handlePress} />
    ),
    [handlePress, scores],
  );

  const keyExtractor = useCallback((item: Song): string => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <ScreenHeader
        title="Song List"
        subtitle={`${songs.length} song${songs.length === 1 ? '' : 's'}`}
        rightIcon="cloud-download-outline"
        rightAccessibilityLabel="Open song packs"
        onRightPress={goPacks}
      />

      {isLoading ? (
        <LoadingState fullscreen label="Loading songs…" />
      ) : isError ? (
        <ErrorState
          fullscreen
          title="Could not load songs"
          message={error?.message ?? 'Please try again.'}
          onRetry={handleRefresh}
        />
      ) : songs.length === 0 ? (
        <EmptyState
          fullscreen
          icon="musical-notes-outline"
          title="No songs yet"
          message="Download a song pack to get started."
          actionLabel="Open Song Packs"
          onAction={goPacks}
        />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerClassName="px-4 pb-8 pt-2"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          ListFooterComponent={
            <View className="mt-4">
              <Button
                label="Get more songs"
                icon="cloud-download-outline"
                variant="secondary"
                fullWidth
                onPress={goPacks}
              />
            </View>
          }
          ListEmptyComponent={
            <Text className="text-sm text-muted dark:text-dark-muted text-center mt-6">
              No songs match.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}