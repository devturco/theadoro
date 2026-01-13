import { ReactNode } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useRole } from '@/hooks/useRole';
import Maintenance from '@/pages/Maintenance';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MaintenanceGuardProps {
    children: ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
    const { getSettingValue, loading: settingsLoading } = useSiteSettings('general');
    const { isAdmin, loading: authLoading } = useRole();

    if (settingsLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
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
                {/* Optional: Add a banner to remind admin they are in maintenance mode */}
                <div className="bg-amber-500/10 text-amber-600 text-xs text-center py-1 border-b border-amber-500/20">
                    Modo Manutenção Ativo (Visível apenas para Admins)
                </div>
                {children}
            </>
        );
    }

    // Otherwise, show Maintenance Page
    return <Maintenance />;
};
