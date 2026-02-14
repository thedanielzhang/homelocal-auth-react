/**
 * JWT utility functions shared between AuthProvider and ExternalTokenProvider.
 *
 * Decode JWT payloads client-side (without verification) and extract
 * a User object from the standard claims.
 */
import type { User } from './types';
/**
 * Decode a JWT payload without verification (browser-side).
 * The token was already validated server-side before being issued.
 */
export declare function decodeJwtPayload(token: string): Record<string, unknown> | null;
/**
 * Extract User object from JWT claims.
 * Matches the shape returned by auth-service and expected by useAuth().
 */
export declare function userFromClaims(claims: Record<string, unknown>): User;
//# sourceMappingURL=jwtUtils.d.ts.map