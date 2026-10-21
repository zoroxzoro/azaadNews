/**
 * Article Permissions & Role Capabilities
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Defines newsroom role hierarchy and permissions for:
 * 1. Super Admin (Full CMS authority, team management, delete, global settings)
 * 2. Admin (Own article creation, drafts, editing, scheduling, publishing; no delete; no staff management)
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  // Backward compatibility aliases
  EDITOR: 'admin',
  AUTHOR: 'admin',
};

export const APPROVAL_STATUS = {
  INVITED: 'invited',
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
};

export const ROLE_CAPABILITIES = {
  [ROLES.SUPER_ADMIN]: {
    canCreate: true,
    canEditAny: true,
    canPublish: true,
    canSchedule: true,
    canUnpublish: true,
    canDelete: true,
    canBulkManage: true,
    canManageStaff: true,
    canManageUsers: true,
    canInviteAdmin: true,
    canApproveAdmin: true,
    canSuspendAdmin: true,
    canReactivateAdmin: true,
    canRevokeAdmin: true,
    canChangeRoles: true,
    canManageCategories: true,
    canManageSettings: true,
    canUploadMedia: true,
    canUseMedia: true,
    canViewAllArticles: true,
    labelHindi: 'प्रधान व्यवस्थापक (Super Admin)',
  },
  [ROLES.ADMIN]: {
    canCreate: true,
    canEditAny: false, // Can ONLY edit articles they own
    canPublish: true,  // Can publish their own articles
    canSchedule: true, // Can schedule their own articles
    canUnpublish: true,// Can unpublish their own articles
    canDelete: false,  // Ordinary Admin CANNOT delete articles
    canBulkManage: false,
    canManageStaff: false,
    canManageUsers: false,
    canInviteAdmin: false,
    canApproveAdmin: false,
    canSuspendAdmin: false,
    canReactivateAdmin: false,
    canRevokeAdmin: false,
    canChangeRoles: false,
    canManageCategories: false,
    canManageSettings: false,
    canUploadMedia: true,
    canUseMedia: true,
    canViewAllArticles: false, // In CMS, only views own articles
    labelHindi: 'व्यवस्थापक (Admin)',
  },
};

/**
 * Checks whether a given role has permission for a specific action.
 */
export function hasPermission(role = ROLES.ADMIN, action = 'canPublish') {
  if (!role) return false;
  const normalized = normalizeRole(role);
  const caps = ROLE_CAPABILITIES[normalized] || ROLE_CAPABILITIES[ROLES.ADMIN];
  return Boolean(caps && caps[action]);
}

/**
 * Determines whether a user's approval status permits access to the CMS.
 */
export function canAccessCMS(user) {
  if (!user) return false;
  const status = String(user.approvalStatus || user.approval_status || user.status || 'approved').toLowerCase();
  if (
    status === APPROVAL_STATUS.SUSPENDED ||
    status === APPROVAL_STATUS.REVOKED ||
    status === APPROVAL_STATUS.PENDING ||
    status === APPROVAL_STATUS.INVITED
  ) {
    return false;
  }
  return true;
}

/**
 * Determines whether a user is allowed to access Team Management.
 */
export function canAccessTeamManagement(user) {
  if (!user) return false;
  return normalizeRole(user.role) === ROLES.SUPER_ADMIN && canAccessCMS(user);
}

/**
 * Normalizes role string to standard key ('super_admin' or 'admin').
 */
export function normalizeRole(role) {
  if (!role) return ROLES.ADMIN;
  const r = String(role).toLowerCase().trim();
  if (r.includes('super')) return ROLES.SUPER_ADMIN;
  return ROLES.ADMIN;
}

/**
 * Checks if a user is permitted to edit a specific article.
 * Super Admin can edit ANY article.
 * Ordinary Admin can ONLY edit articles they own (author_id === user.id).
 */
export function canEditArticle(user, article) {
  if (!user || !article) return false;
  const role = normalizeRole(user.role);
  if (role === ROLES.SUPER_ADMIN) return true;

  const articleAuthorId =
    article.authorId ||
    article.author_id ||
    (typeof article.author === 'object' ? article.author?.id : null);

  return Boolean(articleAuthorId && String(articleAuthorId) === String(user.id));
}

/**
 * Checks if a user is permitted to delete an article.
 * STRICTLY restricted to Super Admin only.
 */
export function canDeleteArticle(user) {
  if (!user) return false;
  return normalizeRole(user.role) === ROLES.SUPER_ADMIN;
}

/**
 * Checks if a user is permitted to schedule or reschedule an article.
 * Super Admin can schedule any article.
 * Ordinary Admin can ONLY schedule their own article.
 */
export function canScheduleArticle(user, article) {
  return canEditArticle(user, article);
}

/**
 * Checks if a user is permitted to publish an article.
 * Super Admin can publish any article.
 * Ordinary Admin can ONLY publish their own article.
 */
export function canPublishArticle(user, article) {
  return canEditArticle(user, article);
}
