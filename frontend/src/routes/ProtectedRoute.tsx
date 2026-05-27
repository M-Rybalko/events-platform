import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container py-12 text-center text-slate-500 text-sm">
        Завантаження…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-xl font-semibold">Немає доступу</h1>
        <p className="mt-2 text-slate-500">У вас недостатньо прав для перегляду цієї сторінки.</p>
      </div>
    );
  }

  return <>{children}</>;
}
