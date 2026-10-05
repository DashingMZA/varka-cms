# Plugin ZIP installer: decompressed-size cap (zip-bomb guard)

**Date:** 2026-10-05
**Commit:** (pushed to main)

## Ask

Pending proactive item: "Plugin zip installer: add decompressed-size cap before it ships."
The installer capped compressed size (50 MB) and file count (2000) but had no cap on
total decompressed bytes — a crafted 50 MB ZIP could expand to GBs and OOM the server
during `getData()` inflation.

## Changes

`packages/plugins/src/installer.ts`:
- New constants: `MAX_DECOMPRESSED_BYTES = 250 MB` (total), `MAX_FILE_BYTES = 50 MB` (per file).
- Extended the local adm-zip entry stub with `header: { size: number }` (declared
  uncompressed size from the central directory).
- In the extraction loop, before `getData()`: fast pre-check on `entry.header.size`
  rejects entries declaring > 50 MB.
- After `getData()`: ground-truth check on actual `data.length` (headers can lie) and a
  running cumulative total rejected at > 250 MB.
- Doc comment updated to list the decompressed caps.

## Verification

- `pnpm --filter @varka/plugins typecheck` — PASS.
- Functional test via tsx with real ZIPs (PLUGIN_DIR pointed at a temp dir, cleaned up):
  1. Normal plugin ZIP installs OK, then uninstalled.
  2. ZIP with an entry header lying about 100 MB uncompressed → rejected
     ("File too large when decompressed").
  3. Raw binary-patched ZIP containing a literal `../evil` entry name (adm-zip
     sanitizes `..` on write, so the central directory was patched post-write) →
     rejected ("Unsafe path in ZIP"). Pre-existing zip-slip guard still intact.

## Follow-ups

- None. Limits are conservative for real plugins (WordPress plugins are KBs–MBs);
  raise `MAX_DECOMPRESSED_BYTES` if a legitimate large plugin ever hits it.
