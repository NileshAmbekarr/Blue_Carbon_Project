// components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, isHydrated, user } = useAuth();
  
  // Wait for store hydration before making auth decisions
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: window.location.pathname }} replace />;
  }

  // If no specific roles required, allow access
  if (!allowedRoles) {
    return <Outlet />;
  }

  // Check if user has required role
  const userRole = user?.role?.toLowerCase();
  const hasRequiredRole = userRole && allowedRoles.some(role => 
    role.toLowerCase() === userRole
  );

  // If user has required role, render the route
  if (hasRequiredRole) {
    return <Outlet />;
  }

  // If user doesn't have required role, redirect to dashboard
  return <Navigate to="/app/dashboard" replace />;
};