/**
 * @varka/forms - Shared form logic for admin and frontend.
 * Provides shortcode parsing and form HTML rendering.
 */

export type FormField = {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'tel' | 'url' | 'date';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type FormData = {
  id: string;
  name: string;
  slug: string;
  fields: FormField[];
};

/**
 * Parse [varka-form slug="contact"] shortcodes from content.
 * Returns array of { slug, fullMatch, index }.
 */
export function parseFormShortcodes(content: string): Array<{
  slug: string;
  fullMatch: string;
  index: number;
}> {
  const regex = /\[varka-form\s+slug="([^"]+)"\]/g;
  const out: Array<{ slug: string; fullMatch: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    out.push({ slug: m[1], fullMatch: m[0], index: m.index });
  }
  return out;
}

/**
 * Render a form as HTML (for frontend embedding via shortcode).
 */
export function renderFormHtml(form: FormData, actionUrl: string): string {
  const fields = form.fields
    .map((f) => {
      const req = f.required ? ' required' : '';
      const ph = f.placeholder ? ` placeholder="${escapeHtml(f.placeholder)}"` : '';
      const label = `<label for="vf-${f.id}">${escapeHtml(f.label)}${f.required ? ' *' : ''}</label>`;

      switch (f.type) {
        case 'textarea':
          return `<p class="varka-form-field">${label}<textarea id="vf-${f.id}" name="${f.id}"${req}${ph}></textarea></p>`;
        case 'select':
          const opts = (f.options || []).map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
          return `<p class="varka-form-field">${label}<select id="vf-${f.id}" name="${f.id}"${req}>${opts}</select></p>`;
        case 'checkbox':
          return `<p class="varka-form-field"><label><input type="checkbox" id="vf-${f.id}" name="${f.id}"${req} /> ${escapeHtml(f.label)}${f.required ? ' *' : ''}</label></p>`;
        default:
          return `<p class="varka-form-field">${label}<input type="${f.type}" id="vf-${f.id}" name="${f.id}"${req}${ph} /></p>`;
      }
    })
    .join('\n');

  return `<form class="varka-form" method="POST" action="${escapeHtml(actionUrl)}" data-form-slug="${escapeHtml(form.slug)}">
  <input type="hidden" name="formSlug" value="${escapeHtml(form.slug)}" />
  ${fields}
  <p><button type="submit">Submit</button></p>
</form>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Replace all [varka-form] shortcodes in content with rendered form HTML.
 */
export function renderShortcodes(
  content: string,
  forms: Map<string, FormData>,
  actionUrl: string
): string {
  const shortcodes = parseFormShortcodes(content);
  // Replace from end to preserve indices
  let out = content;
  for (let i = shortcodes.length - 1; i >= 0; i--) {
    const sc = shortcodes[i];
    const form = forms.get(sc.slug);
    if (form) {
      const html = renderFormHtml(form, actionUrl);
      out = out.slice(0, sc.index) + html + out.slice(sc.index + sc.fullMatch.length);
    }
  }
  return out;
}
