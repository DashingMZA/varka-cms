import { ThemePicker } from '@/components/theme-picker';

export default function AppearancePage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Appearance</h1>
      <p style={{ color: 'var(--muted)' }}>
        Ten editorial themes under one contract (tokens + CSS). Activate here — public site loads
        active theme via <code>/api/public/theme</code>.
      </p>
      <ThemePicker />
    </main>
  );
}
