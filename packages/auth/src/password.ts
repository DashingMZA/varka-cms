/**
 * Argon2id password hashing (OWASP-aligned).
 * Uses @node-rs/argon2 only (no optional `argon2` package — avoids Turbopack resolve warnings).
 * Fallback: Node crypto scrypt when native binding unavailable at runtime.
 *
 * Env: AUTH_ARGON2_MEMORY_KIB (default 19456), AUTH_ARGON2_TIME_COST (2), AUTH_ARGON2_PARALLELISM (1)
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { hash as argon2Hash, verify as argon2Verify, Algorithm } from '@node-rs/argon2';

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

async function hashWithScrypt(password: string): Promise<string> {
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

async function verifyScrypt(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
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

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  const params = argon2ParamsFromEnv();
  try {
    return await argon2Hash(password, {
      memoryCost: params.memoryCost,
      timeCost: params.timeCost,
      parallelism: params.parallelism,
      outputLen: params.outputLen,
      algorithm: Algorithm.Argon2id,
    });
  } catch {
    return hashWithScrypt(password);
  }
}

export async function verifyPassword(data: {
  password: string;
  hash: string;
}): Promise<boolean> {
  const { password, hash } = data;
  if (!password || !hash) return false;

  if (hash.startsWith('$argon2')) {
    try {
      return await argon2Verify(hash, password);
    } catch {
      return false;
    }
  }

  if (hash.startsWith('scrypt$')) {
    return verifyScrypt(password, hash);
  }

  return false;
}

export const passwordHasher = {
  hash: hashPassword,
  verify: verifyPassword,
};
