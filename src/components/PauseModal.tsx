import React from 'react';
import { Modal, Text, View } from 'react-native';
import Button from '@/components/Button';

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
      <View className="flex-1 bg-background dark:bg-dark-background items-center justify-center px-6">
        <Text className="text-2xl font-bold text-text dark:text-dark-text mb-8">
          Paused
        </Text>

        <View className="w-full space-y-3">
          <View className="mb-3">
            <Button
              label="Resume"
              icon="play"
              size="lg"
              fullWidth
              onPress={onResume}
            />
          </View>
          <View className="mb-3">
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