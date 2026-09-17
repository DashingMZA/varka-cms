/**
 * Argon2id password hashing (OWASP-aligned).
 * Better Auth default is scrypt; we override with Argon2id for stronger GPU resistance.
 *
 * Params (tunable via env):
 * - AUTH_ARGON2_MEMORY_KIB (default 19456 = 19 MiB)
 * - AUTH_ARGON2_TIME_COST (default 2)
 * - AUTH_ARGON2_PARALLELISM (default 1)
 *
 * Supports verify of both Argon2id (PHC) and legacy scrypt (Node crypto) for migration.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scryptCb);

export type Argon2Params = {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
  outputLen: number;
};

export function argon2ParamsFromEnv(): Argon2Params {
  const memoryCost = Number(process.env.AUTH_ARGON2_MEMORY_KIB ?? 19456);
  const timeCost = Number(process.env.AUTH_ARGON2_TIME_COST ?? 2);
  const parallelism = Number(process.env.AUTH_ARGON2_PARALLELISM ?? 1);
  return {
    memoryCost: Number.isFinite(memoryCost) && memoryCost >= 8192 ? memoryCost : 19456,
    timeCost: Number.isFinite(timeCost) && timeCost >= 1 ? timeCost : 2,
    parallelism: Number.isFinite(parallelism) && parallelism >= 1 ? parallelism : 1,
    outputLen: 32,
  };
}

/** Min 12 chars; max 128 to limit DoS on hash input */
export function assertPasswordPolicy(password: string): void {
  if (typeof password !== 'string') {
    throw new Error('Invalid password');
  }
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  if (password.length > 128) {
    throw new Error('Password must be at most 128 characters');
  }
  if (!password.trim()) {
    throw new Error('Password cannot be blank');
  }
}

type Argon2Module = {
  hash: (password: string, opts: Record<string, unknown>) => Promise<string>;
  verify: (hash: string, password: string, opts?: Record<string, unknown>) => Promise<boolean>;
  Algorithm: { Argon2id: number };
};

async function loadArgon2(): Promise<Argon2Module | null> {
  try {
    const mod = await import('@node-rs/argon2');
    return mod as unknown as Argon2Module;
  } catch {
    try {
      const mod = await import('argon2');
      return {
        hash: async (password, opts) => {
          const argon2 = mod as {
            hash: (p: string, o: Record<string, unknown>) => Promise<string>;
            argon2id: number;
          };
          return argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: opts.memoryCost,
            timeCost: opts.timeCost,
            parallelism: opts.parallelism,
            hashLength: opts.outputLen,
          });
        },
        verify: async (hash, password) => {
          const argon2 = mod as {
            verify: (h: string, p: string) => Promise<boolean>;
          };
          return argon2.verify(hash, password);
        },
        Algorithm: { Argon2id: 2 },
      };
    } catch {
      return null;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  const params = argon2ParamsFromEnv();
  const argon2 = await loadArgon2();

  if (argon2) {
    return argon2.hash(password, {
      memoryCost: params.memoryCost,
      timeCost: params.timeCost,
      parallelism: params.parallelism,
      outputLen: params.outputLen,
      algorithm: argon2.Algorithm?.Argon2id ?? 2,
    });
  }

  const N = 131072;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 32, {
    N,
    r,
    p,
    maxmem: 256 * 1024 * 1024,
  })) as Buffer;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(data: {
  password: string;
  hash: string;
}): Promise<boolean> {
  const { password, hash } = data;
  if (!password || !hash) return false;

  if (hash.startsWith('$argon2')) {
    const argon2 = await loadArgon2();
    if (!argon2) return false;
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  if (hash.startsWith('scrypt$')) {
    const parts = hash.split('$');
    if (parts.length !== 6) return false;
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], 'base64url');
    const expected = Buffer.from(parts[5], 'base64url');
    try {
      const derived = (await scryptAsync(password, salt, expected.length, {
        N,
        r,
        p,
        maxmem: 256 * 1024 * 1024,
      })) as Buffer;
      if (derived.length !== expected.length) return false;
      return timingSafeEqual(derived, expected);
    } catch {
      return false;
    }
  }

  return false;
}

export const passwordHasher = {
  hash: hashPassword,
  verify: verifyPassword,
};
