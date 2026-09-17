'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { InsertImageModal, type InsertImageResult } from '@/components/insert-image-modal';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  mode?: 'post' | 'page';
};

export function TiptapEditor({ value, onChange, placeholder, mode = 'post' }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder:
          placeholder ??
          (mode === 'page' ? 'Start writing or insert a block…' : 'Write your post…'),
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

  function onInsertImage(r: InsertImageResult) {
    editor
      ?.chain()
      .focus()
      .setImage({
        src: r.src,
        alt: r.alt,
        title: r.title,
      })
      .run();
  }

  function insertHtml(html: string) {
    editor?.chain().focus().insertContent(html).run();
  }

  return (
    <div className="v-tiptap-shell">
      <div className="v-tiptap-toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className={btnCls(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={btnCls(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={btnCls(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={btnCls(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          className={btnCls(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          type="button"
          className={btnCls(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>
        <button
          type="button"
          className={btnCls(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “
        </button>
        <button
          type="button"
          className={btnCls(editor.isActive('codeBlock'))}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {'</>'}
        </button>
        <button type="button" className={btnCls(editor.isActive('link'))} onClick={setLink}>
          Link
        </button>
        <button type="button" className="v-tiptap-btn" onClick={() => setMediaOpen(true)}>
          Image
        </button>
        <button
          type="button"
          className="v-tiptap-btn"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          —
        </button>
        {mode === 'page' ? (
          <>
            <span className="v-tiptap-sep" aria-hidden />
            <button
              type="button"
              className="v-tiptap-btn"
              title="Hero / cover"
              onClick={() =>
                insertHtml(
                  '<div class="v-block v-block--hero"><h2>Hero title</h2><p>Supporting text for this section.</p></div>',
                )
              }
            >
              Hero
            </button>
            <button
              type="button"
              className="v-tiptap-btn"
              title="Two columns"
              onClick={() =>
                insertHtml(
                  '<div class="v-block v-block--columns"><div><p>Column one</p></div><div><p>Column two</p></div></div>',
                )
              }
            >
              Columns
            </button>
            <button
              type="button"
              className="v-tiptap-btn"
              title="Call to action"
              onClick={() =>
                insertHtml(
                  '<div class="v-block v-block--cta"><p><strong>Call to action</strong></p><p><a href="#">Learn more</a></p></div>',
                )
              }
            >
              CTA
            </button>
            <button
              type="button"
              className="v-tiptap-btn"
              title="Pull quote"
              onClick={() =>
                insertHtml(
                  '<blockquote class="v-block v-block--quote"><p>A memorable quote.</p></blockquote>',
                )
              }
            >
              Quote
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="v-tiptap-btn"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          Clear
        </button>
      </div>
      <EditorContent editor={editor} />
      <InsertImageModal open={mediaOpen} onClose={() => setMediaOpen(false)} onInsert={onInsertImage} />
    </div>
  );
}

function btnCls(active: boolean) {
  return `v-tiptap-btn${active ? ' is-active' : ''}`;
}

function normalize(html: string) {
  return (html || '').replace(/\s+/g, ' ').trim();
}
