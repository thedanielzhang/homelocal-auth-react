/**
 * Silent authentication for third-party apps using hidden iframe + postMessage.
 *
 * This module enables third-party apps (on different domains) to check if a user
 * is already authenticated with the auth service without requiring user interaction.
 */
/**
 * Generate cryptographically secure random state.
 */
function generateState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
/**
 * Type guard for silent callback messages.
 */
function isSilentCallbackMessage(data) {
    return (typeof data === 'object' &&
        data !== null &&
        data.type === 'iriai_silent_auth_callback');
}
/**
 * Encode state with parent origin for postMessage targeting.
 */
function encodeState(originalState, origin) {
    const payload = JSON.stringify({ state: originalState, origin });
    return btoa(payload);
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
export function trySilentAuth(config) {
    const timeout = config.timeout ?? 5000;
    const scope = config.scope ?? 'openid profile email';
    const debug = config.debug ?? false;
    const log = (...args) => {
        if (debug)
            console.log('[SilentAuth]', ...args);
    };
    return new Promise((resolve) => {
        const originalState = generateState();
        const parentOrigin = window.location.origin;
        // Encode state with parent origin for secure postMessage targeting
        const encodedState = encodeState(originalState, parentOrigin);
        // Build silent auth redirect URI (on auth service)
        const silentCallbackUrl = `${config.authServiceUrl}/oauth/silent-callback`;
        // Build authorization URL with prompt=none
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: silentCallbackUrl,
            response_type: 'code',
            scope: scope,
            state: encodedState,
            prompt: 'none',
        });
        const authUrl = `${config.authServiceUrl}/oauth/authorize?${params.toString()}`;
        log('Starting silent auth:', authUrl);
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.setAttribute('tabindex', '-1');
        let resolved = false;
        // Message handler for postMessage from iframe
        const handleMessage = (event) => {
            // Validate origin - must be from auth service
            const authOrigin = new URL(config.authServiceUrl).origin;
            if (event.origin !== authOrigin) {
                log('Ignoring message from unexpected origin:', event.origin);
                return;
            }
            // Validate message structure
            if (!isSilentCallbackMessage(event.data)) {
                log('Ignoring non-silent-auth message:', event.data);
                return;
            }
            // Validate state matches
            if (event.data.state !== originalState) {
                log('State mismatch, ignoring message');
                return;
            }
            log('Received valid callback:', event.data);
            resolved = true;
            cleanup();
            if (event.data.code) {
                resolve({
                    success: true,
                    code: event.data.code,
                    state: event.data.state,
                });
            }
            else {
                resolve({
                    success: false,
                    error: event.data.error,
                    errorDescription: event.data.errorDescription,
                    state: event.data.state,
                });
            }
        };
        // Cleanup function
        const cleanup = () => {
            window.removeEventListener('message', handleMessage);
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        };
        // Set up timeout
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                log('Silent auth timed out after', timeout, 'ms');
                resolved = true;
                cleanup();
                resolve({
                    success: false,
                    error: 'timeout',
                    errorDescription: 'Silent authentication timed out',
                });
            }
        }, timeout);
        // Listen for postMessage
        window.addEventListener('message', handleMessage);
        // Handle iframe load errors
        iframe.onerror = () => {
            if (!resolved) {
                log('Iframe load error');
                resolved = true;
                clearTimeout(timeoutId);
                cleanup();
                resolve({
                    success: false,
                    error: 'iframe_error',
                    errorDescription: 'Failed to load authentication iframe',
                });
            }
        };
        // Start the flow
        iframe.src = authUrl;
        document.body.appendChild(iframe);
    });
}
/**
 * Check if silent auth is likely to be blocked.
 *
 * Safari ITP and some browsers block third-party cookies in iframes.
 * This function provides a hint but cannot guarantee accuracy.
 */
export function isSilentAuthLikelyBlocked() {
    // Safari with ITP blocks third-party cookies
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    // Brave browser
    const isBrave = navigator.brave !== undefined;
    if (isSafari || isBrave) {
        console.warn('[SilentAuth] Browser may block third-party cookies. Silent auth might fail.');
        return true;
    }
    return false;
}
//# sourceMappingURL=silentAuth.js.map