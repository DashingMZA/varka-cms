import { RedirectionsAdmin } from '@/components/seo/redirections-admin';

export default function RedirectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  return (
    <main>
      <RedirectionsAdmin searchParams={searchParams} />
    </main>
  );
}
