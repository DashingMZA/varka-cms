'use client';

import { RevisionHistory } from '@/components/revision-history';

/** Thin wrapper so post-editor can import without circular deps. */
export function PostEditorRevisions({ postId }: { postId: string }) {
  return <RevisionHistory postId={postId} />;
}
