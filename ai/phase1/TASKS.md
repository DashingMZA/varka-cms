# Phase 1 tasks — Auth, Users, RBAC, Admin Shell

| ID | Module | Task | Status |
|---|---|---|---|
| `1.1` | auth | Better Auth package + Prisma adapter wiring | done |
| `1.2` | auth | User, Session, Account, Verification models | done |
| `1.3` | auth | Email/password sign-in | done |
| `1.4` | auth | Secure cookie session config | done |
| `1.5` | auth | Login rate-limit interface (in-memory adapter) | done |
| `1.6` | auth | Brute-force lockout (5 failures → cooldown) | done |
| `1.7` | auth | Email verification + password reset hooks (SMTP port) | done |
| `1.8` | rbac | Seed roles | done |
| `1.9` | rbac | Permission catalog + role maps | done |
| `1.10` | rbac | requirePermission() server helper | done |
| `1.11` | rbac | Permission unit tests (pure) | done |
| `1.12` | users | Admin users service list/create/disable | done |
| `1.13` | users | Reset password + revoke sessions service | done |
| `1.14` | admin-shell | Next.js 16 admin app scaffold | done |
| `1.15` | admin-shell | Nav IA + dashboard shell | done |
| `1.16` | admin-shell | Dashboard placeholder (real zeros) | done |
| `1.17` | auth | Seed owner from env | done |
| `1.18` | auth | Google + GitHub OAuth (env-gated) | done |
| `1.19` | docs | Memory + phase STATUS update | done |

## Checkboxes

- [x] **1.1**–**1.19** source implemented (runtime gates on local machine)
