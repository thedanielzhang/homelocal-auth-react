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
export declare function hasRole(user: User | null, role: UserRole): boolean;
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
export declare function hasAnyRole(user: User | null, roles: UserRole[]): boolean;
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
export declare function hasAllRoles(user: User | null, roles: UserRole[]): boolean;
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
export declare function isAdmin(user: User | null): boolean;
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
export declare function isDeveloper(user: User | null): boolean;
/**
 * Check if a user has the 'business' role.
 */
export declare function isBusiness(user: User | null): boolean;
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
export declare function isApprovedBusiness(user: User | null): boolean;
/**
 * Check if a user has the business role (regardless of approval status).
 * Alias for isBusiness() with clearer naming for business status context.
 */
export declare function hasBusinessRole(user: User | null): boolean;
/**
 * Check if a user has GitHub linked.
 */
export declare function hasGithubLinked(user: User | null): boolean;
/**
 * Check if a user needs developer onboarding.
 */
export declare function needsDevOnboarding(user: User | null): boolean;
//# sourceMappingURL=roles.d.ts.map