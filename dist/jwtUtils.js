/**
 * JWT utility functions shared between AuthProvider and ExternalTokenProvider.
 *
 * Decode JWT payloads client-side (without verification) and extract
 * a User object from the standard claims.
 */
/**
 * Decode a JWT payload without verification (browser-side).
 * The token was already validated server-side before being issued.
 */
export function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
}
/**
 * Extract User object from JWT claims.
 * Matches the shape returned by auth-service and expected by useAuth().
 */
export function userFromClaims(claims) {
    return {
        id: claims.sub || '',
        email: claims.email || '',
        name: claims.name || '',
        home_geo_region: null,
        roles: claims.roles || [],
        account_type: claims.account_type,
        business_status: claims.business_status || null,
    };
}
//# sourceMappingURL=jwtUtils.js.map