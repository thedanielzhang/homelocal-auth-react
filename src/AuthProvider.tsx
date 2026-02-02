/**
 * Authentication Context Provider
 *
 * Provides user authentication state and methods throughout the React app.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  User,
  UserRole,
  AuthConfig,
  AuthState,
  LoginCredentials,
  SignupData,
  TokenResponse,
  LoginResponse,
} from './types';
import { createTokenManager, type TokenManagerInstance } from './TokenManager';
import { hasRole, hasAnyRole, isAdmin, isDeveloper } from './roles';
import { trySilentAuth, isSilentAuthLikelyBlocked } from './silentAuth';

/**
 * Authentication context value.
 */
export interface AuthContextValue extends AuthState {
  /**
   * Log in with email and password.
   */
  login: (credentials: LoginCredentials) => Promise<void>;

  /**
   * Log out the current user.
   */
  logout: () => Promise<void>;

  /**
   * Sign up a new user.
   */
  signup: (data: SignupData) => Promise<void>;

  /**
   * Refresh user data from /auth/me.
   */
  refreshUser: () => Promise<User | null>;

  /**
   * Refresh the access token.
   */
  refreshToken: () => Promise<void>;

  /**
   * Clear the current error.
   */
  clearError: () => void;

  /**
   * Check if user has a specific role.
   */
  hasRole: (role: UserRole) => boolean;

  /**
   * Check if user has any of the specified roles.
   */
  hasAnyRole: (roles: UserRole[]) => boolean;

  /**
   * Whether user has admin role.
   */
  isAdmin: boolean;

  /**
   * Whether user has dev role.
   */
  isDeveloper: boolean;

  /**
   * Get the token manager instance.
   */
  getTokenManager: () => TokenManagerInstance;

  /**
   * The configured auth service URL.
   */
  authServiceUrl: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for AuthProvider.
 */
export interface AuthProviderProps {
  /**
   * Authentication configuration.
   */
  config: AuthConfig;

  /**
   * Child components.
   */
  children: ReactNode;
}

/**
 * Create an auth API client for the given config.
 */
function createAuthApi(config: AuthConfig) {
  const baseUrl = config.authServiceUrl;

  async function request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = (errorData as { detail?: string }).detail || response.statusText;
      throw new Error(message);
    }

    return response.json();
  }

  return {
    login: (credentials: LoginCredentials) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    logout: () =>
      request<void>('/auth/logout', { method: 'POST' }),

    signup: (data: SignupData) =>
      request<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getCurrentUser: () => request<User>('/auth/me'),

    // getAccessToken removed - token refresh now uses OAuth refresh tokens
    // via POST /oauth/token with grant_type=refresh_token
  };
}

/**
 * Perform OAuth token refresh using httpOnly cookie.
 * Returns the token response or throws on failure.
 */
