import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useState, useCallback } from 'react';
import { useOAuth } from './useOAuth';
/**
 * Default processing state UI
 */
function DefaultProcessing() {
    return (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: {
                    width: 48,
                    height: 48,
                    border: '3px solid #e5e7eb',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                } }), _jsx("h1", { style: { fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }, children: "Completing sign in..." }), _jsx("p", { style: { color: '#6b7280', marginTop: 8 }, children: "Please wait while we complete your authentication." }), _jsx("style", { children: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` })] }));
}
/**
 * Default success state UI
 */
function DefaultSuccess() {
    return (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: {
                    width: 48,
                    height: 48,
                    backgroundColor: '#d1fae5',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                }, children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "#059669", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "20 6 9 17 4 12" }) }) }), _jsx("h1", { style: { fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }, children: "Sign in successful!" }), _jsx("p", { style: { color: '#6b7280', marginTop: 8 }, children: "Redirecting you now..." })] }));
}
/**
 * Default error state UI
 */
function DefaultError({ error, onRetry, onHome, }) {
    return (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: {
                    width: 48,
                    height: 48,
                    backgroundColor: '#fee2e2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                }, children: _jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "#dc2626", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) }), _jsx("h1", { style: { fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }, children: "Sign in failed" }), _jsx("p", { style: { color: '#dc2626', marginTop: 8 }, children: error }), _jsxs("div", { style: { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }, children: [_jsx("button", { onClick: onRetry, style: {
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }, children: "Try again" }), _jsx("button", { onClick: onHome, style: {
                            padding: '8px 16px',
                            backgroundColor: 'white',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }, children: "Return home" })] })] }));
}
/**
 * OAuth callback page component
 *
 * Drop-in component for handling OAuth callbacks with sensible defaults.
 * Customize the UI by providing custom components or use the callbacks
 * for full control.
 */
export function OAuthCallbackPage({ clientId, callbackPath, scope, authServiceUrl, onSuccess, onError, processingComponent, successComponent, errorComponent, homeUrl = '/', successRedirectDelay = 500, }) {
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
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
                if (!mounted)
                    return;
                const returnPath = getReturnPath();
                setStatus('success');
                // Call success handler or redirect after delay
                setTimeout(() => {
                    if (!mounted)
                        return;
                    if (onSuccess) {
                        onSuccess(returnPath);
                    }
                    else {
                        window.location.href = returnPath;
                    }
                }, successRedirectDelay);
            }
            catch (err) {
                if (!mounted)
                    return;
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
    return (_jsx("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            padding: 16,
        }, children: _jsxs("div", { style: { maxWidth: 400, width: '100%' }, children: [status === 'processing' && (processingComponent || _jsx(DefaultProcessing, {})), status === 'success' && (successComponent || _jsx(DefaultSuccess, {})), status === 'error' &&
                    (errorComponent ? (errorComponent({ error: error || 'Unknown error', onRetry: handleRetry, onHome: handleHome })) : (_jsx(DefaultError, { error: error || 'Unknown error', onRetry: handleRetry, onHome: handleHome })))] }) }));
}
//# sourceMappingURL=OAuthCallbackPage.js.map