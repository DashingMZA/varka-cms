export { createAuth, resolveAuthSecret, ensureEnvLoaded, isUsingPlaceholderSecret } from './server';
export type { Auth } from './server';

export {
  passwordHasher,
  assertPasswordPolicy,
  argon2ParamsFromEnv,
  hashPassword,
  verifyPassword,
  type Argon2Params,
} from './password';

export { AUTH_CLIENT_BASE } from './client';

export {
  sendAuthEmail,
  generateOtpCode,
  hashOtp,
  type AuthEmailType,
  type SendAuthEmailInput,
} from './email';

export {
  WP_ROLE_SLUGS,
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
  type ListUsersOpts,
  type CreateUserInput,
  type ProfileUpdate,
} from './users';

export { loadAuthContext } from './session';

export {
  LOGIN_PATH_SUFFIXES,
  isLoginPath,
  clientIpFromRequest,
  assertLoginRateLimit,
  recordEmailFailure,
  clearEmailFailures,
  isEmailLocked,
  auditLoginEvent,
  rateLimitResponse,
  lockoutResponse,
} from './login-guard';

export {
  checkRateLimit,
  createMemoryStore,
  LOCKOUT_THRESHOLD,
  LOCKOUT_MINUTES,
  shouldLockout,
  lockoutUntil,
  type RateLimitResult,
  type RateLimitStore,
} from './rate-limit';

export {
  requestSensitiveOtp,
  verifySensitiveOtp,
  hasPendingOtp,
  sendEmailVerificationOtp,
  verifyEmailOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithToken,
  type SensitiveAction,
} from './otp';

export { rateLimit, clientIp, getCache, CacheKeys } from './rate-limit-bridge';
