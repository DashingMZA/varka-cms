/**
 * Redirect utilities.
 *
 * Ported from BMS-CMS (src/lib/redirects.ts), adapted to be framework-agnostic.
 * The path normalisation logic is pure; the caller supplies the rules.
 */

export interface RedirectRule {
  source: string;
  destination: string;
  /** HTTP status code: 301, 302, 307, 308 */
  type: number;
}

/**
 * Trailing slashes, case and percent-encoding shouldn't decide whether a
 * redirect matches.
 *
 * Decoding here fixes both directions at once, because stored sources run
 * through this function too — so a rule saved in either form still matches.
 *
 * `decodeURI`, not `decodeURIComponent`: it is the exact inverse of the
 * `encodeURI` used elsewhere and leaves the reserved characters alone.
 */
export function normalisePath(path: string): string {
  const raw = (path || '/').split('?')[0]!.split('#')[0]!.trim();
  let decoded = raw;
  try {
    decoded = decodeURI(raw);
  } catch {
    // Malformed escape such as `%ZZ`: match on what was actually sent.
  }
  const clean = decoded.toLowerCase();
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean || '/';
}

/**
 * Build a lookup map from redirect rules. Keys are normalised paths.
 */
export function buildRedirectMap(rules: RedirectRule[]): Map<string, RedirectRule> {
  const map = new Map<string, RedirectRule>();
  for (const r of rules) {
    map.set(normalisePath(r.source), r);
  }
  return map;
}

/**
 * Find a redirect for a request path.
 *
 * Returns the rule, or undefined if no redirect matches.
 */
export function findRedirect(
  requestPath: string,
  rules: Map<string, RedirectRule> | RedirectRule[],
): RedirectRule | undefined {
  const map = Array.isArray(rules) ? buildRedirectMap(rules) : rules;
  const found = map.get(normalisePath(requestPath));
  return found ?? undefined;
}

/**
 * Validate a redirect rule.
 */
export function validateRedirect(rule: Partial<RedirectRule>): string | null {
  if (!rule.source?.trim()) return 'Source path is required';
  if (!rule.destination?.trim()) return 'Destination is required';
  if (![301, 302, 307, 308].includes(rule.type ?? 0)) return 'Type must be 301, 302, 307 or 308';
  if (normalisePath(rule.source) === normalisePath(rule.destination)) {
    return 'Source and destination cannot be the same';
  }
  return null;
}
