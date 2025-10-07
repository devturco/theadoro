import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export const useRole = () => {
  const { roles } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.some(role => roles.includes(role));
  };

  const hasAllRoles = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.every(role => roles.includes(role));
  };

  const isAdmin = useMemo(() => hasRole('admin'), [roles]);
  const isSeller = useMemo(() => hasRole('seller'), [roles]);
  const isBuyer = useMemo(() => hasRole('buyer'), [roles]);

  const canManageUsers = useMemo(() => isAdmin, [isAdmin]);
  const canManageProducts = useMemo(() => isAdmin || isSeller, [isAdmin, isSeller]);
  const canManageOrders = useMemo(() => isAdmin || isSeller, [isAdmin, isSeller]);
  const canViewReports = useMemo(() => isAdmin || isSeller, [isAdmin, isSeller]);

  const primaryRole = useMemo((): UserRole | null => {
    if (isAdmin) return 'admin';
    if (isSeller) return 'seller';
    if (isBuyer) return 'buyer';
    return null;
  }, [isAdmin, isSeller, isBuyer]);

  const getDefaultRoute = (): string => {
    if (isAdmin) return '/admin/dashboard';
    if (isSeller) return '/seller/dashboard';
    if (isBuyer) return '/buyer/dashboard';
    return '/dashboard';
  };

  return {
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isSeller,
    isBuyer,
    canManageUsers,
    canManageProducts,
    canManageOrders,
    canViewReports,
    primaryRole,
    getDefaultRoute,
  };
};