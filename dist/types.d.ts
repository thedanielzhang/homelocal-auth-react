/**
 * Core types for authentication.
 */
/**
 * User object returned from auth service.
 */
export interface User {
    id: string;
    email: string;
    name: string;
    home_geo_region: string | null;
    roles?: string[];
    github_linked?: boolean;
    github_login?: string | null;
    dev_onboarding_state?: 'complete' | 'needs_github' | null;
}
/**
 * Valid user roles.
 */
export type UserRole = 'default' | 'dev' | 'business' | 'admin';
/**
 * Configuration for AuthProvider.
 */
export interface AuthConfig {
    /**
     * Base URL for auth service (e.g., "https://auth.example.com")
     */
    authServiceUrl: string;
    /**
     * Storage key for access token in sessionStorage.
     * @default "access_token"
     */
    tokenStorageKey?: string;
    /**
     * Storage key for token expiry in sessionStorage.
     * @default "access_token_expiry"
     */
    tokenExpiryKey?: string;
    /**
     * Callback invoked on 401 unauthorized responses.
     * Default behavior redirects to loginPath.
     */
    onUnauthorized?: () => void;
    /**
     * Path to redirect to on unauthorized.
     * @default "/dev"
     */
    loginPath?: string;
    /**
     * Buffer time (in seconds) before token expiry to trigger refresh.
     * @default 60
     */
    tokenRefreshBuffer?: number;
}
/**
 * Authentication state.
 */
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
/**
 * Token response from auth service.
 */
export interface TokenResponse {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
}
/**
 * Login credentials.
 */
export interface LoginCredentials {
    email: string;
    password: string;
}
/**
 * Signup data.
 */
export interface SignupData {
    email: string;
    password: string;
    name: string;
    home_address: Address;
}
/**
 * Address for registration.
 */
export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}
/**
 * Login response from auth service.
 */
export interface LoginResponse {
    success: boolean;
    user: User;
}
//# sourceMappingURL=types.d.ts.map