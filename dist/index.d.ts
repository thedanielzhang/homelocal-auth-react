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
export type { User, UserRole, BusinessStatus, AuthConfig, AuthState, TokenResponse, LoginCredentials, BffConfig } from './types';
export { AuthProvider, useAuth } from './AuthProvider';
export { useRequireAuth, useRequireRole } from './hooks';
export { TokenManager, createTokenManager } from './TokenManager';
export type { TokenManagerConfig, TokenManagerInstance } from './TokenManager';
export { createAuthenticatedClient, attachBearerToken } from './axios';
export type { AuthenticatedClientConfig } from './axios';
export { hasRole, hasAnyRole, isAdmin, isDeveloper, isBusiness, isApprovedBusiness, hasBusinessRole } from './roles';
export { createOAuthClient, generateOAuthState, parseOAuthCallback } from './oauth';
export { useOAuth } from './useOAuth';
export { OAuthCallbackPage } from './OAuthCallbackPage';
export type { OAuthConfig, OAuthClient, OAuthLoginOptions, OAuthExchangeOptions, OAuthTokenResponse, } from './types';
export type { UseOAuthConfig, UseOAuthReturn } from './useOAuth';
export type { OAuthCallbackPageProps, OAuthCallbackStatus, } from './OAuthCallbackPage';
export { trySilentAuth, isSilentAuthLikelyBlocked, type SilentAuthConfig, type SilentAuthResult, } from './silentAuth';
//# sourceMappingURL=index.d.ts.map