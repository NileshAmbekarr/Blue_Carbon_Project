import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/authStore';
import { theme, commonStyles } from '@utils/theme';
import LoadingOverlay from '@components/LoadingOverlay';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const { login, isLoading, error, clearAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  // Show error snackbar when error changes
  useEffect(() => {
    if (error) {
      setSnackbarVisible(true);
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const success = await login(data.email.trim().toLowerCase(), data.password);
      
      if (success) {
        // Navigation will be handled by the navigation container
        // based on authentication state change
      } else {
        // Error is already set in the store and will show in snackbar
      }
    } catch (err) {
      Alert.alert(
        'Login Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || 'Please enter a valid email address';
  };

  const validatePassword = (password: string) => {
    return password.length >= 6 || 'Password must be at least 6 characters';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Title */}
          <View style={styles.header}>
            <Image
              source={require('@assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Blue Carbon MRV</Text>
            <Text style={styles.subtitle}>
              Ground Truth Data Capture for Mangrove Conservation
            </Text>
          </View>

          {/* Login Form */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.formTitle}>Sign In</Text>
              
              {/* Email Input */}
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  validate: validateEmail,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Email Address"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      left={<TextInput.Icon icon="email" />}
                      style={styles.input}
                    />
                    <HelperText type="error" visible={!!errors.email}>
                      {errors.email?.message}
                    </HelperText>
                  </View>
                )}
              />

              {/* Password Input */}
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  validate: validatePassword,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Password"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.password}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      textContentType="password"
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                      style={styles.input}
                    />
                    <HelperText type="error" visible={!!errors.password}>
                      {errors.password?.message}
                    </HelperText>
                  </View>
                )}
              />

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || isLoading}
                loading={isLoading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Demo Credentials Help */}
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Demo Credentials:</Text>
                <Text style={styles.demoText}>
                  Admin: admin@nccr.gov.in / Admin@123{'\n'}
                  Auditor: auditor@carbonservices.com / Auditor@123{'\n'}
                  Developer: developer@greenearth.org / Developer@123
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Blue Carbon MRV v1.0.0{'\n'}
              Secure • Offline-First • Tamper-Evident
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} message="Signing in..." />

      {/* Error Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={6000}
        style={styles.snackbar}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error || 'Login failed. Please try again.'}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.custom.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.custom.spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: theme.custom.spacing.md,
  },
  title: {
    fontSize: theme.custom.typography.sizes['3xl'],
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.primary,
    marginBottom: theme.custom.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.custom.colors.gray600,
    textAlign: 'center',
    paddingHorizontal: theme.custom.spacing.md,
  },
  card: {
    elevation: 4,
    borderRadius: theme.custom.borderRadius.lg,
    marginBottom: theme.custom.spacing.lg,
  },
  formTitle: {
    fontSize: theme.custom.typography.sizes.xl,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.custom.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  loginButton: {
    marginTop: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.lg,
    borderRadius: theme.custom.borderRadius.md,
  },
  loginButtonContent: {
    paddingVertical: theme.custom.spacing.xs,
  },
  demoSection: {
    backgroundColor: theme.custom.colors.gray100,
    padding: theme.custom.spacing.md,
    borderRadius: theme.custom.borderRadius.md,
    marginTop: theme.custom.spacing.sm,
  },
  demoTitle: {
    fontSize: theme.custom.typography.sizes.sm,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.xs,
  },
  demoText: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray600,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.custom.spacing.xl,
  },
  footerText: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray500,
    textAlign: 'center',
    lineHeight: 16,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
  },
});
