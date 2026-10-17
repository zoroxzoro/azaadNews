/**
 * Article Permissions & Role Capabilities (Frontend Demo Model)
 *
 * NOTE: This is a client-side permissions configuration for UI evaluation.
 * Real newsroom role enforcement and authorization will be handled by the backend API.
 */

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
};

export const ROLE_CAPABILITIES = {
  [ROLES.ADMIN]: {
    canCreate: true,
    canEditAny: true,
    canPublish: true,
    canSchedule: true,
    canUnpublish: true,
    canDelete: true,
    canBulkManage: true,
    labelHindi: 'व्यवस्थापक (Admin)',
  },
  [ROLES.EDITOR]: {
    canCreate: true,
    canEditAny: true,
    canPublish: true,
    canSchedule: true,
    canUnpublish: true,
    canDelete: true,
    canBulkManage: true,
    labelHindi: 'वरिष्ठ संपादक (Sr. Editor)',
  },
  [ROLES.AUTHOR]: {
    canCreate: true,
    canEditAny: false,
    canPublish: false,
    canSchedule: false,
    canUnpublish: false,
    canDelete: false,
    canBulkManage: false,
    labelHindi: 'रिपोर्टर / लेखक (Author)',
  },
};

export function hasPermission(role = ROLES.EDITOR, action = 'canPublish') {
  const normalized = (role || ROLES.EDITOR).toLowerCase();
  const caps = ROLE_CAPABILITIES[normalized] || ROLE_CAPABILITIES[ROLES.EDITOR];
  return Boolean(caps[action]);
}
