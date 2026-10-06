# Login page redesign (ElevenLabs-style) — 2026-10-05

User request: modernize /login like ElevenLabs — password eye toggle (RTL-aware),
"Remember me" checkbox, graceful modern background.

## What was done
- `apps/admin/src/components/login-form.tsx` — full rewrite:
  - "Welcome back" heading + subtitle (i18n `welcomeBack`, `signInSubtitle`)
  - Password field with inline SVG eye/eye-off toggle button
    - positioned with `inset-inline-end` → right in LTR, left in RTL automatically
    - `aria-label`/`title` use `showPassword`/`hidePassword` i18n keys
  - Row above password input: label left, "Forgot password?" right (ElevenLabs layout)
  - Remember me checkbox (`name="remember"`) below password field
- `apps/admin/src/actions/auth.ts` — `signInEmailAction(email, password, rememberMe)`
  passes `rememberMe` to Better Auth `signInEmail` body (extends session cookie).
- `apps/admin/src/app/api/auth/login/route.ts` — native POST fallback reads
  `form.get('remember')` and passes it through too.
- `apps/admin/src/app/(auth)/login/page.tsx` — removed old WP card wrapper.
- `apps/admin/src/app/wp-login-media.css` — new `.v-login-*-modern` styles:
  clean white bg with soft radial gradients, rounded inputs/buttons,
  dark-mode polish, RTL handled via logical properties.
- i18n: `showPassword`/`hidePassword` in en/ur/ar auth.json (es falls back to en);
  `backToSite` in en/ur/ar/es common.json.

## Verification
- `npx tsc --noEmit` clean, `npx next build` succeeded.
- NOT visually verified (sandbox can't reach dev server / no local chromium).
  User should pull and check /login in EN + UR (RTL eye position).

## Notes
- GitHub push blocked: GitHub App write access expired (403). User must
  re-install via https://github.com/apps/meta-muse-ai/installations/new
  before this commit (6b495c4) can be pushed.
