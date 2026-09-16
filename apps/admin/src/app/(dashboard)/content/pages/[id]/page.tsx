import { PageEditor } from '@/components/page-editor';

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <PageEditor pageId={id} />
    </main>
  );
}
