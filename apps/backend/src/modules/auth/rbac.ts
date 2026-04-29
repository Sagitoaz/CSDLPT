/**
 * Role-Based Access Control (RBAC) Configuration
 * SECURITY-06: Least-privilege access control
 * SECURITY-08: Role permissions mapping
 *
 * This file defines what each role can do in the application.
 * Used by RBAC middleware to enforce authorization.
 */

import { UserRole } from './auth.model';

/**
 * Granular permissions
 */
export enum Permission {
  BRANCH_MANAGE = 'branch:manage',
  USER_MANAGE = 'user:manage',
  // Campaign permissions
  CAMPAIGN_CREATE = 'campaign:create',
  CAMPAIGN_READ = 'campaign:read',
  CAMPAIGN_UPDATE = 'campaign:update',
  CAMPAIGN_DELETE = 'campaign:delete',
  CAMPAIGN_LIST = 'campaign:list',

  // Donation permissions
  DONATION_CREATE = 'donation:create',
  DONATION_READ = 'donation:read',
  DONATION_UPDATE = 'donation:update',
  DONATION_APPROVE = 'donation:approve',
  DONATION_REJECT = 'donation:reject',
  DONATION_LIST = 'donation:list',
  DONATION_LIST_ALL = 'donation:list_all', // Admin: list all donations

  // Stats permissions
  STATS_READ = 'stats:read',
  STATS_OVERVIEW = 'stats:overview',

  // User management
  USER_LIST = 'user:list',
  USER_DEACTIVATE = 'user:deactivate',
  USER_CREATE = 'user:create',

  // System
  SYSTEM_HEALTH = 'system:health',
}

/**
 * Role to Permissions Mapping
 * SECURITY-06: Each role has only the permissions it needs
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  /**
   * Admin Role
   * - Full access to all campaigns and donations
   * - Can approve/reject donations
   * - Can manage users
   */
  [UserRole.SUPER_ADMIN]: [
    Permission.BRANCH_MANAGE,
    Permission.USER_MANAGE,
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.CAMPAIGN_DELETE,
    Permission.CAMPAIGN_LIST,
    Permission.DONATION_CREATE,
    Permission.DONATION_READ,
    Permission.DONATION_UPDATE,
    Permission.DONATION_APPROVE,
    Permission.DONATION_REJECT,
    Permission.DONATION_LIST_ALL,
    Permission.STATS_READ,
    Permission.STATS_OVERVIEW,
    Permission.USER_LIST,
    Permission.USER_DEACTIVATE,
    Permission.USER_CREATE,
    Permission.SYSTEM_HEALTH,
  ],

  /**
   * Staff Role
   * - Can create and manage campaigns
   * - Can approve/reject donations
   * - Can view donation and campaign stats
   * - Limited user access (list only)
   */
  [UserRole.BRANCH_ADMIN]: [
    Permission.USER_MANAGE,
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.CAMPAIGN_LIST,
    Permission.DONATION_READ,
    Permission.DONATION_APPROVE,
    Permission.DONATION_REJECT,
    Permission.DONATION_LIST_ALL,
    Permission.STATS_READ,
    Permission.STATS_OVERVIEW,
    Permission.USER_LIST,
    Permission.SYSTEM_HEALTH,
  ],

  [UserRole.STAFF]: [
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.CAMPAIGN_LIST,
    Permission.DONATION_READ,
    Permission.DONATION_APPROVE,
    Permission.DONATION_REJECT,
    Permission.DONATION_LIST_ALL,
    Permission.STATS_READ,
    Permission.STATS_OVERVIEW,
    Permission.USER_LIST,
    Permission.SYSTEM_HEALTH,
  ],

  /**
   * Donor Role (Default)
   * - Can create donations
   * - Can view public campaigns
   * - Can view own donations and their stats
   * - Cannot modify other users' data
   */
  [UserRole.DONOR]: [
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_LIST,
    Permission.DONATION_CREATE,
    Permission.DONATION_READ,
    Permission.DONATION_LIST,
    Permission.STATS_READ,
    Permission.SYSTEM_HEALTH,
  ],
};

/**
 * Check if a role has a specific permission
 * SECURITY-08: Used by middleware for authorization
 *
 * @param role - User role
 * @param permission - Required permission
 * @returns true if role has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 * @param role - User role
 * @returns Array of permissions
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Check if a role has any of the given permissions
 * @param role - User role
 * @param permissions - Array of permissions to check
 * @returns true if role has any of the permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the given permissions
 * @param role - User role
 * @param permissions - Array of permissions to check
 * @returns true if role has all permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Role Hierarchy (for reference)
 * Not used in code but helps understand relationships
 *
 * ADMIN > STAFF > DONOR
 *
 * - Admin has all permissions
 * - Staff has permissions for operations
 * - Donor has minimal read permissions and can create donations
 */
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.BRANCH_ADMIN]: 3,
  [UserRole.STAFF]: 2,
  [UserRole.DONOR]: 1
};

/**
 * Check if userRole can be assigned by assignerRole
 * SECURITY-06: Least-privilege for user management
 *
 * - Admins can assign any role
 * - Staff cannot assign roles
 * - Donors cannot assign roles
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  // Only admins can assign roles
  if (assignerRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (assignerRole !== UserRole.BRANCH_ADMIN) {
    return false;
  }

  return targetRole === UserRole.STAFF || targetRole === UserRole.DONOR;
}
