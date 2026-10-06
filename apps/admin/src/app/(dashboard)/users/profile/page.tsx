import { UserProfileForm } from '@/components/user-profile-form';
import { AdminColorScheme } from '@/components/admin-color-scheme';
import { TwoFactorSettings } from '@/components/security/two-factor-settings';

export default function ProfilePage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Profile</h1>
      </div>
      <div className="v-profile-grid">
        <UserProfileForm />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AdminColorScheme />
          <TwoFactorSettings enabled={false} />
        </div>
      </div>
    </main>
  );
}
