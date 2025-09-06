// hooks/auth/useAuth.js
import { useAuthStore } from '@/store/slices/authSlice';

export const useAuth = () => {
  const { user, token, setAuth, clearAuth } = useAuthStore();

  const hasRole = (role) => {
    return user?.roles.includes(role) ?? false;
  };

  return {
    isAuthenticated: !!token,
    user,
    token,
    setAuth,
    clearAuth,
    isAdmin: hasRole('Admin'),
    isAuditor: hasRole('Auditor'),
    isDeveloper: hasRole('Developer'),
  };
};