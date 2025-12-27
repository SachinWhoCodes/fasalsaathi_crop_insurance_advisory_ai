import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  // Prevent redirect flicker while Firebase restores session
  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};