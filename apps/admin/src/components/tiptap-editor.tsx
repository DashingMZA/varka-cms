'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getStoredLocale, isRtlLocale } from '@/lib/i18n';

/**
 * WordPress Classic Editor–style Tiptap toolbar + Visual/Code modes.
 */
export function TiptapEditor(props: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onInsertImage?: () => void;
}) {
  const [rtl, setRtl] = useState(false);
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [code, setCode] = useState(props.value || '');
  const [kitchenSink, setKitchenSink] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(false);

  useEffect(() => {
    const loc = getStoredLocale();
    setRtl(isRtlLocale(loc));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
        dir:
          typeof document !== 'undefined' && isRtlLocale(getStoredLocale())
            ? 'rtl'
            : 'ltr',
        lang: typeof document !== 'undefined' ? getStoredLocale() : 'en',
      },
    },
  });

  useEffect(() => {
    if (!editor || mode === 'code') return;
    const current = editor.getHTML();
    if (props.value !== current) {
      const plain = editor.getText().trim();
      const incoming = (props.value || '').replace(/<[^>]+>/g, '').trim();
      if (plain !== incoming) {
        editor.commands.setContent(props.value || '', { emitUpdate: false });
      }
    }
  }, [props.value, editor, mode]);

  const wordCount = useMemo(() => {
    if (mode === 'code') {
      const text = code.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return text ? text.split(' ').filter(Boolean).length : 0;
    }
    if (!editor) return 0;
    const text = editor.getText().trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }, [editor, mode, code, props.value]);

  function openLinkModal() {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const selected = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' ',
    );
    setLinkUrl(prev ?? '');
    setLinkText(selected || '');
    setLinkNewTab(
      (editor.getAttributes('link').target as string | undefined) === '_blank',
    );
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkOpen(false);
      return;
    }
    const attrs: { href: string; target?: string; rel?: string } = {
      href: url,
    };
    if (linkNewTab) {
      attrs.target = '_blank';
      attrs.rel = 'noopener noreferrer';
    }
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    if (!hasSelection && linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${escapeAttr(url)}"${linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(linkText.trim())}</a>`,
        )
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink(attrs).run();
    }
    setLinkOpen(false);
  }

  function switchMode(next: 'visual' | 'code') {
    if (!editor) return;
    if (next === 'code' && mode === 'visual') {
      setCode(editor.getHTML());
      setMode('code');
      return;
    }
    if (next === 'visual' && mode === 'code') {
      editor.commands.setContent(code || '', { emitUpdate: true });
      props.onChange(code || '');
      setMode('visual');
    }
  }

  function currentBlock(): string {
    if (!editor) return 'paragraph';
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return `h${i}`;
    }
    if (editor.isActive('codeBlock')) return 'pre';
    return 'paragraph';
  }

  function setBlock(value: string) {
    if (!editor) return;
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
      return;
    }
    if (value === 'pre') {
      editor.chain().focus().toggleCodeBlock().run();
      return;
    }
    const level = Number(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
    editor.chain().focus().toggleHeading({ level }).run();
  }

  if (!editor) {
    return <p className="v-muted">Loading editor…</p>;
  }

  return (
    <div className={`v-tiptap-shell${rtl ? ' is-rtl' : ''}`}>
      <div className="v-tiptap-tabs">
        <div className="v-tiptap-tabs__left" />
        <div className="v-tiptap-tabs__right">
          <button
            type="button"
            className={mode === 'visual' ? 'is-active' : ''}
            onClick={() => switchMode('visual')}
          >
            Visual
          </button>
          <button
            type="button"
            className={mode === 'code' ? 'is-active' : ''}
            onClick={() => switchMode('code')}
          >
            Code
          </button>
        </div>
      </div>

      {mode === 'visual' ? (
        <>
          <div className="v-tiptap-toolbar" role="toolbar" aria-label="Formatting">
            <select
              className="v-tiptap-format"
              value={currentBlock()}
              onChange={(e) => setBlock(e.target.value)}
              title="Paragraph format"
              aria-label="Paragraph format"
            >
              <option value="paragraph">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="h5">Heading 5</option>
              <option value="h6">Heading 6</option>
              <option value="pre">Preformatted</option>
            </select>

            <ToolBtn label={<strong>B</strong>} active={editor.isActive('bold')} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolBtn label={<em>I</em>} active={editor.isActive('italic')} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolBtn label="☰" active={editor.isActive('bulletList')} title="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolBtn label="1." active={editor.isActive('orderedList')} title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolBtn label="❝" active={editor.isActive('blockquote')} title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ToolBtn label="⬅" active={editor.isActive({ textAlign: 'left' })} title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} />
            <ToolBtn label="≡" active={editor.isActive({ textAlign: 'center' })} title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} />
            <ToolBtn label="➡" active={editor.isActive({ textAlign: 'right' })} title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} />
            <ToolBtn label="🔗" active={editor.isActive('link')} title="Insert/edit link" onClick={openLinkModal} />
            <ToolBtn
              label="🖼"
              active={false}
              title="Add media"
              onClick={() => {
                if (props.onInsertImage) props.onInsertImage();
                else {
                  const url = prompt('Image URL');
                  if (url) editor.chain().focus().setImage({ src: url }).run();
                }
              }}
            />
            <ToolBtn label="▾" active={kitchenSink} title="Toolbar Toggle" onClick={() => setKitchenSink((v) => !v)} />
          </div>

          {kitchenSink ? (
            <div className="v-tiptap-toolbar v-tiptap-toolbar--row2" role="toolbar" aria-label="More formatting">
              <ToolBtn label={<s>S</s>} active={editor.isActive('strike')} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} />
              <ToolBtn label={<u>U</u>} active={editor.isActive('underline')} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} />
              <ToolBtn label="✕" active={false} title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
              <ToolBtn label="⟨" active={false} title="Decrease indent" onClick={() => editor.chain().focus().liftListItem('listItem').run()} />
              <ToolBtn label="⟩" active={false} title="Increase indent" onClick={() => editor.chain().focus().sinkListItem('listItem').run()} />
              <ToolBtn label="↺" active={false} title="Undo" onClick={() => editor.chain().focus().undo().run()} />
              <ToolBtn label="↻" active={false} title="Redo" onClick={() => editor.chain().focus().redo().run()} />
              <ToolBtn label="—" active={false} title="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
            </div>
          ) : null}

          <EditorContent editor={editor} />
        </>
      ) : (
        <textarea
          className="v-tiptap-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            props.onChange(e.target.value);
          }}
          spellCheck={false}
        />
      )}

      <div className="v-tiptap-footer">
        <span>Word count: {wordCount}</span>
      </div>

      {linkOpen ? (
        <div className="v-link-modal" role="dialog" aria-modal="true" aria-label="Insert/edit link">
          <div className="v-link-modal__frame">
            <div className="v-link-modal__bar">
              <strong>Insert/edit link</strong>
              <button type="button" className="v-btn" onClick={() => setLinkOpen(false)}>×</button>
            </div>
            <div className="v-link-modal__body">
              <p className="v-muted" style={{ marginTop: 0 }}>Enter the destination URL</p>
              <label>
                URL
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" autoFocus />
              </label>
              <label>
                Link Text
                <input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Optional if text is selected" />
              </label>
              <label className="v-link-modal__check">
                <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} />
                Open link in a new tab
              </label>
            </div>
            <div className="v-link-modal__foot">
              <button type="button" className="v-btn" onClick={() => setLinkOpen(false)}>Cancel</button>
              <button type="button" className="v-btn v-btn--primary" onClick={applyLink}>Add Link</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToolBtn(props: {
  label: ReactNode;
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`v-tiptap-btn${props.active ? ' is-active' : ''}`}
      onClick={props.onClick}
      title={props.title}
      aria-label={props.title}
      aria-pressed={props.active}
    >
      {props.label}
    </button>
  );
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
