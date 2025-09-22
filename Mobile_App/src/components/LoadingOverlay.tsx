import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { theme } from '@utils/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = true,
}) => {
  return (
    <Modal
      transparent={transparent}
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.spinner}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.custom.borderRadius.lg,
    padding: theme.custom.spacing.xl,
    alignItems: 'center',
    minWidth: 150,
    ...theme.custom.shadows.md,
  },
  spinner: {
    marginBottom: theme.custom.spacing.md,
  },
  message: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
