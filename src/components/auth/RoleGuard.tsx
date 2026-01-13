import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  showError?: boolean;
}

export const RoleGuard = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
  showError = true
}: RoleGuardProps) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Self-Healing: If roles are empty but user exists, try to force reload once
  if (roles.length === 0 && !window.location.search.includes('retried=true')) {
    const url = new URL(window.location.href);
    url.searchParams.set('retried', 'true');
    window.location.href = url.toString();
    return null;
  }

  const hasRequiredRole = allowedRoles.some(role => roles.includes(role));

  if (!hasRequiredRole) {
    if (showError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="mt-2">
                <p>Você não tem permissão para acessar esta página.</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Roles necessárias: {allowedRoles.join(', ')}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.reload();
                    }}
                  >
                    Atualizar Permissões
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Voltar
                  </Button>
                </div>

                <div className="mt-4 p-2 bg-muted rounded text-xs font-mono">
                  <p>Debug Info:</p>
                  <p>User ID: {user?.id}</p>
                  <p>Profile Raw: {JSON.stringify(useAuth().profile)}</p>
                  <p>Roles Detec: {JSON.stringify(roles)}</p>
                  <p>Roles Req: {JSON.stringify(allowedRoles)}</p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;