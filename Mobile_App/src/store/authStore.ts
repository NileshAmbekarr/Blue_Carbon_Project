import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { User, AuthState } from '@types/index';
import { apiClient } from '@services/api/client';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  initialize: () => void;
  clearAuth: () => void;
  
  // State flags
  isLoading: boolean;
  error: string | null;
}

const KEYCHAIN_SERVICE = 'BlueCarbonMRV';
const KEYCHAIN_TOKEN_KEY = 'auth_token';
const KEYCHAIN_REFRESH_KEY = 'refresh_token';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      error: null,

      // Initialize app - called on app startup
      initialize: () => {
        set({ isInitialized: true });
      },

      // Login action
      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
          });

          if (response.data.success) {
            const { user, token, refreshToken } = response.data.data;

            // Store tokens securely in keychain
            await Keychain.setInternetCredentials(
              KEYCHAIN_TOKEN_KEY,
              'token',
              token
            );
            
            await Keychain.setInternetCredentials(
              KEYCHAIN_REFRESH_KEY,
              'refresh',
              refreshToken
            );

            // Update store state
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Set default authorization header
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return true;
          } else {
            set({
              isLoading: false,
              error: response.data.message || 'Login failed',
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 
                              error.message || 
                              'Network error occurred';
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      // Logout action
      logout: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          // Call logout endpoint if token exists
          const { token } = get();
          if (token) {
            await apiClient.post('/auth/logout');
          }
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        }

        // Clear secure storage
        try {
          await Keychain.resetInternetCredentials(KEYCHAIN_TOKEN_KEY);
          await Keychain.resetInternetCredentials(KEYCHAIN_REFRESH_KEY);
        } catch (error) {
          console.warn('Failed to clear keychain:', error);
        }

        // Clear API authorization header
        delete apiClient.defaults.headers.common['Authorization'];

        // Clear store state
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Refresh token action
      refreshToken: async (): Promise<boolean> => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          return false;
        }

        try {
          const response = await apiClient.post('/auth/refresh', {
            refreshToken,
          });

          if (response.data.success) {
            const { token: newToken, refreshToken: newRefreshToken } = response.data.data;

            // Update keychain
            await Keychain.setInternetCredentials(
              KEYCHAIN_TOKEN_KEY,
              'token',
              newToken
            );
            
            if (newRefreshToken) {
              await Keychain.setInternetCredentials(
                KEYCHAIN_REFRESH_KEY,
                'refresh',
                newRefreshToken
              );
            }

            // Update store
            set({
              token: newToken,
              refreshToken: newRefreshToken || refreshToken,
              error: null,
            });

            // Update API client header
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return true;
          }
        } catch (error) {
          console.warn('Token refresh failed:', error);
          // Force logout on refresh failure
          get().logout();
        }

        return false;
      },

      // Update user profile
      updateUser: (updatedUser: Partial<User>): void => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },

      // Clear authentication state
      clearAuth: (): void => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      // Only persist user data, not sensitive tokens
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
      
      // Restore tokens from keychain on hydration
      onRehydrateStorage: () => async (state) => {
        if (state?.isAuthenticated && state?.user) {
          try {
            // Restore tokens from secure storage
            const tokenCredentials = await Keychain.getInternetCredentials(KEYCHAIN_TOKEN_KEY);
            const refreshCredentials = await Keychain.getInternetCredentials(KEYCHAIN_REFRESH_KEY);
            
            if (tokenCredentials && refreshCredentials) {
              // Update state with restored tokens
              useAuthStore.setState({
                token: tokenCredentials.password,
                refreshToken: refreshCredentials.password,
              });
              
              // Set authorization header
              apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokenCredentials.password}`;
              
              // Verify token is still valid
              try {
                await apiClient.get('/auth/me');
              } catch (error) {
                // Token invalid, try to refresh
                const refreshSuccess = await useAuthStore.getState().refreshToken();
                if (!refreshSuccess) {
                  // Refresh failed, logout user
                  await useAuthStore.getState().logout();
                }
              }
            } else {
              // No valid tokens found, logout user
              await useAuthStore.getState().logout();
            }
          } catch (error) {
            console.warn('Failed to restore authentication state:', error);
            await useAuthStore.getState().logout();
          }
        }
      },
    }
  )
);

// Auto-refresh token before expiry
let refreshInterval: NodeJS.Timeout;

// Set up automatic token refresh
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated && state.token) {
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Set up new refresh interval (refresh every 50 minutes, assuming 1-hour expiry)
    refreshInterval = setInterval(async () => {
      const currentState = useAuthStore.getState();
      if (currentState.isAuthenticated) {
        await currentState.refreshToken();
      }
    }, 50 * 60 * 1000); // 50 minutes
  } else {
    // Clear interval when not authenticated
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  }
});

export default useAuthStore;
