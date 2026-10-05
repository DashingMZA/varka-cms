import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';

/**
 * Public form submission endpoint (no auth — used by embedded forms).
 * POST /api/public/forms/:slug/submit
 * Body: JSON or form-data with field values. Honeypot field "website"
 * must stay empty (spam trap).
 */

type FormField = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
};

// Tiny in-memory rate limiter: 20 submissions / 10 min per IP.
// (Resets on serverless cold start — a basic guard, not a guarantee.)
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) {
    const first = hits.keys().next();
    if (!first.done) hits.delete(first.value);
  }
  return arr.length > 20;
}

function clientIp(req: Request): string {
  const h = req.headers.get('x-forwarded-for');
  if (h) return (h.split(',')[0] ?? 'unknown').trim().slice(0, 64) || 'unknown';
  return 'unknown';
}

async function readBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const j = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(j)) {
      if (v === null || v === undefined) continue;
      out[k] = Array.isArray(v) ? v.map(String).join(', ') : String(v);
    }
    return out;
  }
  const fd = await req.formData().catch(() => null);
  const out: Record<string, string> = {};
  if (fd) {
    for (const [k, v] of fd.entries()) {
      if (typeof v === 'string') out[k] = v;
    }
  }
  return out;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) {
    return NextResponse.json({ ok: false, error: 'Invalid form.' }, { status: 400 });
  }

  const body = await readBody(req);

  // Honeypot: bots fill this; humans never see it. Pretend success.
  if (body.website && body.website.trim() !== '') {
    return NextResponse.json({ ok: true, message: 'Thank you!' });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    );
  }

  const form = await prisma.form.findUnique({ where: { slug } }).catch(() => null);
  if (!form || !form.active) {
    return NextResponse.json({ ok: false, error: 'This form is not available.' }, { status: 404 });
  }

  const fields = (Array.isArray(form.fields) ? form.fields : []) as FormField[];
  const data: Record<string, string> = {};
  for (const f of fields) {
    const raw = (body[f.id] ?? '').trim();
    if (f.required && !raw) {
      return NextResponse.json(
        { ok: false, error: `"${f.label}" is required.` },
        { status: 400 },
      );
    }
    if (raw && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      return NextResponse.json(
        { ok: false, error: `"${f.label}" must be a valid email address.` },
        { status: 400 },
      );
    }
    if (raw) data[f.id] = raw.slice(0, 5000);
  }

  await prisma.formEntry.create({
    data: {
      formId: form.id,
      data,
      ip,
      userAgent: (req.headers.get('user-agent') ?? '').slice(0, 300),
    },
  });

  // Optional notification hook: stored mailTo is surfaced in the admin;
  // actual email delivery can be wired to the site's SMTP later.
  return NextResponse.json({ ok: true, message: form.successMessage });
}
