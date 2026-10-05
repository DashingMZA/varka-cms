export const ROLES = [
  'owner',
  'admin',
  'editor',
  'author',
  'contributor',
  'seo_manager',
  'translator',
  'reader',
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'posts.read',
  'posts.create',
  'posts.update',
  'posts.publish',
  'posts.delete',
  'pages.read',
  'pages.create',
  'pages.update',
  'pages.publish',
  'pages.delete',
  'media.read',
  'media.upload',
  'media.update',
  'media.delete',
  'comments.read',
  'comments.moderate',
  'comments.delete',
  'themes.read',
  'themes.customize',
  'themes.activate',
  'plugins.read',
  'plugins.install',
  'plugins.activate',
  'plugins.delete',
  'seo.read',
  'seo.update',
  'settings.read',
  'settings.update',
  'users.read',
  'users.create',
  'users.update',
  'users.disable',
  'languages.read',
  'languages.manage',
  'audit.read',
  'security.read',
  'security.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
