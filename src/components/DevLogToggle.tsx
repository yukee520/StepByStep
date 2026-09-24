import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useDevLogStore } from '@/store/useDevLogStore';
import { NEON_PALETTE } from '@/theme/colors';

export default function DevLogToggle(): React.ReactElement {
  const toggle = useDevLogStore((s) => s.toggle);
  const visible = useDevLogStore((s) => s.visible);
  const count = useDevLogStore((s) => s.entries.length);

  return (
    <Pressable
      onPress={toggle}
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: visible ? NEON_PALETTE.primary : 'rgba(0, 0, 0, 0.7)',
        borderWidth: 1,
        borderColor: NEON_PALETTE.primary,
        zIndex: 9998,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: visible ? '#0A0118' : NEON_PALETTE.primary,
            letterSpacing: 1,
          }}
        >
          LOG {count > 0 ? `(${count})` : ''}
        </Text>
      </View>
    </Pressable>
  );
}