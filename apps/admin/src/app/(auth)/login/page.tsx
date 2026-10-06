import { LoginForm } from '@/components/login-form';
import { getRegistrationStatusAction } from '@/actions/auth';

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
  const { enabled: registrationEnabled } = await getRegistrationStatusAction();
  return (
    <main className="v-login-screen-modern">
      <LoginForm
        serverError={params.error ?? null}
        initialStep={params.step === '2fa' ? 'twoFactor' : undefined}
        registrationEnabled={registrationEnabled}
      />
    </main>
  );
}
