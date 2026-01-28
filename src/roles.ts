/**
 * Role helper functions.
 */

import type { User, UserRole } from './types';

/**
 * Check if a user has a specific role.
 *
 * @example
 * ```ts
 * if (hasRole(user, 'admin')) {
 *   // Admin-only logic
 * }
 * ```
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
}

/**
 * Check if a user has any of the specified roles.
 *
 * @example
 * ```ts
 * if (hasAnyRole(user, ['dev', 'admin'])) {
 *   // Dev or admin logic
 * }
 * ```
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user || !user.roles) return false;
  return roles.some((role) => user.roles?.includes(role));
}

/**
 * Check if a user has all of the specified roles.
 *
 * @example
 * ```ts
 * if (hasAllRoles(user, ['dev', 'business'])) {
 *   // User has both roles
 * }
 * ```
 */
export function hasAllRoles(user: User | null, roles: UserRole[]): boolean {
  if (!user || !user.roles) return false;
  return roles.every((role) => user.roles?.includes(role));
}

/**
 * Check if a user has the 'admin' role.
 *
 * @example
 * ```ts
 * if (isAdmin(user)) {
 *   return <AdminPanel />;
 * }
 * ```
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if a user has the 'dev' role.
 *
 * @example
 * ```ts
 * if (isDeveloper(user)) {
 *   return <DeveloperConsole />;
 * }
 * ```
 */
export function isDeveloper(user: User | null): boolean {
  return hasRole(user, 'dev');
}

/**
 * Check if a user has the 'business' role.
 */
export function isBusiness(user: User | null): boolean {
  return hasRole(user, 'business');
}

/**
 * Check if a user is an approved business.
 * Returns true only if user has business role AND status is 'approved'.
 *
 * @example
 * ```ts
 * if (isApprovedBusiness(user)) {
 *   // Allow business-only actions
 * }
 * ```
 */
export function isApprovedBusiness(user: User | null): boolean {
  return user?.business_status === 'approved';
}

/**
 * Check if a user has the business role (regardless of approval status).
 * Alias for isBusiness() with clearer naming for business status context.
 */
export function hasBusinessRole(user: User | null): boolean {
  return hasRole(user, 'business');
}

/**
 * Check if a user has GitHub linked.
 */
export function hasGithubLinked(user: User | null): boolean {
  return user?.github_linked === true;
}

/**
 * Check if a user needs developer onboarding.
 */
export function needsDevOnboarding(user: User | null): boolean {
  if (!user) return false;
  return user.dev_onboarding_state !== 'complete';
}
