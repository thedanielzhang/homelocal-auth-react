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
/**
 * Generate a cryptographically random state parameter for CSRF protection
 */
export declare function generateOAuthState(): string;
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