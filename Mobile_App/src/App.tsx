import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from '@navigation/AppNavigator';
import { theme } from '@utils/theme';
import { initializeApp } from '@services/initialization';
import { useAuthStore } from '@store/authStore';
import { DatabaseService } from '@services/database';
import { SyncService } from '@services/sync';
import { NotificationService } from '@services/notifications';
import ErrorBoundary from '@components/ErrorBoundary';
import LoadingScreen from '@components/LoadingScreen';

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Warning: Each child in a list should have a unique "key" prop',
]);

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App: React.FC = () => {
  const { isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize core services
        await initializeApp();
        
        // Initialize database
        await DatabaseService.getInstance().initialize();
        
        // Initialize notifications
        await NotificationService.initialize();
        
        // Start background sync service
        SyncService.getInstance().startBackgroundSync();
        
        // Mark app as initialized
        initialize();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Handle initialization error - could show error screen
      }
    };

    initApp();
  }, [initialize]);

  if (!isInitialized) {
    return <LoadingScreen message="Initializing Blue Carbon MRV..." />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <NavigationContainer theme={theme}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.primary}
                translucent={false}
              />
              <AppNavigator />
            </NavigationContainer>
          </PaperProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
