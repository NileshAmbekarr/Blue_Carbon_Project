// hooks/auth/useAuth.js
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';

export const useAuth = () => {
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Use a small delay to ensure Zustand has hydrated from localStorage
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const hasRole = (role) => {
    if (!user || !user.role) return false;
    return user.role.toLowerCase() === role.toLowerCase();
  };

  return {
    isAuthenticated: !!token && !!user,
    isHydrated,
    user,
    token,
    setAuth,
    clearAuth,
    isAdmin: hasRole('admin'),
    isAuditor: hasRole('auditor'),
    isDeveloper: hasRole('developer'),
    hasRole, // Export the function directly for custom role checks
  };
};