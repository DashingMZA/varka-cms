import { UserProfileForm } from '@/components/user-profile-form';
import { TwoFactorSettings } from '@/components/security/two-factor-settings';

export default function ProfilePage() {
  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <UserProfileForm />
      <TwoFactorSettings enabled={false} />
    </main>
  );
}
