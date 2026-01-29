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

// Core types
export type { User, UserRole, BusinessStatus, AuthConfig, AuthState, TokenResponse, LoginCredentials } from './types';

// Context and hooks
export { AuthProvider, useAuth } from './AuthProvider';
export { useRequireAuth, useRequireRole } from './hooks';

// Token management
export { TokenManager, createTokenManager } from './TokenManager';
export type { TokenManagerConfig, TokenManagerInstance } from './TokenManager';

// Axios integration
export { createAuthenticatedClient, attachBearerToken } from './axios';
export type { AuthenticatedClientConfig } from './axios';

// Role helpers
export { hasRole, hasAnyRole, isAdmin, isDeveloper, isBusiness, isApprovedBusiness, hasBusinessRole } from './roles';

// OAuth utilities
export { createOAuthClient, generateOAuthState, parseOAuthCallback } from './oauth';
export { useOAuth } from './useOAuth';
export { OAuthCallbackPage } from './OAuthCallbackPage';

// OAuth types
export type {
  OAuthConfig,
  OAuthClient,
  OAuthLoginOptions,
  OAuthExchangeOptions,
  OAuthTokenResponse,
} from './types';

export type { UseOAuthConfig, UseOAuthReturn } from './useOAuth';

export type {
  OAuthCallbackPageProps,
  OAuthCallbackStatus,
} from './OAuthCallbackPage';
