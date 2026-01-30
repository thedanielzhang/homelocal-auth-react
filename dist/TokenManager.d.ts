/**
 * Token Manager - Handles JWT storage, retrieval, and renewal.
 *
 * Implements dual storage (memory + sessionStorage) for:
 * - Fast access from memory
 * - Persistence across page refreshes via sessionStorage
 * - Graceful fallback when sessionStorage unavailable (SSR, private browsing)
 */
import type { TokenResponse } from './types';
/**
 * Configuration for TokenManager.
 */
export interface TokenManagerConfig {
    /**
     * Storage key for access token.
     * @default "access_token"
     */
    storageKey?: string;
    /**
     * Storage key for token expiry timestamp.
     * @default "access_token_expiry"
     */
    expiryKey?: string;
    /**
     * Buffer time (seconds) before expiry to consider token "expiring soon".
     * @default 60
     */
    expiryBuffer?: number;
    /**
     * Function to fetch a new access token via OAuth refresh token.
     * Uses POST /oauth/token with grant_type=refresh_token.
     * If not provided, token renewal is disabled.
     */
    tokenFetcher?: () => Promise<TokenResponse>;
    /**
     * Callback when token renewal fails (e.g., session expired).
     */
    onRenewalFailure?: (error: unknown) => void;
}
/**
 * Token manager instance interface.
 */
export interface TokenManagerInstance {
    /**
     * Get the current access token if valid (not expired).
     */
    getToken(): string | null;
    /**
     * Store a new access token with expiry.
     */
    setToken(token: string, expiresIn: number): void;
    /**
     * Clear the stored token (on logout).
     */
    clearToken(): void;
    /**
     * Check if we have a valid (non-expired) token.
     */
    hasValidToken(): boolean;
    /**
     * Check if the token is expiring soon (within buffer).
     */
    isExpiringSoon(): boolean;
    /**
     * Ensure we have a valid access token, renewing if necessary.
     * Returns the token or null if renewal fails.
     */
    ensureAccessToken(): Promise<string | null>;
    /**
     * Get time until token expires (in seconds), or null if no token.
     */
    getExpiresIn(): number | null;
}
/**
 * Create a new TokenManager instance.
 */
export declare function createTokenManager(config?: TokenManagerConfig): TokenManagerInstance;
/**
 * Default TokenManager instance.
 * Can be used directly or replaced with a custom instance.
 */
export declare const TokenManager: TokenManagerInstance;
//# sourceMappingURL=TokenManager.d.ts.map