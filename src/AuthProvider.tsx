/**
 * Authentication Context Provider
 *
 * Provides user authentication state and methods throughout the React app.
 */

import React, {
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

    getAccessToken: () =>
      request<TokenResponse>('/auth/token', { method: 'POST' }),
  };
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
        const api = createAuthApi(config);
        return api.getAccessToken();
      },
      onRenewalFailure: () => {
        handleUnauthorized();
      },
    });
  }, [config]);

  // Auth API
  const authApi = useMemo(() => createAuthApi(config), [config]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);

        // Fetch access token for API calls
        try {
          const tokenResponse = await authApi.getAccessToken();
          tokenManager.setToken(tokenResponse.access_token, tokenResponse.expires_in);
        } catch {
          console.warn('Failed to fetch access token');
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
  }, [authApi, tokenManager]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setError(null);
      setIsLoading(true);

      try {
        const response = await authApi.login(credentials);

        // Fetch and store access token BEFORE setting user state
        try {
          const tokenResponse = await authApi.getAccessToken();
          tokenManager.setToken(tokenResponse.access_token, tokenResponse.expires_in);
        } catch (tokenErr) {
          console.error('Failed to fetch access token after login:', tokenErr);
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
    [authApi, tokenManager]
  );

  const logout = useCallback(async () => {
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
  }, [authApi, tokenManager]);

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
      const tokenResponse = await authApi.getAccessToken();
      tokenManager.setToken(tokenResponse.access_token, tokenResponse.expires_in);
    } catch (err) {
      console.error('Failed to refresh token:', err);
      throw err;
    }
  }, [authApi, tokenManager]);

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
    }),
    [user, isLoading, error, login, logout, signup, refreshUser, refreshToken, clearError, tokenManager]
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
