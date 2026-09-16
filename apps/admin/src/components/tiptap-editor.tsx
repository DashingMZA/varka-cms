'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function TiptapEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Write your post…',
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'v-tiptap-prose',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    // Avoid cursor jump when parent re-sets same content after save
    if (value !== current && value !== editor.getText() && normalize(value) !== normalize(current)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="v-tiptap-shell v-muted">Loading editor…</div>;
  }

  function setLink() {
    const prev = editor?.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function addImage() {
    const url = window.prompt('Image URL');
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div className="v-tiptap-shell">
      <div className="v-tiptap-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" className={btnCls(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </button>
        <button type="button" className={btnCls(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </button>
        <button type="button" className={btnCls(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className={btnCls(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </button>
        <button type="button" className={btnCls(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </button>
        <button type="button" className={btnCls(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </button>
        <button type="button" className={btnCls(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          “
        </button>
        <button type="button" className={btnCls(editor.isActive('codeBlock'))} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {'</>'}
        </button>
        <button type="button" className={btnCls(editor.isActive('link'))} onClick={setLink}>
          Link
        </button>
        <button type="button" className="v-tiptap-btn" onClick={addImage}>
          Image
        </button>
        <button type="button" className="v-tiptap-btn" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          Clear
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function btnCls(active: boolean) {
  return `v-tiptap-btn${active ? ' is-active' : ''}`;
}

function normalize(html: string) {
  return (html || '').replace(/\s+/g, ' ').trim();
}
