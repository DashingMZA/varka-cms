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
import { getStoredLocale, isRtlLocale, useMessages } from '@/lib/i18n';
import { searchContentAction } from '@/actions/posts';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'editor' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('editor', key);
  if (!v || v === key || v.startsWith('editor.')) return fallback;
  return v;
}

const TEXT_COLORS = [
  { key: 'colorDefault', fallback: 'Default', value: '' },
  { key: 'colorBlack', fallback: 'Black', value: '#1d2327' },
  { key: 'colorGray', fallback: 'Gray', value: '#646970' },
  { key: 'colorRed', fallback: 'Red', value: '#d63638' },
  { key: 'colorOrange', fallback: 'Orange', value: '#dba617' },
  { key: 'colorGreen', fallback: 'Green', value: '#00a32a' },
  { key: 'colorBlue', fallback: 'Blue', value: '#2271b1' },
  { key: 'colorPurple', fallback: 'Purple', value: '#7e3af2' },
  { key: 'colorWhite', fallback: 'White', value: '#ffffff' },
];

const BG_COLORS = [
  { key: 'colorNone', fallback: 'None', value: '' },
  { key: 'colorYellow', fallback: 'Yellow', value: '#fff3cd' },
  { key: 'colorGreen', fallback: 'Green', value: '#d1e7dd' },
  { key: 'colorBlue', fallback: 'Blue', value: '#cfe2ff' },
  { key: 'colorPink', fallback: 'Pink', value: '#f8d7da' },
  { key: 'colorGray', fallback: 'Gray', value: '#e9ecef' },
  { key: 'colorOrange', fallback: 'Orange', value: '#ffe5d0' },
];

type ContentHit = {
  id: string;
  kind: 'post' | 'page';
  title: string;
  slug: string;
  url: string;
  date?: string;
};

function escapeAttr(s: string) {
  return s.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<');
}
function escapeHtml(s: string) {
  return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
}

