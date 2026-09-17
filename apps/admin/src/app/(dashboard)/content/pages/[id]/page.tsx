import { PageEditor } from '@/components/page-editor';

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <h1 className="v-page-title">Edit Page</h1>
      <PageEditor pageId={id} />
    </main>
  );
}
