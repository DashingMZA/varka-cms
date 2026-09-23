/**
 * Auth validation schemas — error messages are i18n keys under `validation.*`
 * so UI can resolve via t('validation', key). Never hardcode user-facing strings here.
 */
import { z } from 'zod';

/** Message keys used in Zod issues (path → validation.json) */
export const VALIDATION_KEYS = {
  required: 'required',
  email: 'email',
  emailRequired: 'emailRequired',
  passwordRequired: 'passwordRequired',
  passwordMin: 'passwordMin',
  passwordMax: 'passwordMax',
  passwordPolicy: 'passwordPolicy',
  passwordMismatch: 'passwordMismatch',
  otpRequired: 'otpRequired',
  otpInvalid: 'otpInvalid',
  otpLength: 'otpLength',
  nameRequired: 'nameRequired',
  nameMax: 'nameMax',
  tokenRequired: 'tokenRequired',
  url: 'url',
} as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[keyof typeof VALIDATION_KEYS];

const PW_MIN = 12;
const PW_MAX = 128;

export const emailField = z
  .string({ required_error: VALIDATION_KEYS.emailRequired })
  .trim()
  .min(1, VALIDATION_KEYS.emailRequired)
  .email(VALIDATION_KEYS.email)
  .max(320, VALIDATION_KEYS.email)
  .transform((v) => v.toLowerCase());

export const passwordField = z
  .string({ required_error: VALIDATION_KEYS.passwordRequired })
  .min(PW_MIN, VALIDATION_KEYS.passwordMin)
  .max(PW_MAX, VALIDATION_KEYS.passwordMax)
  .refine((p) => p.trim().length >= PW_MIN, VALIDATION_KEYS.passwordPolicy);

/** Login may accept any length for verify; policy enforced on set/reset */
export const loginPasswordField = z
  .string({ required_error: VALIDATION_KEYS.passwordRequired })
  .min(1, VALIDATION_KEYS.passwordRequired)
  .max(PW_MAX, VALIDATION_KEYS.passwordMax);

export const otpField = z
  .string({ required_error: VALIDATION_KEYS.otpRequired })
  .trim()
  .regex(/^\d{6}$/, VALIDATION_KEYS.otpLength);

export const nameField = z
  .string({ required_error: VALIDATION_KEYS.nameRequired })
  .trim()
  .min(1, VALIDATION_KEYS.nameRequired)
  .max(120, VALIDATION_KEYS.nameMax);

export const loginSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    passwordConfirm: z.string().min(1, VALIDATION_KEYS.passwordRequired),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: VALIDATION_KEYS.passwordMismatch,
    path: ['passwordConfirm'],
  });

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, VALIDATION_KEYS.tokenRequired),
    password: passwordField,
    passwordConfirm: z.string().min(1, VALIDATION_KEYS.passwordRequired),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: VALIDATION_KEYS.passwordMismatch,
    path: ['passwordConfirm'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: loginPasswordField,
    password: passwordField,
    passwordConfirm: z.string().min(1, VALIDATION_KEYS.passwordRequired),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: VALIDATION_KEYS.passwordMismatch,
    path: ['passwordConfirm'],
  });

export const verifyEmailSchema = z.object({
  email: emailField,
  otp: otpField,
});

export const twoFactorCodeSchema = z.object({
  code: otpField,
});

export const twoFactorDisableSchema = z.object({
  password: loginPasswordField,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Map Zod flatten errors → first message key per field */
export function zodErrorKeys(err: z.ZodError): Record<string, ValidationKey> {
  const out: Record<string, ValidationKey> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) {
      out[key] = (issue.message as ValidationKey) || VALIDATION_KEYS.required;
    }
  }
  return out;
}
