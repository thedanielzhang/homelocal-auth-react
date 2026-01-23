/**
 * Authentication Context Provider
 *
 * Provides user authentication state and methods throughout the React app.
 */
import { type ReactNode } from 'react';
import type { User, UserRole, AuthConfig, AuthState, LoginCredentials, SignupData } from './types';
import { type TokenManagerInstance } from './TokenManager';
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
 * Authentication provider component.
 *
 * @example
 * ```tsx
 * <AuthProvider config={{ authServiceUrl: 'https://auth.example.com' }}>
 *   <App />
 * </AuthProvider>
 * ```
 */
export declare function AuthProvider({ config, children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
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
export declare function useAuth(): AuthContextValue;
//# sourceMappingURL=AuthProvider.d.ts.map