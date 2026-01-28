/**
 * @homelocal/auth - Reusable authentication for Home.Local React applications
 *
 * @example
 * ```tsx
 * import { AuthProvider, useAuth, createAuthenticatedClient } from '@homelocal/auth';
 *
 * // Wrap your app
 * <AuthProvider config={{ authServiceUrl: 'https://auth.example.com' }}>
 *   <App />
 * </AuthProvider>
 *
 * // Use in components
 * function Profile() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *   // ...
 * }
 * ```
 */
// Context and hooks
export { AuthProvider, useAuth } from './AuthProvider';
export { useRequireAuth, useRequireRole } from './hooks';
// Token management
export { TokenManager, createTokenManager } from './TokenManager';
// Axios integration
export { createAuthenticatedClient, attachBearerToken } from './axios';
// Role helpers
export { hasRole, hasAnyRole, isAdmin, isDeveloper, isBusiness, isApprovedBusiness, hasBusinessRole } from './roles';
//# sourceMappingURL=index.js.map