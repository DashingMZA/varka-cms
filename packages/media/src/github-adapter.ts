/**
 * GitHub repository storage adapter.
 *
 * Stores files as blobs in a GitHub repo via the Contents API — intended for
 * SMALL sites (portfolio, single-page) with few, rarely-changing images.
 * NOT for high-traffic or large media libraries (use s3/r2 instead):
 *  - every upload = a git commit (repo history grows)
 *  - Contents API is fine for files up to a few MB (base64)
 *  - rate limit: 5,000 req/hour per token
 *
 * Serving: set GITHUB_PUBLIC_URL to a CDN base, e.g.
 *  https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<prefix>
 * or
 *  https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<prefix>
 */
import type { PutObjectInput, PutObjectResult, StorageAdapter } from './types';

export type GithubAdapterOptions = {
  /** Fine-grained PAT with Contents: read+write on the repo */
  token: string;
  /** "owner/repo" */
  repo: string;
  branch: string;
  /** path inside the repo, e.g. "public/uploads" */
  pathPrefix: string;
  /** public base URL for serving, e.g. jsdelivr or raw.githubusercontent */
  publicBaseUrl: string;
};

type GithubContentFile = {
  sha: string;
  type: string;
};

async function ghFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'VARKA-media-github-driver/1.0',
      ...init?.headers,
    },
  });
  return res;
}

export function createGithubAdapter(opts: GithubAdapterOptions): StorageAdapter {
  const [owner, repo] = opts.repo.split('/');
  if (!owner || !repo) throw new Error('GITHUB_REPO must be "owner/repo"');
  const prefix = opts.pathPrefix.replace(/^\/+|\/+$/g, '');
  const base = opts.publicBaseUrl.replace(/\/+$/, '');

  const repoPath = (key: string) =>
    `${prefix}/${key.replace(/^\/+/, '')}`.replace(/\/+/g, '/');

  /** Existing file SHA, or null when the file does not exist yet. */
  async function getSha(key: string): Promise<string | null> {
    const res = await ghFetch(
      opts.token,
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(repoPath(key)).replace(/%2F/g, '/')}?ref=${encodeURIComponent(opts.branch)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`GitHub contents GET failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as GithubContentFile;
    return data.sha ?? null;
  }

  return {
    name: 'github',
    async put(input: PutObjectInput): Promise<PutObjectResult> {
      const key = input.key.replace(/^\/+/, '');
      const buf = Buffer.isBuffer(input.body) ? input.body : Buffer.from(input.body);
      const sha = await getSha(key);
      const res = await ghFetch(
        opts.token,
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(repoPath(key)).replace(/%2F/g, '/')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `media: ${sha ? 'update' : 'add'} ${key}`,
            content: buf.toString('base64'),
            branch: opts.branch,
            ...(sha ? { sha } : {}),
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`GitHub upload failed: HTTP ${res.status} ${body.slice(0, 200)}`);
      }
      return { key, sizeBytes: buf.length };
    },
    async delete(key: string): Promise<void> {
      const clean = key.replace(/^\/+/, '');
      const sha = await getSha(clean);
      if (!sha) return; // already gone
      const res = await ghFetch(
        opts.token,
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(repoPath(clean)).replace(/%2F/g, '/')}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `media: delete ${clean}`,
            sha,
            branch: opts.branch,
          }),
        },
      );
      if (!res.ok && res.status !== 404) {
        throw new Error(`GitHub delete failed: HTTP ${res.status}`);
      }
    },
    getUrl(key: string): string {
      return `${base}/${key.replace(/^\/+/, '')}`;
    },
  };
}
