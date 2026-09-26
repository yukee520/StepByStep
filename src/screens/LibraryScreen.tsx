// src/screens/LibraryScreen.tsx
import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '@/components/ScreenHeader';
import NeonBackground from '@/components/NeonBackground';
import { NEON_PALETTE } from '@/theme/colors';
import { usePacksStore } from '@/store/usePacksStore';
import { useDevModeStore } from '@/store/useDevModeStore';
import type { RootStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Library'>;

type MenuItemProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

const CARD_BG = '#1A0B2E';
const CARD_BORDER = 'rgba(0, 229, 255, 0.22)';

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
}: MenuItemProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0, 229, 255, 0.12)' }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 18,
        backgroundColor: pressed ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
      })}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: 'rgba(0, 229, 255, 0.15)',
          borderWidth: 1,
          borderColor: 'rgba(0, 229, 255, 0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Ionicons name={icon} size={22} color={NEON_PALETTE.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: NEON_PALETTE.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: NEON_PALETTE.textDim,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={NEON_PALETTE.primary}
      />
    </Pressable>
  );
}

function Divider(): React.ReactElement {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: 'rgba(0, 229, 255, 0.15)',
        marginHorizontal: 18,
      }}
    />
  );
}

export default function LibraryScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const installed = usePacksStore((s) => s.installed);
  const devModeEnabled = useDevModeStore((s) => s.enabled);
  const packCount = Object.keys(installed).length;

  const goPacks = useCallback((): void => {
    navigation.navigate('SongPackStore');
  }, [navigation]);
  const goBuilder = useCallback((): void => {
    navigation.navigate('Builder');
  }, [navigation]);
  const goHelp = useCallback((): void => {
    navigation.navigate('HowToPlay');
  }, [navigation]);
  const goSettings = useCallback((): void => {
    navigation.navigate('Settings');
  }, [navigation]);
  const goOverlapSimulator = useCallback((): void => {
    navigation.navigate('OverlapSimulator');
  }, [navigation]);

  return (
    <NeonBackground showGrid>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Library" subtitle="Everything else" />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: CARD_BG,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              overflow: 'hidden',
            }}
          >
            <MenuItem
              icon="cloud-download-outline"
              title="Song Packs"
              subtitle={
                packCount > 0
                  ? `${packCount} pack${packCount > 1 ? 's' : ''} installed`
                  : 'Download new songs'
              }
              onPress={goPacks}
            />

            {devModeEnabled ? (
              <>
                <Divider />
                <MenuItem
                  icon="construct-outline"
                  title="Chart Builder"
                  subtitle="Create a chart from your own music"
                  onPress={goBuilder}
                />
                <Divider />
                <MenuItem
                  icon="analytics-outline"
                  title="Overlap Simulator"
                  subtitle="Tune judgment windows by pixel overlap"
                  onPress={goOverlapSimulator}
                />
              </>
            ) : null}

            <Divider />
            <MenuItem
              icon="help-circle-outline"
              title="How to Play"
              subtitle="Learn the four directions and timing"
              onPress={goHelp}
            />
            <Divider />
            <MenuItem
              icon="settings-outline"
              title="Settings"
              subtitle="Note speed, offset, sound, theme"
              onPress={goSettings}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </NeonBackground>
  );
}