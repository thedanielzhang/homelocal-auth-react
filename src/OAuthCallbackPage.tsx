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

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useOAuth, type UseOAuthConfig } from './useOAuth';

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
 * Default processing state UI
 */
function DefaultProcessing() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }}
      />
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>
        Completing sign in...
      </h1>
      <p style={{ color: '#6b7280', marginTop: 8 }}>
        Please wait while we complete your authentication.
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Default success state UI
 */
function DefaultSuccess() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 48,
          height: 48,
          backgroundColor: '#d1fae5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>
        Sign in successful!
      </h1>
      <p style={{ color: '#6b7280', marginTop: 8 }}>Redirecting you now...</p>
    </div>
  );
}

/**
 * Default error state UI
 */
function DefaultError({
  error,
  onRetry,
  onHome,
}: {
  error: string;
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 48,
          height: 48,
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>
        Sign in failed
      </h1>
      <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Try again
        </button>
        <button
          onClick={onHome}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Return home
        </button>
      </div>
    </div>
  );
}

/**
 * OAuth callback page component
 *
 * Drop-in component for handling OAuth callbacks with sensible defaults.
 * Customize the UI by providing custom components or use the callbacks
 * for full control.
 */
export function OAuthCallbackPage({
  clientId,
  callbackPath,
  scope,
  authServiceUrl,
  onSuccess,
  onError,
  processingComponent,
  successComponent,
  errorComponent,
  homeUrl = '/',
  successRedirectDelay = 500,
}: OAuthCallbackPageProps) {
  const [status, setStatus] = useState<OAuthCallbackStatus>('processing');
  const [error, setError] = useState<string | null>(null);

  const { handleCallback, getReturnPath, initiateLogin, clearState } = useOAuth({
    clientId,
    callbackPath,
    scope,
    authServiceUrl,
  });

  const handleRetry = useCallback(() => {
    clearState();
    initiateLogin();
  }, [clearState, initiateLogin]);

  const handleHome = useCallback(() => {
    clearState();
    window.location.href = homeUrl;
  }, [clearState, homeUrl]);

  useEffect(() => {
    let mounted = true;

    async function processCallback() {
      try {
        await handleCallback();

        if (!mounted) return;

        const returnPath = getReturnPath();
        setStatus('success');

        // Call success handler or redirect after delay
        setTimeout(() => {
          if (!mounted) return;
          if (onSuccess) {
            onSuccess(returnPath);
          } else {
            window.location.href = returnPath;
          }
        }, successRedirectDelay);

      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setStatus('error');
        setError(errorMessage);

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
      }
    }

    processCallback();

    return () => {
      mounted = false;
    };
  }, [handleCallback, getReturnPath, onSuccess, onError, successRedirectDelay]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 400, width: '100%' }}>
        {status === 'processing' && (processingComponent || <DefaultProcessing />)}
        {status === 'success' && (successComponent || <DefaultSuccess />)}
        {status === 'error' &&
          (errorComponent ? (
            errorComponent({ error: error || 'Unknown error', onRetry: handleRetry, onHome: handleHome })
          ) : (
            <DefaultError error={error || 'Unknown error'} onRetry={handleRetry} onHome={handleHome} />
          ))}
      </div>
    </div>
  );
}
