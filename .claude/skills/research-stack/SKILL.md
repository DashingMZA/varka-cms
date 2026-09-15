---
name: research-stack
description: Look up current stable package versions and official APIs before installing. Use on Phase 0 and any dependency bump.
---

# Research stack

1. Read `ai/docs/STACK.md` (lock + date).
2. Live-check npm `latest` **and** dist-tags (`latest`, `next`, `prev`).
3. Prefer **stable LTS**. Reject RC/canary unless an ADR says otherwise.
4. Confirm peer compatibility (Next 16.3 ↔ React 19 ↔ Better Auth ↔ Prisma 7).
5. If lock changes: ADR + update STACK.md with date and source URL.

Known trap (2026-09-14): npm `prisma@latest` may be **8 RC**. We stay on **7.10.x** until 8.0.0 stable.
