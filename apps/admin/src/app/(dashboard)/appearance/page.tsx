import { ThemePicker } from '@/components/theme-picker';

export default function AppearancePage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Appearance</h1>
      <p style={{ color: 'var(--muted)' }}>
        V1 ships Clean Editorial and Dark Editorial. More themes share the same contract.
      </p>
      <ThemePicker />
    </main>
  );
}
