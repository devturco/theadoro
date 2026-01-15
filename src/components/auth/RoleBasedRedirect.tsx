import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const RoleBasedRedirect = () => {
    const { user, profile, loading } = useAuth();
    const { isAdmin, isSeller } = useRole();

    console.log('[RoleBasedRedirect] Render', { loading, hasUser: !!user, hasProfile: !!profile });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (isSeller) {
        return <Navigate to="/seller/dashboard" replace />;
    }

    // Default for buyers or any other role
    return <Navigate to="/buyer/dashboard" replace />;
};

export default RoleBasedRedirect;
