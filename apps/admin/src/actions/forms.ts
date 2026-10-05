'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type FormActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): FormActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

const FORM_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Form" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT,
  "fields" JSONB NOT NULL DEFAULT '[]',
  "submitLabel" TEXT NOT NULL DEFAULT 'Send',
  "successMessage" TEXT NOT NULL DEFAULT 'Thank you! Your message has been sent.',
  "mailTo" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
  `CREATE INDEX IF NOT EXISTS "Form_active_idx" ON "Form"("active")`,
  `CREATE TABLE IF NOT EXISTS "FormEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "formId" TEXT NOT NULL REFERENCES "Form"("id") ON DELETE CASCADE,
  "data" JSONB NOT NULL DEFAULT '{}',
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
  `CREATE INDEX IF NOT EXISTS "FormEntry_formId_createdAt_idx" ON "FormEntry"("formId", "createdAt")`,
];

const FORM_PERMISSION_KEYS = [
  'forms.read',
  'forms.create',
  'forms.update',
  'forms.delete',
  'forms.entries',
] as const;

export const FORM_FIELD_TYPES = [
  'text',
  'email',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'number',
  'tel',
  'url',
  'date',
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select / radio / checkbox (one per line in UI)
};

function assertSlug(slug: string): void {
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) {
    throw new Error('Slug must be 2–64 chars: lowercase letters, numbers, hyphens.');
  }
}

function sanitizeFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return [];
  const out: FormField[] = [];
  for (const f of raw.slice(0, 50)) {
    if (typeof f !== 'object' || f === null) continue;
    const r = f as Record<string, unknown>;
    const type = String(r.type ?? 'text');
    if (!(FORM_FIELD_TYPES as readonly string[]).includes(type)) continue;
    const id = String(r.id ?? '').trim().slice(0, 64) || `field_${out.length + 1}`;
    const label = String(r.label ?? '').trim().slice(0, 200) || 'Untitled field';
    const options = Array.isArray(r.options)
      ? r.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 50)
      : undefined;
    out.push({
      id,
      type: type as FormFieldType,
      label,
      required: r.required === true,
      placeholder: String(r.placeholder ?? '').slice(0, 200) || undefined,
      options,
    });
  }
  return out;
}

/**
 * WordPress-style: the forms module sets itself up on first use.
 * Creates Form/FormEntry tables, ensures forms.* permissions exist,
 * grants them to owner/admin. Idempotent.
 */
async function ensureFormsSystem(): Promise<void> {
  for (const sql of FORM_TABLE_STATEMENTS) {
    await prisma.$executeRawUnsafe(sql);
  }
  for (const key of FORM_PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key },
      create: { key, description: `Forms module: ${key}` },
      update: {},
    });
  }
  const roles = await prisma.role.findMany({
    where: { slug: { in: ['owner', 'admin'] } },
  });
  const perms = await prisma.permission.findMany({
    where: { key: { in: [...FORM_PERMISSION_KEYS] } },
  });
  for (const role of roles) {
    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        create: { roleId: role.id, permissionId: perm.id },
        update: {},
      });
    }
  }
}

export async function listFormsAction(): Promise<
  FormActionResult<Array<{ id: string; name: string; slug: string; active: boolean; entries: number; updatedAt: string }>>
> {
  try {
    await requireServerAuth('forms.read');
    await ensureFormsSystem().catch(() => {});
    let forms: Array<{ id: string; name: string; slug: string; active: boolean; updatedAt: Date; _count: { entries: number } }> = [];
    try {
      forms = await prisma.form.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { entries: true } } },
      });
    } catch {
      forms = [];
    }
    return {
      ok: true,
      data: forms.map((f) => {
        // eslint-disable-next-line no-underscore-dangle -- Prisma generates `_count`
        const count = f._count;
        return {
          id: f.id,
          name: f.name,
          slug: f.slug,
          active: f.active,
          entries: count.entries,
          updatedAt: f.updatedAt.toISOString(),
        };
      }),
    };
  } catch (e) {
    return fail(e);
  }
}

export async function getFormAction(id: string): Promise<FormActionResult<unknown>> {
  try {
    await requireServerAuth('forms.read');
    await ensureFormsSystem().catch(() => {});
    const form = await prisma.form.findUnique({ where: { id } });
    if (!form) return { ok: false, error: 'Form not found' };
    return { ok: true, data: JSON.parse(JSON.stringify(form)) };
  } catch (e) {
    return fail(e);
  }
}

export async function createFormAction(
  name: string,
  slug: string,
): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireServerAuth('forms.create');
    await ensureFormsSystem().catch(() => {});
    const cleanName = name.trim().slice(0, 200) || 'Untitled form';
    const cleanSlug = slug.trim().toLowerCase() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'form';
    assertSlug(cleanSlug);
    const existing = await prisma.form.findUnique({ where: { slug: cleanSlug } }).catch(() => null);
    if (existing) return { ok: false, error: 'A form with this slug already exists.' };
    const form = await prisma.form.create({
      data: {
        name: cleanName,
        slug: cleanSlug,
        title: cleanName,
        fields: [
          { id: 'your-name', type: 'text', label: 'Your Name', required: true },
          { id: 'your-email', type: 'email', label: 'Your Email', required: true },
          { id: 'your-message', type: 'textarea', label: 'Your Message', required: true },
        ],
      },
    });
    revalidatePath('/forms');
    return { ok: true, data: { id: form.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateFormAction(
  id: string,
  body: {
    name?: string;
    slug?: string;
    title?: string | null;
    fields?: unknown;
    submitLabel?: string;
    successMessage?: string;
    mailTo?: string | null;
    active?: boolean;
  },
): Promise<FormActionResult<unknown>> {
  try {
    await requireServerAuth('forms.update');
    await ensureFormsSystem().catch(() => {});
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim().slice(0, 200) || 'Untitled form';
    if (body.slug !== undefined) {
      const cleanSlug = body.slug.trim().toLowerCase();
      assertSlug(cleanSlug);
      const clash = await prisma.form.findUnique({ where: { slug: cleanSlug } }).catch(() => null);
      if (clash && clash.id !== id) return { ok: false, error: 'A form with this slug already exists.' };
      data.slug = cleanSlug;
    }
    if (body.title !== undefined) data.title = body.title?.trim().slice(0, 200) || null;
    if (body.fields !== undefined) data.fields = sanitizeFields(body.fields);
    if (body.submitLabel !== undefined) data.submitLabel = body.submitLabel.trim().slice(0, 100) || 'Send';
    if (body.successMessage !== undefined) data.successMessage = body.successMessage.trim().slice(0, 1000) || 'Thank you! Your message has been sent.';
    if (body.mailTo !== undefined) {
      const mail = body.mailTo?.trim() || null;
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { ok: false, error: 'Invalid notification email.' };
      data.mailTo = mail;
    }
    if (body.active !== undefined) data.active = body.active === true;
    const form = await prisma.form.update({ where: { id }, data });
    revalidatePath('/forms');
    return { ok: true, data: JSON.parse(JSON.stringify(form)) };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFormAction(id: string): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireServerAuth('forms.delete');
    await ensureFormsSystem().catch(() => {});
    await prisma.form.delete({ where: { id } });
    revalidatePath('/forms');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function listEntriesAction(
  formId: string,
  opts?: { page?: number; perPage?: number },
): Promise<FormActionResult<{ items: unknown[]; total: number; page: number; perPage: number }>> {
  try {
    await requireServerAuth('forms.entries');
    await ensureFormsSystem().catch(() => {});
    const page = Math.max(1, opts?.page ?? 1);
    const perPage = Math.min(Math.max(1, opts?.perPage ?? 20), 100);
    let total = 0;
    let items: unknown[] = [];
    try {
      total = await prisma.formEntry.count({ where: { formId } });
      items = await prisma.formEntry.findMany({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      });
    } catch {
      /* table missing — ensure ran above; treat as empty */
    }
    return {
      ok: true,
      data: { items: JSON.parse(JSON.stringify(items)), total, page, perPage },
    };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEntryAction(id: string): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireServerAuth('forms.entries');
    await prisma.formEntry.delete({ where: { id } });
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkDeleteEntriesAction(
  formId: string,
  ids: string[],
): Promise<FormActionResult<{ deleted: number }>> {
  try {
    await requireServerAuth('forms.entries');
    if (!Array.isArray(ids) || ids.length === 0) return { ok: true, data: { deleted: 0 } };
    const res = await prisma.formEntry.deleteMany({
      where: { formId, id: { in: ids.slice(0, 500) } },
    });
    return { ok: true, data: { deleted: res.count } };
  } catch (e) {
    return fail(e);
  }
}
