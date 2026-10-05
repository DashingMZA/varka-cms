import { LoginForm } from '@/components/login-form';

/**
 * Classic WordPress-style login screen.
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
    <div className="v-login-screen">
      <h1 className="v-login-logo">
        <a href="/dashboard">VARKA</a>
      </h1>
      <div className="v-login-card" id="login">
        <LoginForm
          serverError={params.error ?? null}
          initialStep={params.step === '2fa' ? 'twoFactor' : undefined}
        />
      </div>
      <p className="v-login-back">
        <a href={process.env.NEXT_PUBLIC_SITE_URL || '/'}>← Back to site</a>
      </p>
    </div>
  );
}