async function refreshAccessTokenViaOAuth(
  authServiceUrl: string,
  clientId: string
): Promise<TokenResponse> {
  const response = await fetch(`${authServiceUrl}/oauth/token`, {
    method: 'POST',
    credentials: 'include', // Sends httpOnly refresh_token cookie
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Authentication provider component.
 *
 * @example
 * ```tsx
 * <AuthProvider config={{ authServiceUrl: 'https://auth.example.com' }}>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ config, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create token manager
  const tokenManager = useMemo(() => {
    const handleUnauthorized = config.onUnauthorized ?? (() => {
      if (typeof window !== 'undefined') {
        window.location.href = config.loginPath ?? '/dev';
      }
    });

    return createTokenManager({
      storageKey: config.tokenStorageKey ?? 'access_token',
      expiryKey: config.tokenExpiryKey ?? 'access_token_expiry',
      expiryBuffer: config.tokenRefreshBuffer ?? 60,
      tokenFetcher: async () => {
        // Use OAuth refresh token flow instead of session-based /auth/token
        // The refresh token is stored as an httpOnly cookie and sent automatically
        const response = await fetch(`${config.authServiceUrl}/oauth/token`, {
          method: 'POST',
          credentials: 'include', // Sends httpOnly refresh_token cookie
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: config.clientId,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Token refresh failed: ${response.status} ${error}`);
        }

        return response.json();
      },
      onRenewalFailure: () => {
        handleUnauthorized();
      },
    });
  }, [config]);

  // Auth API
  const authApi = useMemo(() => createAuthApi(config), [config]);

  // Helper: Fetch user from BFF backend
  const refreshUserFromBFF = useCallback(async (): Promise<User | null> => {
    if (!config.bff?.userInfoUrl) return null;

    try {
      const response = await fetch(config.bff.userInfoUrl, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else if (response.status === 401) {
        return null;
      } else {
        console.warn('[AuthProvider] User info fetch failed:', response.status);
        return null;
      }
    } catch (err) {
      console.warn('[AuthProvider] User info fetch error:', err);
      return null;
    }
  }, [config.bff?.userInfoUrl]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (config.mode === 'bff' && config.bff) {
          // =================================================================
          // BFF Mode: Third-party app on different domain
          // =================================================================

          const shouldTrySilentAuth = config.bff.enableSilentAuth !== false;

          if (shouldTrySilentAuth) {
            // Check if browser likely blocks silent auth
            const likelyBlocked = isSilentAuthLikelyBlocked();
            if (likelyBlocked && config.bff.debug) {
              console.warn('[AuthProvider] Silent auth may be blocked by browser');
            }

            // Attempt silent authentication via iframe
            const silentResult = await trySilentAuth({
              authServiceUrl: config.authServiceUrl,
              clientId: config.clientId,
              scope: config.bff.scope,
              timeout: config.bff.silentAuthTimeout,
              debug: config.bff.debug,
            });

            if (silentResult.success && silentResult.code) {
              // Exchange code via BFF backend
              try {
                const response = await fetch(config.bff.tokenExchangeUrl, {
                  method: 'POST',
                  credentials: 'include', // Include cookies
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    code: silentResult.code,
                    state: silentResult.state,
                  }),
                });

                if (!response.ok) {
                  console.warn('[AuthProvider] Token exchange failed:', response.status);
                }
              } catch (err) {
                console.warn('[AuthProvider] Token exchange error:', err);
              }
            } else {
              // Silent auth failed - user needs to click login
              if (config.bff.debug) {
                console.log('[AuthProvider] Silent auth failed:', silentResult.error);
              }
            }
          }

          // After silent auth attempt (success or failure), check if we have a session
          // by calling the user info endpoint
          const userData = await refreshUserFromBFF();
          setUser(userData);

        } else {
          // =================================================================
          // Direct Mode: First-party app on same domain
          // =================================================================

          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);

          // Fetch access token using OAuth refresh token flow
          try {
            const tokenResponse = await refreshAccessTokenViaOAuth(
              config.authServiceUrl,
              config.clientId
            );
            tokenManager.setToken(tokenResponse.access_token, tokenResponse.expires_in);
          } catch {
            console.warn('Failed to fetch access token via OAuth refresh');
          }
        }
      } catch {
        // Not authenticated
        setUser(null);
        tokenManager.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [authApi, tokenManager, config, refreshUserFromBFF]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      // BFF mode: redirect to BFF backend's login endpoint
      if (config.mode === 'bff' && config.bff) {
        window.location.href = config.bff.loginUrl;
        return;
      }

      // Direct mode: use auth API
      setError(null);
      setIsLoading(true);

      try {
        const response = await authApi.login(credentials);

        // Fetch and store access token using OAuth refresh token flow
        // Note: After session login, the OAuth refresh token cookie should be set
        try {
          const tokenResponse = await refreshAccessTokenViaOAuth(
            config.authServiceUrl,
            config.clientId
          );
          tokenManager.setToken(tokenResponse.access_token, tokenResponse.expires_in);
        } catch (tokenErr) {
          console.error('Failed to fetch access token via OAuth refresh after login:', tokenErr);
        }

        setUser(response.user);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [authApi, tokenManager, config]
  );

  const logout = useCallback(async () => {
    // BFF mode: redirect to BFF backend's logout endpoint
    if (config.mode === 'bff' && config.bff?.logoutUrl) {
      window.location.href = config.bff.logoutUrl;
      return;
    }

    // Direct mode: use auth API
    setError(null);

    try {
      await authApi.logout();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
    } finally {
      setUser(null);
      tokenManager.clearToken();
    }
  }, [authApi, tokenManager, config]);

  const signup = useCallback(
    async (data: SignupData) => {
      setError(null);
      setIsLoading(true);

      try {
        await authApi.signup(data);
        // Auto-login after signup
        await login({ email: data.email, password: data.password });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Signup failed';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [authApi, login]
  );

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const updatedUser = await authApi.getCurrentUser();
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  }, [authApi]);

  const refreshToken = useCallback(async () => {
    try {
      const tokenResponse = await refreshAccessTokenViaOAuth(
        config.authServiceUrl,
        config.clientId
      );
      tokenManager.setToken(tokenResponse.access_token, tokenResponse.expires_in);
    } catch (err) {
      console.error('Failed to refresh token via OAuth:', err);
      throw err;
    }
  }, [tokenManager, config.authServiceUrl, config.clientId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
      authServiceUrl: config.authServiceUrl,
    }),
    [user, isLoading, error, login, logout, signup, refreshUser, refreshToken, clearError, tokenManager, config.authServiceUrl]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context.
 *
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <Login />;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user.name}</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
