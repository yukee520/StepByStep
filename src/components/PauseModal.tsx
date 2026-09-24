import React from 'react';
import { Modal, Text, View } from 'react-native';
import Button from '@/components/Button';
import { NEON_PALETTE } from '@/theme/colors';

export type PauseModalProps = {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
};

export default function PauseModal({
  visible,
  onResume,
  onRestart,
  onQuit,
}: PauseModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onResume}
      transparent={false}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: NEON_PALETTE.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 3,
            borderColor: NEON_PALETTE.primary,
            backgroundColor: 'rgba(0, 229, 255, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            shadowColor: NEON_PALETTE.primary,
            shadowOpacity: 0.6,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontSize: 44,
              fontWeight: '900',
              color: NEON_PALETTE.primary,
              letterSpacing: 4,
            }}
          >
            II
          </Text>
        </View>

        <Text
          style={{
            fontSize: 32,
            fontWeight: '900',
            color: NEON_PALETTE.text,
            letterSpacing: 4,
            marginBottom: 40,
          }}
        >
          PAUSED
        </Text>

        <View style={{ width: '100%' }}>
          <View style={{ marginBottom: 12 }}>
            <Button
              label="Resume"
              icon="play"
              size="lg"
              fullWidth
              onPress={onResume}
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <Button
              label="Restart"
              icon="refresh"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={onRestart}
            />
          </View>
          <View>
            <Button
              label="Quit to Song List"
              icon="exit-outline"
              variant="danger"
              size="lg"
              fullWidth
              onPress={onQuit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}