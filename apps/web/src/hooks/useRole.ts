import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export const useRole = () => {
  const { roles } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    if (roles.includes('admin')) return true; // Admins have all roles
    return roles.includes(role);
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    if (roles.includes('admin')) return true;
    return requiredRoles.some(role => roles.includes(role));
  };

  const hasAllRoles = (requiredRoles: UserRole[]): boolean => {
    if (roles.includes('admin')) return true;
    return requiredRoles.every(role => roles.includes(role));
  };

  const isAdmin = useMemo(() => roles.includes('admin'), [roles]);
  const isSeller = useMemo(() => roles.includes('admin') || roles.includes('seller'), [roles]);
  const isBuyer = useMemo(() => roles.includes('admin') || roles.includes('buyer'), [roles]);

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