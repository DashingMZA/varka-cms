import { RedirectionsAdmin } from '@/components/seo/redirections-admin';

export default function RedirectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Redirections</h1>
      </div>
      <RedirectionsAdmin searchParams={searchParams} />
    </main>
  );
}
