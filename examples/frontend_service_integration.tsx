/**
 * Example: Integrating @homelocal/auth into frontend-service
 *
 * This file shows how to adapt frontend-service to use the
 * @homelocal/auth package while maintaining backwards compatibility.
 *
 * INSTALLATION:
 * 1. Add to frontend-service/package.json:
 *    "@homelocal/auth": "^0.1.0"
 *
 * 2. Configure .npmrc for private registry (see PUBLISHING.md)
 *
 * 3. Update imports as shown below
 */

// =============================================================================
// App.tsx - Wrap with AuthProvider
// =============================================================================

/*
// Before:
import { AuthProvider } from './contexts/AuthContext';

// After:
import { AuthProvider } from '@homelocal/auth';
import { AUTH_SERVICE_URL } from './utils/constants';

function App() {
  return (
    <AuthProvider config={{ authServiceUrl: AUTH_SERVICE_URL }}>
      <Router>
        <Routes />
      </Router>
    </AuthProvider>
  );
}
*/

// =============================================================================
// Compatibility Layer (Optional - for gradual migration)
// =============================================================================

// Create this file: frontend-service/src/app/contexts/AuthContext.tsx

export {
  AuthProvider,
  useAuth,
  type AuthContextValue,
} from '@homelocal/auth';

// =============================================================================
// Token Manager Migration
// =============================================================================

// Create this file: frontend-service/src/app/services/tokenManager.ts
// (replaces the existing one with the package version)

import { TokenManager, createTokenManager } from '@homelocal/auth';

// Re-export for backwards compatibility
export const setAccessToken = (token: string, expiresIn: number) =>
  TokenManager.setToken(token, expiresIn);

export const getAccessToken = () => TokenManager.getToken();

export const clearAccessToken = () => TokenManager.clearToken();

export const hasValidToken = () => TokenManager.hasValidToken();

// New: token renewal
export const ensureAccessToken = () => TokenManager.ensureAccessToken();

// =============================================================================
// Axios Config Migration
// =============================================================================

// Create this file: frontend-service/src/app/services/axios-config.ts
// (replaces the existing one)

import axios from 'axios';
import {
  createAuthenticatedClient,
  classifyError,
  getErrorMessage,
  type ApiError,
  type ApiErrorType,
} from '@homelocal/auth';
import { TokenManager } from '@homelocal/auth';
import { AUTH_SERVICE_URL, DEPLOY_SERVICE_URL } from '../utils/constants';

/**
 * Auth service client (uses session cookies, no Bearer token needed)
 */
export const authClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/**
 * Deploy service client (uses Bearer token)
 */
export const deployClient = createAuthenticatedClient(axios, {
  baseUrl: DEPLOY_SERVICE_URL,
  tokenGetter: () => TokenManager.getToken(),
  onUnauthorized: () => {
    if (window.location.pathname !== '/dev') {
      window.location.href = '/dev';
    }
  },
});

// Re-export error utilities
export { classifyError, getErrorMessage };
export type { ApiError, ApiErrorType };

// =============================================================================
// Role Helpers Migration
// =============================================================================

// Update frontend-service/src/app/types/models.ts

import type { User, UserRole } from '@homelocal/auth';
import { hasRole, hasAnyRole, isAdmin, isDeveloper } from '@homelocal/auth';

// Re-export for backwards compatibility
export type { User, UserRole };
export { hasRole, hasAnyRole, isAdmin, isDeveloper };

// =============================================================================
// Using in Components
// =============================================================================

/*
// Before:
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../types/models';

function AdminPanel() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !isAdmin(user)) {
    return <AccessDenied />;
  }

  return <AdminContent />;
}

// After (Option A - use package directly):
import { useAuth } from '@homelocal/auth';

function AdminPanel() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return <AccessDenied />;
  }

  return <AdminContent />;
}

// After (Option B - use role hook):
import { useRequireRole } from '@homelocal/auth';

function AdminPanel() {
  const { hasRequiredRole, isLoading } = useRequireRole('admin');

  if (isLoading) return <Loading />;
  if (!hasRequiredRole) return <AccessDenied />;

  return <AdminContent />;
}
*/

// =============================================================================
// Token Renewal Example
// =============================================================================

/*
import { useAuth } from '@homelocal/auth';

function useApiCall() {
  const { getTokenManager } = useAuth();

  const callApi = async (url: string) => {
    const manager = getTokenManager();

    // Ensure we have a valid token before making the call
    const token = await manager.ensureAccessToken();
    if (!token) {
      // Token renewal failed - user will be redirected to login
      throw new Error('Not authenticated');
    }

    // Token is valid, make the call
    return fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  return { callApi };
}
*/

// =============================================================================
// Full Migration Checklist
// =============================================================================

/*
1. Install package:
   npm install @homelocal/auth@0.1.0

2. Update imports in:
   - [ ] src/App.tsx (AuthProvider)
   - [ ] src/app/contexts/AuthContext.tsx (or delete and import directly)
   - [ ] src/app/services/tokenManager.ts
   - [ ] src/app/services/axios-config.ts
   - [ ] src/app/types/models.ts
   - [ ] Components using useAuth
   - [ ] Components using role checks

3. Test:
   - [ ] Login flow works
   - [ ] Token is stored in sessionStorage
   - [ ] API calls include Bearer token
   - [ ] Role-based UI gating works
   - [ ] Logout clears token
   - [ ] 401 redirects to login

4. Optional cleanup:
   - [ ] Remove old AuthContext.tsx if using package directly
   - [ ] Remove old tokenManager.ts if using package directly
   - [ ] Remove old axios-config.ts if using package directly
*/
