import { FormEditor } from '@/components/form-editor';

export default async function FormEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <FormEditor formId={id} initialTab={tab} />;
}
