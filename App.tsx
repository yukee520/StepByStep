import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import RootNavigator from '@/navigation/RootNavigator';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useScoresStore } from '@/store/useScoresStore';
import { usePacksStore } from '@/store/usePacksStore';
import './global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App(): React.ReactElement {
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const scoresHydrated = useScoresStore((s) => s.hydrated);
  const packsHydrated = usePacksStore((s) => s.hydrated);

  const [bootFallbackElapsed, setBootFallbackElapsed] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setBootFallbackElapsed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const ready =
    (settingsHydrated && scoresHydrated && packsHydrated) || bootFallbackElapsed;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {ready ? (
            <RootNavigator />
          ) : (
            <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background">
              <ActivityIndicator size="large" />
            </View>
          )}
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}