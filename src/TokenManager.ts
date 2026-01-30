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
export function createTokenManager(config: TokenManagerConfig = {}): TokenManagerInstance {
  const {
    storageKey = 'access_token',
    expiryKey = 'access_token_expiry',
    expiryBuffer = 60,
    tokenFetcher,
    onRenewalFailure,
  } = config;

  // In-memory storage
  let memoryToken: string | null = null;
  let memoryExpiry: number | null = null;

  // Renewal state to prevent concurrent renewals
  let renewalPromise: Promise<string | null> | null = null;

  /**
   * Read from sessionStorage safely.
   */
  function readStorage(): { token: string | null; expiry: number | null } {
    try {
      const token = sessionStorage.getItem(storageKey);
      const expiryStr = sessionStorage.getItem(expiryKey);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : null;
      return { token, expiry };
    } catch {
      // sessionStorage not available
      return { token: null, expiry: null };
    }
  }

  /**
   * Write to sessionStorage safely.
   */
  function writeStorage(token: string, expiry: number): void {
    try {
      sessionStorage.setItem(storageKey, token);
      sessionStorage.setItem(expiryKey, expiry.toString());
    } catch {
      // sessionStorage not available
    }
  }

  /**
   * Clear sessionStorage safely.
   */
  function clearStorage(): void {
    try {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(expiryKey);
    } catch {
      // sessionStorage not available
    }
  }

  /**
   * Check if a token with given expiry is valid.
   */
  function isTokenValid(token: string | null, expiry: number | null): boolean {
    if (!token || expiry === null) return false;
    return Date.now() < expiry;
  }

  /**
   * Check if expiring within buffer.
   */
  function isExpiringSoonCheck(expiry: number | null): boolean {
    if (expiry === null) return false;
    const bufferMs = expiryBuffer * 1000;
    return Date.now() >= expiry - bufferMs;
  }

  const manager: TokenManagerInstance = {
    getToken(): string | null {
      // Check memory first
      if (isTokenValid(memoryToken, memoryExpiry)) {
        return memoryToken;
      }

      // Try sessionStorage
      const { token, expiry } = readStorage();
      if (isTokenValid(token, expiry)) {
        // Restore to memory
        memoryToken = token;
        memoryExpiry = expiry;
        return token;
      }

      return null;
    },

    setToken(token: string, expiresIn: number): void {
      const expiryTime = Date.now() + expiresIn * 1000;
      memoryToken = token;
      memoryExpiry = expiryTime;
      writeStorage(token, expiryTime);
    },

    clearToken(): void {
      memoryToken = null;
      memoryExpiry = null;
      clearStorage();
    },

    hasValidToken(): boolean {
      return manager.getToken() !== null;
    },

    isExpiringSoon(): boolean {
      // Get current expiry
      if (memoryExpiry !== null) {
        return isExpiringSoonCheck(memoryExpiry);
      }
      const { expiry } = readStorage();
      return isExpiringSoonCheck(expiry);
    },

    getExpiresIn(): number | null {
      let expiry = memoryExpiry;
      if (expiry === null) {
        const stored = readStorage();
        expiry = stored.expiry;
      }
      if (expiry === null) return null;
      const remaining = Math.floor((expiry - Date.now()) / 1000);
      return Math.max(0, remaining);
    },

    async ensureAccessToken(): Promise<string | null> {
      // If we have a valid, non-expiring-soon token, return it
      const currentToken = manager.getToken();
      if (currentToken && !manager.isExpiringSoon()) {
        return currentToken;
      }

      // If no fetcher configured, just return current token (or null)
      if (!tokenFetcher) {
        return currentToken;
      }

      // If renewal already in progress, wait for it
      if (renewalPromise) {
        return renewalPromise;
      }

      // Start renewal
      renewalPromise = (async () => {
        try {
          const response = await tokenFetcher();
          manager.setToken(response.access_token, response.expires_in);
          return response.access_token;
        } catch (error) {
          onRenewalFailure?.(error);
          return null;
        } finally {
          renewalPromise = null;
        }
      })();

      return renewalPromise;
    },
  };

  return manager;
}

/**
 * Default TokenManager instance.
 * Can be used directly or replaced with a custom instance.
 */
export const TokenManager = createTokenManager();
