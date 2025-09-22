import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, commonStyles } from '@utils/theme';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require('@assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* App Title */}
        <Text style={styles.title}>Blue Carbon MRV</Text>
        
        {/* Loading Spinner */}
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.spinner}
        />
        
        {/* Loading Message */}
        <Text style={styles.message}>{message}</Text>
        
        {/* Version Info */}
        <View style={styles.footer}>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.custom.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.custom.spacing.lg,
  },
  title: {
    fontSize: theme.custom.typography.sizes['3xl'],
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.primary,
    marginBottom: theme.custom.spacing.xl,
    textAlign: 'center',
  },
  spinner: {
    marginBottom: theme.custom.spacing.lg,
  },
  message: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.custom.spacing.xl,
  },
  footer: {
    position: 'absolute',
    bottom: theme.custom.spacing.xl,
    alignItems: 'center',
  },
  version: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray500,
  },
});

export default LoadingScreen;
