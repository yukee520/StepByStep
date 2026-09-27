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

  useEffect(() => {
    if (!visible) return undefined;
    const unsubscribe = subscribeLog((next) => {
      setLines(next);
    });
    return unsubscribe;
  }, [visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.headerText}>DEV LOG</Text>
          <Pressable onPress={clearLog} hitSlop={8}>
            <Text style={styles.clearText}>CLEAR</Text>
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {lines.length === 0 ? (
            <Text style={styles.emptyText}>— no events yet —</Text>
          ) : (
            lines.map((line, i) => (
              <Text key={i} style={styles.line} numberOfLines={2}>
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
  root: {
    position: 'absolute',
    top: 60,
    left: 8,
    right: 8,
    zIndex: 9999,
  },
  panel: {
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderColor: '#00E5FF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    maxHeight: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  headerText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  clearText: {
    color: '#FF6666',
    fontSize: 10,
    fontWeight: '700',
  },
  scroll: {
    maxHeight: 150,
  },
  scrollContent: {
    paddingHorizontal: 4,
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