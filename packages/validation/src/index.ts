import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug');

export const urlSchema = z.string().url('url');

export const localeSchema = z
  .string()
  .min(2)
  .max(35)
  .regex(/^[a-zA-Z]{2,3}([_-][a-zA-Z0-9]+)*$/, 'locale');

export const emailSchema = z.string().email('email');

export const nonEmptyString = z.string().trim().min(1, 'required');

export { z };

export * from './auth';
