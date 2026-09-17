import { AutosaveSettings } from '@/components/autosave-settings';
import { MediaSettings } from '@/components/media-settings';

export default function SettingsPage() {
  return (
    <main>
      <h1 className="v-page-title">Settings</h1>
      <p className="v-page-desc">Site, editor, and media preferences.</p>
      <AutosaveSettings />
      <MediaSettings />
    </main>
  );
}
