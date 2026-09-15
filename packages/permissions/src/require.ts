import { type Permission, isPermission } from './catalog';

export class ForbiddenError extends Error {
  readonly status = 403 as const;
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401 as const;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export type AuthContext = {
  userId: string;
  permissions: readonly string[];
  roles: readonly string[];
  disabled?: boolean;
};

/**
 * Server-side authorization. Never trust client role claims.
 */
export function requirePermission(ctx: AuthContext | null | undefined, permission: Permission): void {
  if (!ctx || !ctx.userId) {
    throw new UnauthorizedError();
  }
  if (ctx.disabled) {
    throw new ForbiddenError('Account disabled');
  }
  if (!isPermission(permission)) {
    throw new ForbiddenError('Unknown permission');
  }
  if (!ctx.permissions.includes(permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

export function hasPermission(ctx: AuthContext | null | undefined, permission: Permission): boolean {
  try {
    requirePermission(ctx, permission);
    return true;
  } catch {
    return false;
  }
}
