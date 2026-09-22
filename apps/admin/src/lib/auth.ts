import { createAuth, ensureEnvLoaded, resolveAuthSecret } from '@varka/auth';

let _auth: ReturnType<typeof createAuth> | null = null;
let _secretUsed: string | null = null;

/**
 * Singleton Better Auth instance.
 * Recreates if AUTH_SECRET was missing on first call (Next injects env late)
 * and is available now — avoids sessions signed with the dev placeholder.
 */
export function getAuth() {
  ensureEnvLoaded();
  const secret = resolveAuthSecret();
  if (!_auth || _secretUsed !== secret) {
    _auth = createAuth();
    _secretUsed = secret;
  }
  return _auth;
}
