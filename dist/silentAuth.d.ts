/**
 * Silent authentication for third-party apps using hidden iframe + postMessage.
 *
 * This module enables third-party apps (on different domains) to check if a user
 * is already authenticated with the auth service without requiring user interaction.
 */
export interface SilentAuthConfig {
    /** Auth service base URL (e.g., https://auth.iriai.app) */
    authServiceUrl: string;
    /** OAuth client ID */
    clientId: string;
    /** Scopes to request (default: openid profile email) */
    scope?: string;
    /** Timeout in milliseconds (default: 5000) */
    timeout?: number;
    /** Enable debug logging (default: false) */
    debug?: boolean;
}
export interface SilentAuthResult {
    /** Whether silent auth succeeded */
    success: boolean;
    /** Authorization code (if success) */
    code?: string;
    /** Error code (if failure) */
    error?: string;
    /** Error description (if failure) */
    errorDescription?: string;
    /** Original state value */
    state?: string;
}
/**
 * Attempt silent authentication using hidden iframe.
 *
 * @param config - Silent auth configuration
 * @returns Promise resolving to auth result (code or error)
 *
 * @example
 * ```typescript
 * const result = await trySilentAuth({
 *   authServiceUrl: 'https://auth.iriai.app',
 *   clientId: 'my-app',
 * });
 *
 * if (result.success) {
 *   // Exchange result.code for tokens via BFF
 * } else {
 *   // Show login button
 * }
 * ```
 */
export declare function trySilentAuth(config: SilentAuthConfig): Promise<SilentAuthResult>;
/**
 * Check if silent auth is likely to be blocked.
 *
 * Safari ITP and some browsers block third-party cookies in iframes.
 * This function provides a hint but cannot guarantee accuracy.
 */
export declare function isSilentAuthLikelyBlocked(): boolean;
//# sourceMappingURL=silentAuth.d.ts.map