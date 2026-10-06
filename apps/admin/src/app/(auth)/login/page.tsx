import { LoginForm } from '@/components/login-form';

/**
 * Modern login screen (ElevenLabs-style).
 *
 * Supports native-POST fallback errors via `?error=` (see /api/auth/login)
 * and the 2FA step via `?step=2fa`.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; step?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="v-login-screen-modern">
      <LoginForm
        serverError={params.error ?? null}
        initialStep={params.step === '2fa' ? 'twoFactor' : undefined}
      />
    </div>
  );
}
