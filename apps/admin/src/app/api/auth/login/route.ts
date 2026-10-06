import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import {
  assertLoginRateLimit,
  recordEmailFailure,
  clearEmailFailures,
} from '@varka/auth';

/**
 * Native form-POST login endpoint — progressive-enhancement fallback.
 *
 * The React login form declares `action="/api/auth/login" method="post"`, so
 * when client-side JS is unavailable (or hydration fails), the browser still
 * performs a real POST here instead of a useless GET to /login. With JS
 * working, the form's onSubmit intercepts and uses the server action instead.
 */
export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const fail = (code: string) =>
    NextResponse.redirect(new URL(`/login?error=${code}`, origin));

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('invalid');
  }
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const rememberMe = form.get('remember') === 'on';
  if (!email || !password) return fail('missing');

  // Same brute-force policy as the server-action login.
  try {
    const rl = await assertLoginRateLimit(req);
    if (!rl.ok) return fail('locked');
  } catch {
    /* fail open if rate-limit store is unavailable */
  }

  const auth = getAuth();
  try {
    const { headers, response } = await auth.api.signInEmail({
      body: { email, password, rememberMe },
      headers: req.headers,
      returnHeaders: true,
    });
    const getSetCookie = (
      headers as unknown as { getSetCookie?: () => string[] }
    ).getSetCookie;
    const setCookies =
      typeof getSetCookie === 'function' ? getSetCookie.call(headers) : [];
    const withCookies = (res: NextResponse) => {
      for (const sc of setCookies) res.headers.append('set-cookie', sc);
      return res;
    };

    try {
      await clearEmailFailures(email);
    } catch {
      /* non-blocking */
    }

    const r = response as { twoFactorRedirect?: boolean } | null;
    if (r?.twoFactorRedirect) {
      // 2FA needs the interactive UI — send back with a flag.
      return withCookies(
        NextResponse.redirect(new URL('/login?step=2fa', origin)),
      );
    }
    return withCookies(NextResponse.redirect(new URL('/dashboard', origin)));
  } catch (e) {
    try {
      await recordEmailFailure(email);
    } catch {
      /* non-blocking */
    }
    const message = e instanceof Error ? e.message : '';
    const lower = message.toLowerCase();
    if (lower.includes('email') && lower.includes('verif')) return fail('unverified');
    return fail('invalid');
  }
}