function ToolBtn(props: {
  label: ReactNode;
  active?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`v-tiptap-btn${props.active ? ' is-active' : ''}`}
      title={props.title}
      aria-label={props.title}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

/** WordPress Classic Editor–style Tiptap with colors + link-to-content. */
export function TiptapEditor(props: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onInsertImage?: () => void;
}) {
  const { t } = useMessages();
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
        placeholder: props.placeholder ?? L(t, 'writeContent', 'Write content…'),
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
        editor.commands.setContent(props.value || '', false);
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
      const result = await searchContentAction(q);
      const hits: ContentHit[] = [];
      if (result.ok) {
        for (const p of result.data.posts) {
          hits.push({
            id: p.id,
            kind: 'post',
            title: p.title || '(no title)',
            slug: p.slug,
            url: `/${p.slug}`,
          });
        }
        for (const p of result.data.pages) {
          hits.push({
            id: p.id,
            kind: 'page',
            title: p.title || '(no title)',
            slug: p.slug,
            url: `/${p.slug}`,
          });
        }
      }
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
      editor.commands.setContent(code || '', true);
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
          <div className="v-tiptap-toolbar" role="toolbar" aria-label={L(t, 'formatting', 'Formatting')}>
            <select className="v-tiptap-format" value={currentBlock()} onChange={(e) => setBlock(e.target.value)} title={L(t, 'paragraphFormat', 'Paragraph format')} aria-label={L(t, 'paragraphFormat', 'Paragraph format')}>
              <option value="paragraph">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="h5">Heading 5</option>
              <option value="h6">Heading 6</option>
              <option value="pre">Preformatted</option>
            </select>
            <ToolBtn label={<strong>B</strong>} active={editor.isActive('bold')} title={L(t, 'bold', 'Bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolBtn label={<em>I</em>} active={editor.isActive('italic')} title={L(t, 'italic', 'Italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolBtn label="☰" active={editor.isActive('bulletList')} title={L(t, 'bulletedList', 'Bulleted list')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolBtn label="1." active={editor.isActive('orderedList')} title={L(t, 'numberedList', 'Numbered list')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolBtn label="❝" active={editor.isActive('blockquote')} title={L(t, 'blockquote', 'Blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ToolBtn label="⬅" active={editor.isActive({ textAlign: 'left' })} title={L(t, 'alignLeft', 'Align left')} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
            <ToolBtn label="≡" active={editor.isActive({ textAlign: 'center' })} title={L(t, 'alignCenter', 'Align center')} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
            <ToolBtn label="➡" active={editor.isActive({ textAlign: 'right' })} title={L(t, 'alignRight', 'Align right')} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
            <ToolBtn label="🔗" active={editor.isActive('link')} title={L(t, 'insertLink', 'Insert/edit link')} onClick={openLinkModal} />
            <ToolBtn
              label="🖼"
              active={false}
              title={L(t, 'addMedia', 'Add media')}
              onClick={() => {
                if (props.onInsertImage) props.onInsertImage();
                else {
                  const url = prompt('Image URL');
                  if (url) editor.chain().focus().setImage({ src: url }).run();
                }
              }}
            />
            <ToolBtn label="▾" active={kitchenSink} title={L(t, 'toolbarToggle', 'Toolbar Toggle')} onClick={() => setKitchenSink((v) => !v)} />
          </div>

          {kitchenSink ? (
            <div className="v-tiptap-toolbar v-tiptap-toolbar--row2" role="toolbar" aria-label={L(t, 'moreFormatting', 'More formatting')}>
              <ToolBtn label={<s>S</s>} active={editor.isActive('strike')} title={L(t, 'strikethrough', 'Strikethrough')} onClick={() => editor.chain().focus().toggleStrike().run()} />
              <ToolBtn label={<u>U</u>} active={editor.isActive('underline')} title={L(t, 'underline', 'Underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
              <ToolBtn label={<code style={{ fontSize: 12 }}>{'</>'}</code>} active={editor.isActive('code')} title={L(t, 'inlineCode', 'Inline code')} onClick={() => editor.chain().focus().toggleCode().run()} />

              <div className="v-tiptap-color-wrap">
                <ToolBtn
                  label={<span style={{ borderBottom: `3px solid ${activeTextColor || '#1d2327'}` }}>A</span>}
                  active={Boolean(activeTextColor)}
                  title={L(t, 'textColor', 'Text color')}
                  onClick={() => setColorMenu((m) => (m === 'text' ? null : 'text'))}
                />
                {colorMenu === 'text' ? (
                  <div className="v-tiptap-swatches" role="listbox" aria-label={L(t, 'textColor', 'Text color')}>
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        className="v-tiptap-swatch"
                        title={L(t, c.key, c.fallback)}
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
                  title={L(t, 'bgColor', 'Background color')}
                  onClick={() => setColorMenu((m) => (m === 'bg' ? null : 'bg'))}
                />
                {colorMenu === 'bg' ? (
                  <div className="v-tiptap-swatches" role="listbox" aria-label={L(t, 'bgColor', 'Background color')}>
                    {BG_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        className="v-tiptap-swatch"
                        title={L(t, c.key, c.fallback)}
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

              <ToolBtn label="✕" active={false} title={L(t, 'clearFormatting', 'Clear formatting')} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
              <ToolBtn label="⟨" active={false} title={L(t, 'decreaseIndent', 'Decrease indent')} onClick={() => editor.chain().focus().liftListItem('listItem').run()} />
              <ToolBtn label="⟩" active={false} title={L(t, 'increaseIndent', 'Increase indent')} onClick={() => editor.chain().focus().sinkListItem('listItem').run()} />
              <ToolBtn label="↺" active={false} title={L(t, 'undo', 'Undo')} onClick={() => editor.chain().focus().undo().run()} />
              <ToolBtn label="↻" active={false} title={L(t, 'redo', 'Redo')} onClick={() => editor.chain().focus().redo().run()} />
              <ToolBtn label="—" active={false} title={L(t, 'horizontalLine', 'Horizontal line')} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
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
        <div className="v-link-modal" role="dialog" aria-modal="true" aria-label={L(t, 'insertLink', 'Insert/edit link')}>
          <div className="v-link-modal__frame">
            <div className="v-link-modal__bar">
              <strong>Insert/edit link</strong>
              <button type="button" className="v-btn" onClick={() => setLinkOpen(false)}>×</button>
            </div>
            <div className="v-link-modal__body">
              <p className="v-muted" style={{ marginTop: 0 }}>Enter the destination URL</p>
              <label>
                URL
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder={L(t, 'linkUrl', 'https:// or /slug')} autoFocus />
              </label>
              <label>
                Link Text
                <input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder={L(t, 'linkText', 'Optional if text is selected')} />
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
                  placeholder={L(t, 'searchContent', 'Search posts & pages…')}
                  aria-label={L(t, 'searchContentLabel', 'Search existing content')}
                />
                <div className="v-link-modal__hits">
                  {contentLoading ? (
                    <p className="v-muted" style={{ margin: 8, fontSize: 12 }}>Loading…</p>
                  ) : contentHits.length === 0 ? (
                    <p className="v-muted" style={{ margin: 8, fontSize: 12 }}>No matches</p>
                  ) : (
                    contentHits.map((hit) => (
                      <button
                        key={`${hit.kind}-${hit.id}`}
                        type="button"
                        className="v-link-modal__hit"
                        onClick={() => pickExistingContent(hit)}
                      >
                        <strong>{hit.title}</strong>
                        <span className="v-muted">
                          {' '}
                          {hit.kind} · /{hit.slug}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="v-link-modal__footer">
              <button type="button" className="v-btn" onClick={() => setLinkOpen(false)}>Cancel</button>
              <button type="button" className="v-btn v-btn--primary" onClick={applyLink}>Add Link</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
