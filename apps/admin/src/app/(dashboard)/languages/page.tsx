import { LanguagesAdmin } from '@/components/languages-admin';

export default function LanguagesPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Languages</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 560 }}>
        Manage locales for content and public URLs. Seed provides English; add Punjabi or others
        here.
      </p>
      <LanguagesAdmin />
    </main>
  );
}
