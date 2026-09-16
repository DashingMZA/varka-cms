import { AutosaveSettings } from '@/components/autosave-settings';

export default function SettingsPage() {
  return (
    <main>
      <h1 className="v-page-title">Settings</h1>
      <p className="v-page-desc">Site and editor preferences.</p>
      <AutosaveSettings />
    </main>
  );
}
