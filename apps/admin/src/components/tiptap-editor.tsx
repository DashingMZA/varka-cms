'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { getStoredLocale, isRtlLocale } from '@/lib/i18n';

/**
 * WordPress-style Tiptap rich-text editor for posts/pages.
 * Extensions: StarterKit, Link, Image, Placeholder.
 */
export function TiptapEditor(props: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onInsertImage?: () => void;
}) {
  const [rtl, setRtl] = useState(false);
  useEffect(() => {
    const loc = getStoredLocale();
    setRtl(isRtlLocale(loc));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { loading: 'lazy', decoding: 'async' },
      }),
      Placeholder.configure({
        placeholder: props.placeholder ?? 'Write content…',
      }),
    ],
    content: props.value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      props.onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'v-tiptap-prose',
        dir: typeof document !== 'undefined' && isRtlLocale(getStoredLocale()) ? 'rtl' : 'ltr',
        lang: typeof document !== 'undefined' ? getStoredLocale() : 'en',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    // Only reset when external value differs meaningfully (avoid cursor jump)
    if (props.value !== current) {
      const plain = editor.getText().trim();
      const incoming = (props.value || '').replace(/<[^>]+>/g, '').trim();
      if (props.value !== current && plain !== incoming) {
        editor.commands.setContent(props.value || '', { emitUpdate: false });
      }
    }
  }, [props.value, editor]);

  if (!editor) {
    return <p className="v-muted">Loading editor…</p>;
  }

  function toolBtn(
    label: string,
    active: boolean,
    onClick: () => void,
    title?: string,
  ) {
    return (
      <button
        type="button"
        className={`v-tiptap-btn${active ? ' is-active' : ''}`}
        onClick={onClick}
        title={title ?? label}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="v-tiptap-shell">
      <div className="v-tiptap-toolbar" role="toolbar" aria-label="Formatting">
        {toolBtn('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold')}
        {toolBtn('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic')}
        {toolBtn('S', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough')}
        <span className="v-tiptap-sep" />
        {toolBtn('H2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2')}
        {toolBtn('H3', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3')}
        <span className="v-tiptap-sep" />
        {toolBtn('• List', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet list')}
        {toolBtn('1. List', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Ordered list')}
        {toolBtn('Quote', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Blockquote')}
        <span className="v-tiptap-sep" />
        {toolBtn(
          'Link',
          editor.isActive('link'),
          () => {
            const prev = editor.getAttributes('link').href as string | undefined;
            const url = prompt('URL', prev ?? 'https://');
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          },
          'Insert link',
        )}
        {toolBtn(
          'Image',
          false,
          () => {
            if (props.onInsertImage) {
              props.onInsertImage();
              return;
            }
            const url = prompt('Image URL');
            if (!url) return;
            editor.chain().focus().setImage({ src: url }).run();
          },
          'Insert image',
        )}
        <span className="v-tiptap-sep" />
        {toolBtn('↺', false, () => editor.chain().focus().undo().run(), 'Undo')}
        {toolBtn('↻', false, () => editor.chain().focus().redo().run(), 'Redo')}
      </div>
      <EditorContent editor={editor} />
      {rtl ? null : null}
    </div>
  );
}
