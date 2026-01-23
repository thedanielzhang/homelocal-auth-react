/**
 * Additional authentication hooks.
 */

import { useEffect } from 'react';
import { useAuth, type AuthContextValue } from './AuthProvider';
import type { UserRole } from './types';

/**
 * Options for useRequireAuth hook.
 */
export interface RequireAuthOptions {
  /**
   * Path to redirect to if not authenticated.
   * @default "/dev"
   */
  redirectTo?: string;
}

/**
 * Hook that requires authentication.
 *
 * Redirects to login page if user is not authenticated.
 * Returns the full auth context for convenience.
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *
 *   if (isLoading) {
 *     return <Loading />;
 *   }
 *
 *   return <div>Welcome, {user.name}</div>;
 * }
 * ```
 */
export function useRequireAuth(options: RequireAuthOptions = {}): AuthContextValue {
  const { redirectTo = '/dev' } = options;
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo]);

  return auth;
}

/**
 * Options for useRequireRole hook.
 */
export interface RequireRoleOptions {
  /**
   * Path to redirect to if role check fails.
   * @default "/dev"
   */
  redirectTo?: string;

  /**
   * If true, redirect instead of returning hasRequiredRole=false.
   * @default false
   */
  redirect?: boolean;
}

/**
 * Result from useRequireRole hook.
 */
export interface RequireRoleResult extends AuthContextValue {
  /**
   * Whether the user has the required role(s).
   */
  hasRequiredRole: boolean;
}

/**
 * Hook that checks for required role(s).
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { user, hasRequiredRole, isLoading } = useRequireRole('admin');
 *
 *   if (isLoading) {
 *     return <Loading />;
 *   }
 *
 *   if (!hasRequiredRole) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <AdminContent />;
 * }
 *
 * // Or with multiple roles
 * function Dashboard() {
 *   const { hasRequiredRole } = useRequireRole(['dev', 'admin']);
 *   // User needs either 'dev' or 'admin' role
 * }
 * ```
 */
export function useRequireRole(
  role: UserRole | UserRole[],
  options: RequireRoleOptions = {}
): RequireRoleResult {
  const { redirectTo = '/dev', redirect = false } = options;
  const auth = useRequireAuth({ redirectTo });

  const roles = Array.isArray(role) ? role : [role];
  const hasRequiredRole = auth.isAuthenticated && auth.hasAnyRole(roles);

  useEffect(() => {
    if (redirect && !auth.isLoading && auth.isAuthenticated && !hasRequiredRole) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [redirect, auth.isLoading, auth.isAuthenticated, hasRequiredRole, redirectTo]);

  return {
    ...auth,
    hasRequiredRole,
  };
}

/**
 * Hook that requires admin role.
 *
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   const { user, hasRequiredRole } = useRequireAdmin();
 *
 *   if (!hasRequiredRole) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <AdminContent />;
 * }
 * ```
 */
export function useRequireAdmin(options: RequireRoleOptions = {}): RequireRoleResult {
  return useRequireRole('admin', options);
}

/**
 * Hook that requires developer role.
 *
 * @example
 * ```tsx
 * function DeveloperConsole() {
 *   const { user, hasRequiredRole } = useRequireDeveloper();
 *
 *   if (!hasRequiredRole) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <DeveloperContent />;
 * }
 * ```
 */
export function useRequireDeveloper(options: RequireRoleOptions = {}): RequireRoleResult {
  return useRequireRole('dev', options);
}
