'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getStoredLocale, isRtlLocale } from '@/lib/i18n';

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Black', value: '#1d2327' },
  { label: 'Gray', value: '#646970' },
  { label: 'Red', value: '#d63638' },
  { label: 'Orange', value: '#dba617' },
  { label: 'Green', value: '#00a32a' },
  { label: 'Blue', value: '#2271b1' },
  { label: 'Purple', value: '#7e3af2' },
  { label: 'White', value: '#ffffff' },
];

const BG_COLORS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fff3cd' },
  { label: 'Green', value: '#d1e7dd' },
  { label: 'Blue', value: '#cfe2ff' },
  { label: 'Pink', value: '#f8d7da' },
  { label: 'Gray', value: '#e9ecef' },
  { label: 'Orange', value: '#ffe5d0' },
];

type ContentHit = {
  id: string;
  kind: 'post' | 'page';
  title: string;
  slug: string;
  url: string;
  date?: string;
};

/** WordPress Classic Editor–style Tiptap with colors + link-to-content. */
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
  const [linkSearch, setLinkSearch] = useState('');
  const [contentHits, setContentHits] = useState<ContentHit[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [colorMenu, setColorMenu] = useState<'text' | 'bg' | null>(null);

  useEffect(() => {
    setRtl(isRtlLocale(getStoredLocale()));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
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

  const loadExistingContent = useCallback(async (q: string) => {
    setContentLoading(true);
    try {
      const [postsRes, pagesRes] = await Promise.all([
        fetch('/api/posts', { credentials: 'include' }),
        fetch(
          `/api/pages?limit=50${q ? `&q=${encodeURIComponent(q)}` : ''}`,
          { credentials: 'include' },
        ),
      ]);
      const hits: ContentHit[] = [];

      if (postsRes.ok) {
        const data = (await postsRes.json()) as {
          items?: Array<{
            id: string;
            updatedAt?: string;
            publishedAt?: string | null;
            translations?: Array<{ title?: string; slug?: string }>;
          }>;
        };
        const qq = q.trim().toLowerCase();
        for (const p of data.items ?? []) {
          const tr = p.translations?.[0];
          const title = tr?.title ?? '';
          const slug = tr?.slug ?? '';
          if (qq && !title.toLowerCase().includes(qq) && !slug.toLowerCase().includes(qq)) {
            continue;
          }
          hits.push({
            id: p.id,
            kind: 'post',
            title: title || '(no title)',
            slug,
            url: `/${slug}`,
            date: p.publishedAt ?? p.updatedAt,
          });
        }
      }

      if (pagesRes.ok) {
        const data = (await pagesRes.json()) as {
          items?: Array<{
            id: string;
            updatedAt?: string;
            translations?: Array<{ title?: string; slug?: string }>;
          }>;
        };
        for (const p of data.items ?? []) {
          const tr = p.translations?.[0];
          hits.push({
            id: p.id,
            kind: 'page',
            title: tr?.title || '(no title)',
            slug: tr?.slug ?? '',
            url: `/${tr?.slug ?? ''}`,
            date: p.updatedAt,
          });
        }
      }

      hits.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
      setContentHits(hits.slice(0, 40));
    } catch {
      setContentHits([]);
    }
    setContentLoading(false);
  }, []);

  useEffect(() => {
    if (!linkOpen) return;
    const t = window.setTimeout(() => {
      void loadExistingContent(linkSearch);
    }, 250);
    return () => window.clearTimeout(t);
  }, [linkOpen, linkSearch, loadExistingContent]);

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
    setLinkSearch('');
    setLinkOpen(true);
    setColorMenu(null);
  }

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkOpen(false);
      return;
    }
    const attrs: { href: string; target?: string; rel?: string } = { href: url };
    if (linkNewTab) {
      attrs.target = '_blank';
      attrs.rel = 'noopener noreferrer';
    }
    const { from, to } = editor.state.selection;
    if (from === to && linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${escapeAttr(url)}"${
            linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''
          }>${escapeHtml(linkText.trim())}</a>`,
        )
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink(attrs).run();
    }
    setLinkOpen(false);
  }

  function pickExistingContent(hit: ContentHit) {
    setLinkUrl(hit.url);
    if (!linkText.trim()) setLinkText(hit.title);
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

  const activeTextColor =
    (editor.getAttributes('textStyle').color as string | undefined) || '';
  const activeBg =
    (editor.getAttributes('highlight').color as string | undefined) || '';

  return (
    <div className={`v-tiptap-shell${rtl ? ' is-rtl' : ''}`}>
      <div className="v-tiptap-tabs">
        <div className="v-tiptap-tabs__left" />
        <div className="v-tiptap-tabs__right">
          <button type="button" className={mode === 'visual' ? 'is-active' : ''} onClick={() => switchMode('visual')}>Visual</button>
          <button type="button" className={mode === 'code' ? 'is-active' : ''} onClick={() => switchMode('code')}>Code</button>
        </div>
      </div>

      {mode === 'visual' ? (
        <>
          <div className="v-tiptap-toolbar" role="toolbar" aria-label="Formatting">
            <select className="v-tiptap-format" value={currentBlock()} onChange={(e) => setBlock(e.target.value)} title="Paragraph format" aria-label="Paragraph format">
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
            <ToolBtn label="🖼" active={false} title="Add media" onClick={() => {
              if (props.onInsertImage) props.onInsertImage();
              else {
                const url = prompt('Image URL');
                if (url) editor.chain().focus().setImage({ src: url }).run();
              }
            }} />
            <ToolBtn label="▾" active={kitchenSink} title="Toolbar Toggle" onClick={() => setKitchenSink((v) => !v)} />
          </div>

          {kitchenSink ? (
            <div className="v-tiptap-toolbar v-tiptap-toolbar--row2" role="toolbar" aria-label="More formatting">
              <ToolBtn label={<s>S</s>} active={editor.isActive('strike')} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} />
              <ToolBtn label={<u>U</u>} active={editor.isActive('underline')} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} />
              <ToolBtn label={<code style={{ fontSize: 12 }}>{'</>'}</code>} active={editor.isActive('code')} title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} />

              <div className="v-tiptap-color-wrap">
                <ToolBtn
                  label={<span style={{ borderBottom: `3px solid ${activeTextColor || '#1d2327'}` }}>A</span>}
                  active={Boolean(activeTextColor)}
                  title="Text color"
                  onClick={() => setColorMenu((m) => (m === 'text' ? null : 'text'))}
                />
                {colorMenu === 'text' ? (
                  <div className="v-tiptap-swatches" role="listbox" aria-label="Text color">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        className="v-tiptap-swatch"
                        title={c.label}
                        style={{ background: c.value || '#fff', border: c.value ? undefined : '1px dashed #8c8f94' }}
                        onClick={() => {
                          if (!c.value) editor.chain().focus().unsetColor().run();
                          else editor.chain().focus().setColor(c.value).run();
                          setColorMenu(null);
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="v-tiptap-color-wrap">
                <ToolBtn
                  label={<span style={{ background: activeBg || '#fff3cd', padding: '0 3px', borderRadius: 2 }}>▮</span>}
                  active={Boolean(activeBg)}
                  title="Background color"
                  onClick={() => setColorMenu((m) => (m === 'bg' ? null : 'bg'))}
                />
                {colorMenu === 'bg' ? (
                  <div className="v-tiptap-swatches" role="listbox" aria-label="Background color">
                    {BG_COLORS.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        className="v-tiptap-swatch"
                        title={c.label}
                        style={{ background: c.value || '#fff', border: c.value ? undefined : '1px dashed #8c8f94' }}
                        onClick={() => {
                          if (!c.value) editor.chain().focus().unsetHighlight().run();
                          else editor.chain().focus().toggleHighlight({ color: c.value }).run();
                          setColorMenu(null);
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

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
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https:// or /slug" autoFocus />
              </label>
              <label>
                Link Text
                <input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Optional if text is selected" />
              </label>
              <label className="v-link-modal__check">
                <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} />
                Open link in a new tab
              </label>

              <div className="v-link-modal__existing">
                <p className="v-link-modal__existing-title">Or link to existing content</p>
                <input
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search posts & pages…"
                  aria-label="Search existing content"
                />
                <div className="v-link-modal__hits">
                  {contentLoading ? (
                    <p className="v-muted" style={{ margin: 8, fontSize: 12 }}>Loading…</p>
                  ) : contentHits.length === 0 ? (
                    <p className="v-muted" style={{ margin: 8, fontSize: 12 }}>
                      {linkSearch ? 'No matching content.' : 'No search term specified. Showing recent items.'}
                    </p>
                  ) : (
                    <ul>
                      {contentHits.map((h) => (
                        <li key={`${h.kind}-${h.id}`}>
                          <button
                            type="button"
                            className={linkUrl === h.url ? 'is-selected' : ''}
                            onClick={() => pickExistingContent(h)}
                          >
                            <span className="v-link-hit__title">{h.title}</span>
                            <span className="v-link-hit__meta">
                              <span className="v-link-hit__kind">{h.kind.toUpperCase()}</span>
                              {h.date ? <span className="v-link-hit__date">{String(h.date).slice(0, 10)}</span> : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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
