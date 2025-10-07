import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useAppStore();

  console.log('ProtectedRoute check:', { isAuthenticated, token: !!token });

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
