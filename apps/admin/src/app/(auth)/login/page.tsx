import { LoginForm } from '@/components/login-form';

/**
 * Classic WordPress-style login screen.
 */
export default function LoginPage() {
  return (
    <div className="v-login-screen">
      <h1 className="v-login-logo">
        <a href="/dashboard">VARKA</a>
      </h1>
      <div className="v-login-card" id="login">
        <LoginForm />
      </div>
      <p className="v-login-back">
        <a href={process.env.NEXT_PUBLIC_SITE_URL || '/'}>← Back to site</a>
      </p>
    </div>
  );
}
