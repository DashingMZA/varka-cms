import { UserProfileForm } from '@/components/user-profile-form';
import { AdminColorScheme } from '@/components/admin-color-scheme';
import { TwoFactorSettings } from '@/components/security/two-factor-settings';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">{id ? 'Edit User' : 'Profile'}</h1>
      </div>
      <div className="v-profile-grid">
        <UserProfileForm userId={id} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!id ? <AdminColorScheme /> : null}
          {!id ? <TwoFactorSettings enabled={false} /> : null}
        </div>
      </div>
    </main>
  );
}
