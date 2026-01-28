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
export type { User, UserRole, BusinessStatus, AuthConfig, AuthState, TokenResponse, LoginCredentials } from './types';
export { AuthProvider, useAuth } from './AuthProvider';
export { useRequireAuth, useRequireRole } from './hooks';
export { TokenManager, createTokenManager } from './TokenManager';
export type { TokenManagerConfig, TokenManagerInstance } from './TokenManager';
export { createAuthenticatedClient, attachBearerToken } from './axios';
export type { AuthenticatedClientConfig } from './axios';
export { hasRole, hasAnyRole, isAdmin, isDeveloper, isBusiness, isApprovedBusiness, hasBusinessRole } from './roles';
//# sourceMappingURL=index.d.ts.map