/**
 * React hook for OAuth operations
 *
 * Automatically uses authServiceUrl from AuthProvider context,
 * so apps don't need to duplicate configuration.
 *
 * Usage:
 *   const { initiateLogin, handleCallback } = useOAuth({
 *     clientId: 'my-app',
 *     callbackPath: '/auth/callback'
 *   });
 */
import { useMemo, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { createOAuthClient, parseOAuthCallback, STORAGE_KEYS } from './oauth';
/**
 * Check if a decoded state is a registration flow state
 */
function isRegistrationState(state) {
    return (typeof state === 'object' &&
        state !== null &&
        'type' in state &&
        state.type === 'registration' &&
        'ts' in state &&
        typeof state.ts === 'number');
}
/**
 * React hook for OAuth operations
 *
 * Integrates with AuthProvider to automatically use the configured authServiceUrl.
 *
 * @param config - OAuth configuration (clientId and callbackPath required)
 * @returns OAuth operations bound to the configuration
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { initiateLogin } = useOAuth({
 *     clientId: 'directory-app',
 *     callbackPath: '/auth/callback'
 *   });
 *
 *   return (
 *     <button onClick={() => initiateLogin('/dashboard')}>
 *       Sign In
 *     </button>
 *   );
 * }
 * ```
 */
export function useOAuth(config) {
    const { authServiceUrl: contextAuthServiceUrl } = useAuth();
    // Resolve auth service URL: explicit config > context > error
    const authServiceUrl = config.authServiceUrl || contextAuthServiceUrl;
    // Create OAuth client with resolved config
    const oauthClient = useMemo(() => {
        if (!authServiceUrl) {
            // Return a client that will throw helpful errors when methods are called
            // This allows the hook to be used during SSR or before AuthProvider is ready
            return createOAuthClient({
                ...config,
                authServiceUrl: '', // Will throw when methods requiring URL are called
            });
        }
        return createOAuthClient({
            ...config,
            authServiceUrl,
        });
    }, [config.clientId, config.callbackPath, config.scope, authServiceUrl]);
    // Wrap initiateLogin to accept just returnPath for convenience
    const initiateLogin = useCallback((returnPath) => {
        if (!authServiceUrl) {
            throw new Error('authServiceUrl is not configured. Ensure AuthProvider is set up with authServiceUrl, ' +
                'or pass authServiceUrl directly to useOAuth config.');
        }
        oauthClient.initiateLogin({ returnPath });
    }, [oauthClient, authServiceUrl]);
    // Parse callback from current URL
    const parseCallback = useCallback(() => {
        if (typeof window === 'undefined') {
            return {};
        }
        return parseOAuthCallback(new URLSearchParams(window.location.search));
    }, []);
    // Handle the full callback flow
    const handleCallback = useCallback(async () => {
        if (!authServiceUrl) {
            throw new Error('authServiceUrl is not configured. Ensure AuthProvider is set up with authServiceUrl.');
        }
        const { code, state, error, errorDescription } = parseCallback();
        if (error) {
            oauthClient.clearState();
            throw new Error(errorDescription || error);
        }
        if (!code || !state) {
            oauthClient.clearState();
            throw new Error('Missing authorization code or state parameter');
        }
        // Check if this is a registration flow (state contains type: "registration")
        // Registration flows come from auth-frontend after user registration,
        // and bypass normal CSRF validation since they can't share sessionStorage
        let isRegistrationFlow = false;
        try {
            const decodedState = JSON.parse(atob(state));
            if (isRegistrationState(decodedState)) {
                // Validate timestamp (2 minute expiry for safety margin)
                const age = Date.now() - decodedState.ts;
                if (age > 120000) {
                    oauthClient.clearState();
                    throw new Error('Registration link expired. Please try again.');
                }
                isRegistrationFlow = true;
                // Store returnUrl for post-callback navigation
                // This enables getReturnPath() to find the intended destination
                if (decodedState.returnUrl) {
                    sessionStorage.setItem(STORAGE_KEYS.RETURN_PATH, decodedState.returnUrl);
                }
            }
        }
        catch (e) {
            // Not a JSON state or parse error - continue with normal validation
            // But re-throw if it's our expiry error
            if (e instanceof Error && e.message.includes('expired')) {
                throw e;
            }
        }
        // For non-registration flows, validate state against stored value (CSRF protection)
        if (!isRegistrationFlow && !oauthClient.validateState(state)) {
            oauthClient.clearState();
            throw new Error('Invalid state parameter. Possible CSRF attack. Please try logging in again.');
        }
        try {
            const tokens = await oauthClient.exchangeCode(code);
            oauthClient.clearState();
            return tokens;
        }
        catch (err) {
            oauthClient.clearState();
            throw err;
        }
    }, [oauthClient, authServiceUrl, parseCallback]);
    // Get redirect URI (safe to call anytime)
    const redirectUri = useMemo(() => {
        if (typeof window === 'undefined')
            return '';
        try {
            return oauthClient.getRedirectUri();
        }
        catch {
            return '';
        }
    }, [oauthClient]);
    return {
        initiateLogin,
        handleCallback,
        parseCallback,
        validateState: oauthClient.validateState,
        clearState: oauthClient.clearState,
        getReturnPath: oauthClient.getReturnPath,
        redirectUri,
    };
}
//# sourceMappingURL=useOAuth.js.map