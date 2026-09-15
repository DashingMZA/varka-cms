/**
 * Bridge: prefer @varka/cache rate limiter for new code.
 * Legacy in-memory helpers in rate-limit.ts remain for unit tests.
 */
export { rateLimit, clientIp, getCache, CacheKeys } from '@varka/cache';
