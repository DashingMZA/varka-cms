import { UserProfileForm } from '@/components/user-profile-form';
import { TwoFactorSettings } from '@/components/security/two-factor-settings';

export default function ProfilePage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Profile</h1>
      </div>
      <div className="v-profile-grid">
        <UserProfileForm />
        <TwoFactorSettings enabled={false} />
      </div>
    </main>
  );
}
