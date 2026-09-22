import { headers, cookies } from 'next/headers';

/**
 * Build Headers for Better Auth getSession.
 * Next.js App Router often omits the Cookie header from headers() while
 * cookies() still has values — Better Auth only reads the Cookie header.
 */
export async function authHeadersFromNext(): Promise<Headers> {
  const h = await headers();
  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const out = new Headers(h);
  if (cookieHeader) {
    out.set('cookie', cookieHeader);
  }
  return out;
}

/** From an incoming Request (API routes) — ensure cookie is present. */
export function authHeadersFromRequest(req: Request): Headers {
  return new Headers(req.headers);
}
