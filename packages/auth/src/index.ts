export { createAuth, type Auth } from './server';
export { loadAuthContext } from './session';
export {
  listUsers,
  listRoles,
  createUser,
  setUserDisabled,
  setUserRole,
  revokeAllSessions,
  updateOwnProfile,
  getUserById,
  getOwnProfile,
  changeOwnPassword,
  WP_ROLE_SLUGS,
} from './users';
export {
  checkRateLimit,
  createMemoryStore,
  shouldLockout,
  lockoutUntil,
  LOCKOUT_THRESHOLD,
  LOCKOUT_MINUTES,
  type RateLimitResult,
  type RateLimitStore,
} from './rate-limit';
export {
  hashPassword,
  verifyPassword,
  assertPasswordPolicy,
  passwordHasher,
  argon2ParamsFromEnv,
} from './password';

export {
  isLoginPath,
  assertLoginRateLimit,
  rateLimitResponse,
  lockoutResponse,
  isEmailLocked,
  recordEmailFailure,
  clearEmailFailures,
  auditLoginEvent,
} from './login-guard';
