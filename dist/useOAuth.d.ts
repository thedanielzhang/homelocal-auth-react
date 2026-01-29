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
import { parseOAuthCallback } from './oauth';
import type { OAuthConfig, OAuthTokenResponse } from './types';
/**
 * Configuration for useOAuth hook
 * authServiceUrl is optional - will use value from AuthProvider if not specified
 */
export type UseOAuthConfig = Omit<OAuthConfig, 'authServiceUrl'> & {
    authServiceUrl?: string;
};
/**
 * Return type for useOAuth hook
 */
export interface UseOAuthReturn {
    /** Redirect to OAuth login */
    initiateLogin: (returnPath?: string) => void;
    /**
     * Handle OAuth callback - validates state and exchanges code
     * @returns Token response on success
     * @throws Error on validation or exchange failure
     */
    handleCallback: () => Promise<OAuthTokenResponse>;
    /** Parse current URL for OAuth callback parameters */
    parseCallback: () => ReturnType<typeof parseOAuthCallback>;
    /** Validate state parameter */
    validateState: (state: string) => boolean;
    /** Clear OAuth state from storage */
    clearState: () => void;
    /** Get stored return path and clear it */
    getReturnPath: () => string;
    /** The configured redirect URI */
    redirectUri: string;
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
export declare function useOAuth(config: UseOAuthConfig): UseOAuthReturn;
//# sourceMappingURL=useOAuth.d.ts.map