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
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Extract User object from JWT claims.
 * Matches the shape returned by auth-service and expected by useAuth().
 */
export function userFromClaims(claims: Record<string, unknown>): User {
  return {
    id: (claims.sub as string) || '',
    email: (claims.email as string) || '',
    name: (claims.name as string) || '',
    home_geo_region: null,
    roles: (claims.roles as string[]) || [],
    account_type: claims.account_type as string | undefined,
    business_status: (claims.business_status as User['business_status']) || null,
  };
}
