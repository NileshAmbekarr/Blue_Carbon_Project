// store/slices/authSlice.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      
      setAuth: (token, userData) => set({ 
        token,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          organizationId: userData.organizationId,
          walletAddress: userData.walletAddress
        }
      }),
      
      clearAuth: () => set({ 
        token: null, 
        user: null
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user 
      }),
    }
  )
);