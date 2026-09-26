// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/hooks/useTheme';
import HomeScreen from '@/screens/HomeScreen';
import LibraryScreen from '@/screens/LibraryScreen';
import SongSelectScreen from '@/screens/SongSelectScreen';
import SongPackStoreScreen from '@/screens/SongPackStoreScreen';
import SongPackDetailScreen from '@/screens/SongPackDetailScreen';
import GameScreen from '@/screens/GameScreen';
import ResultsScreen from '@/screens/ResultsScreen';
import BuilderScreen from '@/screens/BuilderScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import HowToPlayScreen from '@/screens/HowToPlayScreen';
import OverlapSimulatorScreen from '@/screens/OverlapSimulatorScreen';
import type { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator(): React.ReactElement {
  const { isDark, colors } = useTheme();

  const navTheme: Theme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Library" component={LibraryScreen} />
        <Stack.Screen name="SongSelect" component={SongSelectScreen} />
        <Stack.Screen name="SongPackStore" component={SongPackStoreScreen} />
        <Stack.Screen name="SongPackDetail" component={SongPackDetailScreen} />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen name="Builder" component={BuilderScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
        <Stack.Screen
          name="OverlapSimulator"
          component={OverlapSimulatorScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}