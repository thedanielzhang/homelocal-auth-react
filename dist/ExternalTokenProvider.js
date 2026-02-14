import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ExternalTokenProvider — Auth context for micro-frontend mode.
 *
 * Accepts an external getAccessToken function (from the PWA shell)
 * and populates the same AuthContext that useAuth() reads from.
 * Does NOT initiate OAuth flows — login actions are delegated to
 * the host shell via onLoginRequest callback.
 */
import { useState, useEffect, useCallback, useMemo, useRef, } from 'react';
import { createTokenManager } from './TokenManager';
import { hasRole, hasAnyRole, isAdmin, isDeveloper } from './roles';
import { AuthContext } from './AuthContext';
import { decodeJwtPayload, userFromClaims } from './jwtUtils';
/**
 * Auth provider for micro-frontend mode.
 *
 * Provides the same useAuth() interface as AuthProvider but sources
 * tokens from an external getAccessToken function.
 */
export function ExternalTokenProvider({ getAccessToken, onLoginRequest, onLogoutRequest, authServiceUrl = '', tokenPollInterval = 5000, children, }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const lastTokenRef = useRef(null);
    // Create a token manager that delegates to getAccessToken
    const tokenManager = useMemo(() => {
        return createTokenManager({
            storageKey: 'mf_access_token',
            expiryKey: 'mf_access_token_expiry',
        });
    }, []);
    // Sync token from external source
    const syncToken = useCallback(() => {
        const token = getAccessToken();
        // No change
        if (token === lastTokenRef.current)
            return;
        lastTokenRef.current = token;
        if (!token) {
            setUser(null);
            tokenManager.clearToken();
            setIsLoading(false);
            return;
        }
        // Decode JWT to extract user info
        const claims = decodeJwtPayload(token);
        if (!claims) {
            setUser(null);
            tokenManager.clearToken();
            setIsLoading(false);
            return;
        }
        // Extract expiry and store in token manager
        const exp = claims.exp;
        if (exp) {
            const expiresIn = exp - Math.floor(Date.now() / 1000);
            if (expiresIn > 0) {
                tokenManager.setToken(token, expiresIn);
            }
        }
        setUser(userFromClaims(claims));
        setIsLoading(false);
    }, [getAccessToken, tokenManager]);
    // Initial sync + polling
    useEffect(() => {
        syncToken();
        const interval = setInterval(syncToken, tokenPollInterval);
        return () => clearInterval(interval);
    }, [syncToken, tokenPollInterval]);
    // No-op login — delegate to PWA shell
    const login = useCallback(async () => {
        if (onLoginRequest) {
            onLoginRequest();
        }
    }, [onLoginRequest]);
    // No-op logout — delegate to PWA shell
    const logout = useCallback(async () => {
        if (onLogoutRequest) {
            onLogoutRequest();
        }
    }, [onLogoutRequest]);
    // No-op signup
    const signup = useCallback(async () => {
        throw new Error('Signup not available in micro-frontend mode');
    }, []);
    // refreshUser just re-syncs from the external token
    const refreshUser = useCallback(async () => {
        syncToken();
        return user;
    }, [syncToken, user]);
    // refreshToken is a no-op — the PWA shell manages refresh
    const refreshToken = useCallback(async () => {
        syncToken();
    }, [syncToken]);
    const clearError = useCallback(() => setError(null), []);
    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        signup,
        refreshUser,
        refreshToken,
        clearError,
        hasRole: (role) => hasRole(user, role),
        hasAnyRole: (roles) => hasAnyRole(user, roles),
        isAdmin: isAdmin(user),
        isDeveloper: isDeveloper(user),
        getTokenManager: () => tokenManager,
        authServiceUrl,
    }), [user, isLoading, error, login, logout, signup, refreshUser, refreshToken, clearError, tokenManager, authServiceUrl]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
//# sourceMappingURL=ExternalTokenProvider.js.map