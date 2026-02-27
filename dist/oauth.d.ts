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
import type { OAuthConfig, OAuthClient } from './types';
export declare const STORAGE_KEYS: {
    readonly STATE: "homelocal_oauth_state";
    readonly RETURN_PATH: "homelocal_oauth_return_path";
    readonly CODE_VERIFIER: "homelocal_oauth_code_verifier";
};
/**
 * Generate a cryptographically random state parameter for CSRF protection
 */
export declare function generateOAuthState(): string;
/**
 * Generate a PKCE code_verifier (43-128 character URL-safe random string)
 */
export declare function generateCodeVerifier(): string;
/**
 * Compute PKCE code_challenge from a code_verifier using S256 method
 * code_challenge = base64url(sha256(code_verifier))
 */
export declare function generateCodeChallenge(verifier: string): Promise<string>;
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
export declare function createOAuthClient(config: OAuthConfig): OAuthClient;
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
export declare function parseOAuthCallback(searchParams: URLSearchParams): {
    code?: string;
    state?: string;
    error?: string;
    errorDescription?: string;
};
//# sourceMappingURL=oauth.d.ts.map