// src/components/DevLogOverlay.tsx
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { clearLog, subscribeLog } from '@/store/devLogBus';

export type DevLogOverlayProps = {
  visible: boolean;
};

export default function DevLogOverlay({
  visible,
}: DevLogOverlayProps): React.ReactElement | null {
  const [lines, setLines] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) return undefined;
    const unsubscribe = subscribeLog((next) => {
      setLines(next);
    });
    return unsubscribe;
  }, [visible]);

  if (!visible) return null;

  // Default: compact strip at the top. Tap "EXPAND" to grow it to full screen
  // (which will cover the buttons — only do that when you're not pressing).
  const height = expanded ? 420 : 160;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 40,
        left: 4,
        right: 4,
        height,
        zIndex: 9999,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderColor: '#00E5FF',
          borderWidth: 1,
          borderRadius: 8,
          padding: 4,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
            paddingHorizontal: 4,
          }}
        >
          <Text style={styles.headerText}>LOG ({lines.length})</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
              <Text style={styles.headerText}>
                {expanded ? 'SHRINK' : 'EXPAND'}
              </Text>
            </Pressable>
            <Pressable onPress={clearLog} hitSlop={8}>
              <Text style={styles.clearText}>CLEAR</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 4 }}
        >
          {lines.length === 0 ? (
            <Text style={styles.emptyText}>— no events yet —</Text>
          ) : (
            lines
              .slice()
              .reverse()
              .map((line, i) => (
                <Text key={i} style={styles.line} numberOfLines={1}>
                  {line}
                </Text>
              ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  clearText: {
    color: '#FF6666',
    fontSize: 11,
    fontWeight: '700',
  },
  line: {
    color: '#E0FFFF',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 13,
  },
  emptyText: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
});