import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@utils/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and crash reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Here you would typically send the error to a crash reporting service
    // like Crashlytics, Sentry, or Bugsnag
    // crashReporting.recordError(error, errorInfo);
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Card style={styles.errorCard}>
              <Card.Content>
                <Text style={styles.title}>Oops! Something went wrong</Text>
                
                <Text style={styles.description}>
                  The app encountered an unexpected error. This has been logged 
                  and will be investigated by our development team.
                </Text>

                {__DEV__ && (
                  <View style={styles.debugInfo}>
                    <Text style={styles.debugTitle}>Debug Information:</Text>
                    <Text style={styles.debugText}>
                      {this.state.error?.toString()}
                    </Text>
                    {this.state.errorInfo?.componentStack && (
                      <Text style={styles.debugText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.actions}>
                  <Button
                    mode="contained"
                    onPress={this.handleRestart}
                    style={styles.restartButton}
                  >
                    Restart App
                  </Button>
                </View>
              </Card.Content>
            </Card>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                If this problem persists, please contact support.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.custom.spacing.lg,
  },
  errorCard: {
    elevation: 4,
    borderRadius: theme.custom.borderRadius.lg,
    marginBottom: theme.custom.spacing.lg,
  },
  title: {
    fontSize: theme.custom.typography.sizes.xl,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.error,
    marginBottom: theme.custom.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.colors.text,
    lineHeight: theme.custom.typography.lineHeights.relaxed * theme.custom.typography.sizes.base,
    marginBottom: theme.custom.spacing.lg,
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: theme.custom.colors.gray100,
    padding: theme.custom.spacing.md,
    borderRadius: theme.custom.borderRadius.md,
    marginBottom: theme.custom.spacing.lg,
  },
  debugTitle: {
    fontSize: theme.custom.typography.sizes.sm,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.xs,
  },
  debugText: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray700,
    fontFamily: 'monospace',
    marginBottom: theme.custom.spacing.xs,
  },
  actions: {
    alignItems: 'center',
  },
  restartButton: {
    borderRadius: theme.custom.borderRadius.md,
    paddingHorizontal: theme.custom.spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray500,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
