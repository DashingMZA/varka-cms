import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/register-form';
import { getRegistrationStatusAction } from '@/actions/auth';

/**
 * Public registration page (ElevenLabs-style).
 * Only accessible when registration is enabled in Settings → General → Membership.
 */
export default async function RegisterPage() {
  const { enabled } = await getRegistrationStatusAction();
  if (!enabled) {
    redirect('/login');
  }
  return (
    <div className="v-login-screen-modern">
      <RegisterForm />
    </div>
  );
}
