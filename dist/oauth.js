/**
 * OAuth 2.0 Authorization Code Flow utilities for homelocal apps
 *
 * Usage:
 *   const oauth = createOAuthClient({
 *     clientId: 'my-app',
 *     callbackPath: '/auth/callback',
 *     authServiceUrl: 'https://auth.iriai.app'
 *   });
 *
 *   // Start login
 *   oauth.initiateLogin({ returnPath: '/dashboard' });
 *
 *   // In callback handler
 *   if (oauth.validateState(state)) {
 *     const tokens = await oauth.exchangeCode(code);
 *   }
 */
// Storage keys (namespaced to avoid collisions)
const STORAGE_KEYS = {
    STATE: 'homelocal_oauth_state',
    RETURN_PATH: 'homelocal_oauth_return_path',
};
// Default scope for OAuth requests
const DEFAULT_SCOPE = 'openid profile email';
/**
 * Generate a cryptographically random state parameter for CSRF protection
 */
export function generateOAuthState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
/**
 * Create an OAuth client with the given configuration
 *
 * @param config - OAuth configuration
 * @returns OAuth client instance with bound methods
 *
 * @example
 * ```ts
 * const oauth = createOAuthClient({
 *   clientId: 'directory-app',
 *   callbackPath: '/auth/callback',
 *   authServiceUrl: 'https://auth.iriai.app'
 * });
 *
 * // Redirect to login
 * oauth.initiateLogin({ returnPath: '/onboard' });
 * ```
 */
export function createOAuthClient(config) {
    const { clientId, callbackPath, scope = DEFAULT_SCOPE, authServiceUrl: defaultAuthServiceUrl } = config;
    /**
     * Get the full redirect URI based on current origin and configured path
     */
    function getRedirectUri() {
        if (typeof window === 'undefined') {
            throw new Error('getRedirectUri() can only be called in browser environment');
        }
        return `${window.location.origin}${callbackPath}`;
    }
    /**
     * Resolve the auth service URL from options or config
     */
    function resolveAuthServiceUrl(options) {
        const url = options?.authServiceUrl || defaultAuthServiceUrl;
        if (!url) {
            throw new Error('authServiceUrl is required. Provide it in OAuthConfig or pass it in options.');
        }
        return url;
    }
    /**
     * Initiate OAuth login flow by redirecting to the authorization endpoint
     */
    function initiateLogin(options) {
        if (typeof window === 'undefined') {
            throw new Error('initiateLogin() can only be called in browser environment');
        }
        const authServiceUrl = resolveAuthServiceUrl(options);
        const state = generateOAuthState();
        // Store state for validation on callback
        sessionStorage.setItem(STORAGE_KEYS.STATE, state);
        // Store return path if provided
        if (options?.returnPath) {
            sessionStorage.setItem(STORAGE_KEYS.RETURN_PATH, options.returnPath);
        }
        else {
            // Default to current path
            sessionStorage.setItem(STORAGE_KEYS.RETURN_PATH, window.location.pathname + window.location.search);
        }
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: getRedirectUri(),
            response_type: 'code',
            scope: scope,
            state: state,
        });
        window.location.href = `${authServiceUrl}/oauth/authorize?${params.toString()}`;
    }
    /**
     * Validate the state parameter returned from the authorization server
     */
    function validateState(returnedState) {
        if (typeof window === 'undefined') {
            return false;
        }
        const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
        return storedState !== null && storedState === returnedState;
    }
    /**
     * Exchange authorization code for tokens
     */
    async function exchangeCode(code, options) {
        const authServiceUrl = resolveAuthServiceUrl(options);
        const response = await fetch(`${authServiceUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: getRedirectUri(),
                client_id: clientId,
            }),
            credentials: 'include', // Include cookies for session establishment
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Token exchange failed' }));
            throw new Error(error.detail || error.error_description || 'Failed to exchange code for tokens');
        }
        return response.json();
    }
    /**
     * Clear OAuth-related state from session storage
     */
    function clearState() {
        if (typeof window === 'undefined')
            return;
        sessionStorage.removeItem(STORAGE_KEYS.STATE);
    }
    /**
     * Get and clear the stored return path
     */
    function getReturnPath() {
        if (typeof window === 'undefined')
            return '/';
        const path = sessionStorage.getItem(STORAGE_KEYS.RETURN_PATH);
        sessionStorage.removeItem(STORAGE_KEYS.RETURN_PATH);
        return path || '/';
    }
    /**
     * Get the OAuth configuration
     */
    function getConfig() {
        return { clientId, callbackPath, scope, authServiceUrl: defaultAuthServiceUrl };
    }
    return {
        initiateLogin,
        validateState,
        exchangeCode,
        clearState,
        getReturnPath,
        getRedirectUri,
        getConfig,
    };
}
/**
 * Parse OAuth callback URL parameters
 *
 * @param searchParams - URL search params from callback
 * @returns Parsed callback data or error
 *
 * @example
 * ```ts
 * const result = parseOAuthCallback(new URLSearchParams(window.location.search));
 * if (result.error) {
 *   console.error(result.error, result.errorDescription);
 * } else {
 *   const { code, state } = result;
 * }
 * ```
 */
export function parseOAuthCallback(searchParams) {
    const error = searchParams.get('error');
    if (error) {
        return {
            error,
            errorDescription: searchParams.get('error_description') || undefined,
        };
    }
    return {
        code: searchParams.get('code') || undefined,
        state: searchParams.get('state') || undefined,
    };
}
//# sourceMappingURL=oauth.js.map