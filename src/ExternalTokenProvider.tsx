/**
 * ExternalTokenProvider — Auth context for micro-frontend mode.
 *
 * Accepts an external getAccessToken function (from the PWA shell)
 * and populates the same AuthContext that useAuth() reads from.
 * Does NOT initiate OAuth flows — login actions are delegated to
 * the host shell via onLoginRequest callback.
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { User, UserRole } from './types';
import { createTokenManager, type TokenManagerInstance } from './TokenManager';
import { hasRole, hasAnyRole, isAdmin, isDeveloper } from './roles';
import type { AuthContextValue } from './AuthProvider';
import { AuthContext } from './AuthContext';

export interface ExternalTokenProviderProps {
  /**
   * Function that returns the current access token from the PWA shell.
   * Called on mount and periodically to detect token changes.
   */
  getAccessToken: () => string | null;

  /**
   * Called when the micro-frontend needs login (e.g., user clicks a
   * protected action). The PWA shell handles the actual OAuth flow.
   */
  onLoginRequest?: () => void;

  /**
   * Called when the micro-frontend wants to log out.
   * The PWA shell handles actual logout + token cleanup.
   */
  onLogoutRequest?: () => void;

  /**
   * Auth service URL (for display/reference only — not used for API calls).
   */
  authServiceUrl?: string;

  /**
   * Polling interval (ms) for checking token changes.
   * @default 5000
   */
  tokenPollInterval?: number;

  children: ReactNode;
}

/**
 * Decode a JWT payload without verification (browser-side).
 * The token was already validated by the PWA shell.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Extract User object from JWT claims.
 * Matches the shape returned by auth-service and expected by useAuth().
 */
function userFromClaims(claims: Record<string, unknown>): User {
  return {
    id: (claims.sub as string) || '',
    email: (claims.email as string) || '',
    name: (claims.name as string) || '',
    home_geo_region: null,
    roles: (claims.roles as string[]) || [],
    account_type: claims.account_type as string | undefined,
    business_status: (claims.business_status as User['business_status']) || null,
  };
}

/**
 * Auth provider for micro-frontend mode.
 *
 * Provides the same useAuth() interface as AuthProvider but sources
 * tokens from an external getAccessToken function.
 */
export function ExternalTokenProvider({
  getAccessToken,
  onLoginRequest,
  onLogoutRequest,
  authServiceUrl = '',
  tokenPollInterval = 5000,
  children,
}: ExternalTokenProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  // Create a token manager that delegates to getAccessToken
  const tokenManager = useMemo<TokenManagerInstance>(() => {
    return createTokenManager({
      storageKey: 'mf_access_token',
      expiryKey: 'mf_access_token_expiry',
    });
  }, []);

  // Sync token from external source
  const syncToken = useCallback(() => {
    const token = getAccessToken();

    // No change
    if (token === lastTokenRef.current) return;
    lastTokenRef.current = token;

    if (!token) {
      setUser(null);
      tokenManager.clearToken();
      setIsLoading(false);
      return;
    }

    // Decode JWT to extract user info
    const claims = decodeJwtPayload(token);
    if (!claims) {
      setUser(null);
      tokenManager.clearToken();
      setIsLoading(false);
      return;
    }

    // Extract expiry and store in token manager
    const exp = claims.exp as number | undefined;
    if (exp) {
      const expiresIn = exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        tokenManager.setToken(token, expiresIn);
      }
    }

    setUser(userFromClaims(claims));
    setIsLoading(false);
  }, [getAccessToken, tokenManager]);

  // Initial sync + polling
  useEffect(() => {
    syncToken();

    const interval = setInterval(syncToken, tokenPollInterval);
    return () => clearInterval(interval);
  }, [syncToken, tokenPollInterval]);

  // No-op login — delegate to PWA shell
  const login = useCallback(async () => {
    if (onLoginRequest) {
      onLoginRequest();
    }
  }, [onLoginRequest]);

  // No-op logout — delegate to PWA shell
  const logout = useCallback(async () => {
    if (onLogoutRequest) {
      onLogoutRequest();
    }
  }, [onLogoutRequest]);

  // No-op signup
  const signup = useCallback(async () => {
    throw new Error('Signup not available in micro-frontend mode');
  }, []);

  // refreshUser just re-syncs from the external token
  const refreshUser = useCallback(async (): Promise<User | null> => {
    syncToken();
    return user;
  }, [syncToken, user]);

  // refreshToken is a no-op — the PWA shell manages refresh
  const refreshToken = useCallback(async () => {
    syncToken();
  }, [syncToken]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      logout,
      signup,
      refreshUser,
      refreshToken,
      clearError,
      hasRole: (role: UserRole) => hasRole(user, role),
      hasAnyRole: (roles: UserRole[]) => hasAnyRole(user, roles),
      isAdmin: isAdmin(user),
      isDeveloper: isDeveloper(user),
      getTokenManager: () => tokenManager,
      authServiceUrl,
    }),
    [user, isLoading, error, login, logout, signup, refreshUser, refreshToken, clearError, tokenManager, authServiceUrl]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
