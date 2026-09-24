import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useDevLogStore, type DevLogLevel } from '@/store/useDevLogStore';
import { NEON_PALETTE } from '@/theme/colors';

function levelColor(level: DevLogLevel): string {
  switch (level) {
    case 'error':
      return NEON_PALETTE.danger;
    case 'warn':
      return NEON_PALETTE.warning;
    case 'success':
      return NEON_PALETTE.success;
    case 'info':
    default:
      return NEON_PALETTE.primary;
  }
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export type DevLogOverlayProps = {
  onClose?: () => void;
};

export default function DevLogOverlay({
  onClose,
}: DevLogOverlayProps): React.ReactElement | null {
  const entries = useDevLogStore((s) => s.entries);
  const visible = useDevLogStore((s) => s.visible);
  const clear = useDevLogStore((s) => s.clear);

  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        top: 80,
        maxHeight: 260,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: NEON_PALETTE.primary,
        padding: 8,
        zIndex: 9999,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: '900',
            color: NEON_PALETTE.primary,
            letterSpacing: 1,
          }}
        >
          DEV LOG ({entries.length})
        </Text>
        <Pressable
          onPress={clear}
          style={{ paddingHorizontal: 8, paddingVertical: 2 }}
        >
          <Text style={{ fontSize: 10, color: NEON_PALETTE.textDim }}>clear</Text>
        </Pressable>
        {onClose ? (
          <Pressable
            onPress={onClose}
            style={{ paddingHorizontal: 8, paddingVertical: 2 }}
          >
            <Text style={{ fontSize: 10, color: NEON_PALETTE.danger }}>hide</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={{ maxHeight: 210 }} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <Text style={{ fontSize: 10, color: NEON_PALETTE.textDim, padding: 4 }}>
            (no logs yet)
          </Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={{ marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 9,
                  color: NEON_PALETTE.textDim,
                  fontFamily: 'monospace',
                }}
              >
                {formatTs(entry.ts)} [{entry.tag}]
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: levelColor(entry.level),
                  fontFamily: 'monospace',
                }}
              >
                {entry.message}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}