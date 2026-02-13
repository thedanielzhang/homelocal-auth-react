/**
 * ExternalTokenProvider — Auth context for micro-frontend mode.
 *
 * Accepts an external getAccessToken function (from the PWA shell)
 * and populates the same AuthContext that useAuth() reads from.
 * Does NOT initiate OAuth flows — login actions are delegated to
 * the host shell via onLoginRequest callback.
 */
import { type ReactNode } from 'react';
export interface ExternalTokenProviderProps {
    /**
     * Function that returns the current access token from the PWA shell.
     * Called on mount and periodically to detect token changes.
     */
    getAccessToken: () => string | null;
    /**
     * Called when the micro-frontend needs login (e.g., user clicks a
     * protected action). The PWA shell handles the actual OAuth flow.
     */
    onLoginRequest?: () => void;
    /**
     * Called when the micro-frontend wants to log out.
     * The PWA shell handles actual logout + token cleanup.
     */
    onLogoutRequest?: () => void;
    /**
     * Auth service URL (for display/reference only — not used for API calls).
     */
    authServiceUrl?: string;
    /**
     * Polling interval (ms) for checking token changes.
     * @default 5000
     */
    tokenPollInterval?: number;
    children: ReactNode;
}
/**
 * Auth provider for micro-frontend mode.
 *
 * Provides the same useAuth() interface as AuthProvider but sources
 * tokens from an external getAccessToken function.
 */
export declare function ExternalTokenProvider({ getAccessToken, onLoginRequest, onLogoutRequest, authServiceUrl, tokenPollInterval, children, }: ExternalTokenProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ExternalTokenProvider.d.ts.map