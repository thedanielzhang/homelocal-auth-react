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
  /** Business user approval status (only populated for users with "business" role) */
  business_status?: BusinessStatus | null;
  /** Business profile fields for prepopulation (PRD Feature 6) - only present for business accounts */
  business_name?: string | null;
  business_phone?: string | null;
  business_website?: string | null;
  /** One-time flag to show welcome modal after registration (cleared after first token) */
  show_welcome?: boolean;
  github_linked?: boolean;
  github_login?: string | null;
  dev_onboarding_state?: 'complete' | 'needs_github' | null;
}

/**
 * Business user approval status values.
 */
export type BusinessStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended';

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
   * OAuth client ID for token refresh.
   * Required for OAuth refresh token flow.
   */
  clientId: string;

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

  /**
   * Authentication mode.
   * - 'direct': First-party apps on same domain (use OAuth refresh token)
   * - 'bff': Third-party apps on different domain (use BFF pattern with silent auth)
   *
   * @default 'direct'
   */
  mode?: 'direct' | 'bff';

  /**
   * BFF mode configuration. Required when mode is 'bff'.
   */
  bff?: BffConfig;
}

/**
 * Configuration for BFF (Backend-for-Frontend) mode.
 * Used by third-party apps that need silent authentication via hidden iframe.
 */
export interface BffConfig {
  /**
   * URL of your BFF backend's token exchange endpoint.
   * This endpoint receives the auth code and exchanges it for tokens.
   * @example "https://api.myapp.com/auth/exchange"
   */
  tokenExchangeUrl: string;

  /**
   * URL of your BFF backend's login initiation endpoint.
   * Called when user clicks login button.
   * @example "https://api.myapp.com/auth/login"
   */
  loginUrl: string;

  /**
   * URL of your BFF backend's user info endpoint.
   * Returns current user data from access token cookie.
   * @example "https://api.myapp.com/auth/me"
   */
  userInfoUrl: string;

  /**
   * URL of your BFF backend's logout endpoint.
   * @example "https://api.myapp.com/auth/logout"
   */
  logoutUrl?: string;

  /**
   * OAuth scopes to request.
   * @default "openid profile email"
   */
  scope?: string;

  /**
   * Timeout for silent auth in milliseconds.
   * @default 5000
   */
  silentAuthTimeout?: number;

  /**
   * Whether to attempt silent auth on mount.
   * Set to false to disable automatic silent auth.
   * @default true
   */
  enableSilentAuth?: boolean;

  /**
   * Enable debug logging for silent auth.
   * @default false
   */
  debug?: boolean;
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

// ============================================================================
// OAuth Types
// ============================================================================

/**
 * Configuration for OAuth client
 */
export interface OAuthConfig {
  /** OAuth client ID registered with auth service */
  clientId: string;

  /**
   * Path for OAuth callback route (e.g., '/auth/callback' or '/oauth/callback')
   * Will be combined with window.location.origin to form full redirect_uri
   */
  callbackPath: string;

  /**
   * OAuth scopes to request
   * @default 'openid profile email'
   */
  scope?: string;

  /**
   * Auth service base URL (e.g., 'https://auth.iriai.app')
   * If not provided, must be passed to individual functions or use useOAuth hook
   */
  authServiceUrl?: string;
}

/**
 * Options for initiating OAuth login
 */
export interface OAuthLoginOptions {
  /** Path to return to after successful login */
  returnPath?: string;

  /** Override the default auth service URL */
  authServiceUrl?: string;
}

/**
 * Options for OAuth token exchange
 */
export interface OAuthExchangeOptions {
  /** Override the default auth service URL */
  authServiceUrl?: string;
}

/**
 * Result from OAuth token exchange
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth client instance returned by createOAuthClient
 */
export interface OAuthClient {
  /** Initiate OAuth login flow by redirecting to auth service */
  initiateLogin: (options?: OAuthLoginOptions) => void;

  /** Validate state parameter from callback */
  validateState: (state: string) => boolean;

  /** Exchange authorization code for tokens */
  exchangeCode: (code: string, options?: OAuthExchangeOptions) => Promise<OAuthTokenResponse>;

  /** Clear OAuth state from storage */
  clearState: () => void;

  /** Get and clear the stored return path */
  getReturnPath: () => string;

  /** Get the configured redirect URI */
  getRedirectUri: () => string;

  /** Get the OAuth configuration */
  getConfig: () => OAuthConfig;
}
