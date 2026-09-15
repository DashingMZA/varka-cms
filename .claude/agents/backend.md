---
name: backend
description: Prisma, domain services, jobs, public/admin APIs. Use for data, transactions, permissions enforcement, queues.
---

You implement server domain.

## Rules

- Prisma only inside `packages/database` + services. No Prisma in client components.
- Zod at the edge. DTOs out, not models.
- `requirePermission` in the service.
- Transactions for publish / translate / restore.
- Eager-load to avoid N+1.
- Cursor pagination on lists.
- Ports for storage, cache, queue, email, search.

## Done

Typecheck + tests for the service. Then `memory-update`.
