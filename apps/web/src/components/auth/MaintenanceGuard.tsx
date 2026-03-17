import { ReactNode } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useRole } from '@/hooks/useRole';
import Maintenance from '@/pages/Maintenance';
import { LoadingSpinner } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';

interface MaintenanceGuardProps {
    children: ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
    const { getSettingValue, loading: settingsLoading } = useSiteSettings('general');
    const { isAdmin } = useRole();
    const { loading: authLoading } = useAuth();


    // If it's taking too long, we show a small indicator but don't block the whole screen
    // Unless truly initial load
    if (settingsLoading || authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground animate-pulse">Confirmando acesso...</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-xs underline text-champagne-dark"
                >
                    Demorando muito? Tente atualizar.
                </button>
            </div>
        );
    }

    const isMaintenanceMode = getSettingValue('maintenance_mode', false);

    // If maintenance is OFF, show content normally
    if (!isMaintenanceMode) {
        return <>{children}</>;
    }

    // If maintenance is ON, but user is Admin, show content
    if (isAdmin) {
        return (
            <>
                {/* Banner to remind admin they are in maintenance mode */}
                <div className="fixed top-0 left-0 right-0 z-[100] h-8 bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    Modo Manutenção Ativo (Visível apenas para Admins)
                </div>
                {children}
            </>
        );
    }

    // Otherwise, show Maintenance Page
    return <Maintenance />;
};
