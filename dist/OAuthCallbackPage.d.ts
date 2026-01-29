/**
 * Reusable OAuth callback page component
 *
 * Handles the OAuth callback flow with built-in UI states for:
 * - Processing (loading spinner)
 * - Success (checkmark, redirect)
 * - Error (error message, retry options)
 *
 * Usage:
 *   <Route path="/auth/callback" element={
 *     <OAuthCallbackPage
 *       clientId="my-app"
 *       callbackPath="/auth/callback"
 *       onSuccess={() => window.location.href = '/dashboard'}
 *     />
 *   } />
 */
import { type ReactNode } from 'react';
import { type UseOAuthConfig } from './useOAuth';
export type OAuthCallbackStatus = 'processing' | 'success' | 'error';
export interface OAuthCallbackPageProps extends UseOAuthConfig {
    /**
     * Called after successful token exchange
     * @param returnPath - The path the user was trying to access before login
     */
    onSuccess?: (returnPath: string) => void;
    /**
     * Called when an error occurs
     * @param error - The error that occurred
     */
    onError?: (error: Error) => void;
    /**
     * Custom component to render during processing
     */
    processingComponent?: ReactNode;
    /**
     * Custom component to render on success
     */
    successComponent?: ReactNode;
    /**
     * Custom component to render on error
     * @param error - Error message
     * @param onRetry - Function to retry login
     * @param onHome - Function to go home
     */
    errorComponent?: (props: {
        error: string;
        onRetry: () => void;
        onHome: () => void;
    }) => ReactNode;
    /**
     * URL to redirect to on "Go Home" action
     * @default '/'
     */
    homeUrl?: string;
    /**
     * Delay before redirecting after success (ms)
     * @default 500
     */
    successRedirectDelay?: number;
}
/**
 * OAuth callback page component
 *
 * Drop-in component for handling OAuth callbacks with sensible defaults.
 * Customize the UI by providing custom components or use the callbacks
 * for full control.
 */
export declare function OAuthCallbackPage({ clientId, callbackPath, scope, authServiceUrl, onSuccess, onError, processingComponent, successComponent, errorComponent, homeUrl, successRedirectDelay, }: OAuthCallbackPageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=OAuthCallbackPage.d.ts.map