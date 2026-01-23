/**
 * Token Manager - Handles JWT storage, retrieval, and renewal.
 *
 * Implements dual storage (memory + sessionStorage) for:
 * - Fast access from memory
 * - Persistence across page refreshes via sessionStorage
 * - Graceful fallback when sessionStorage unavailable (SSR, private browsing)
 */
/**
 * Create a new TokenManager instance.
 */
export function createTokenManager(config = {}) {
    const { storageKey = 'access_token', expiryKey = 'access_token_expiry', expiryBuffer = 60, tokenFetcher, onRenewalFailure, } = config;
    // In-memory storage
    let memoryToken = null;
    let memoryExpiry = null;
    // Renewal state to prevent concurrent renewals
    let renewalPromise = null;
    /**
     * Read from sessionStorage safely.
     */
    function readStorage() {
        try {
            const token = sessionStorage.getItem(storageKey);
            const expiryStr = sessionStorage.getItem(expiryKey);
            const expiry = expiryStr ? parseInt(expiryStr, 10) : null;
            return { token, expiry };
        }
        catch {
            // sessionStorage not available
            return { token: null, expiry: null };
        }
    }
    /**
     * Write to sessionStorage safely.
     */
    function writeStorage(token, expiry) {
        try {
            sessionStorage.setItem(storageKey, token);
            sessionStorage.setItem(expiryKey, expiry.toString());
        }
        catch {
            // sessionStorage not available
        }
    }
    /**
     * Clear sessionStorage safely.
     */
    function clearStorage() {
        try {
            sessionStorage.removeItem(storageKey);
            sessionStorage.removeItem(expiryKey);
        }
        catch {
            // sessionStorage not available
        }
    }
    /**
     * Check if a token with given expiry is valid.
     */
    function isTokenValid(token, expiry) {
        if (!token || expiry === null)
            return false;
        return Date.now() < expiry;
    }
    /**
     * Check if expiring within buffer.
     */
    function isExpiringSoonCheck(expiry) {
        if (expiry === null)
            return false;
        const bufferMs = expiryBuffer * 1000;
        return Date.now() >= expiry - bufferMs;
    }
    const manager = {
        getToken() {
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
        setToken(token, expiresIn) {
            const expiryTime = Date.now() + expiresIn * 1000;
            memoryToken = token;
            memoryExpiry = expiryTime;
            writeStorage(token, expiryTime);
        },
        clearToken() {
            memoryToken = null;
            memoryExpiry = null;
            clearStorage();
        },
        hasValidToken() {
            return manager.getToken() !== null;
        },
        isExpiringSoon() {
            // Get current expiry
            if (memoryExpiry !== null) {
                return isExpiringSoonCheck(memoryExpiry);
            }
            const { expiry } = readStorage();
            return isExpiringSoonCheck(expiry);
        },
        getExpiresIn() {
            let expiry = memoryExpiry;
            if (expiry === null) {
                const stored = readStorage();
                expiry = stored.expiry;
            }
            if (expiry === null)
                return null;
            const remaining = Math.floor((expiry - Date.now()) / 1000);
            return Math.max(0, remaining);
        },
        async ensureAccessToken() {
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
                }
                catch (error) {
                    onRenewalFailure?.(error);
                    return null;
                }
                finally {
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
//# sourceMappingURL=TokenManager.js.map