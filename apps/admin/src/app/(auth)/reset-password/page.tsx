import { ResetPasswordForm } from '@/components/security/reset-password-form';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <ResetPasswordForm searchParams={searchParams} />;
}
