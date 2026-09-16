import { createAuth } from '@varka/auth';

let authSingleton: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!authSingleton) {
    authSingleton = createAuth();
  }
  return authSingleton;
}
