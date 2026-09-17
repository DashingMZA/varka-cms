import { ThemePicker } from '@/components/theme-picker';

export default function AppearanceThemesPage() {
  return (
    <main>
      <h1 className="v-page-title">Themes</h1>
      <p className="v-muted">
        Activate a public-site theme. Themes follow the shared contract in{' '}
        <code>@varka/themes</code>.
      </p>
      <ThemePicker />
    </main>
  );
}
