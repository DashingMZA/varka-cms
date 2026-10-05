# Login fallback fix — 2026-10-05

## Ask
Admin login silently failed in production (varka-cms.vercel.app): clicking Log In
cleared the form with no error and no redirect to /dashboard.

## Investigation
- Server action `signInEmailAction` never received the submit: two independent
  live-Chromium tests (real mouse clicks, no programmatic submit) showed a native
  GET form submission (`/login` -> `/login?`) — React's `onSubmit` was not
  intercepting, i.e. client hydration/JS was not handling the form.
- Backend proven healthy: direct `POST /api/auth/sign-in/email` returned 200,
  set `__Secure-varka.session_token` cookie, and authenticated the owner
  (admin@csofts.com, emailVerified: true).
- Earlier fix (3463aea) forwarding Better Auth `set-cookie` in server actions was
  correct but insufficient — the form never reached the server action.

## Changes (commit 1eee360, pushed to origin/main via github push_files)
- NEW `apps/admin/src/app/api/auth/login/route.ts`: native form-POST login
  endpoint. Parses FormData, applies the same brute-force rate limit
  (`assertLoginRateLimit`), signs in via `auth.api.signInEmail` with
  `returnHeaders: true`, forwards `set-cookie` headers, redirects to
  `/dashboard` (or `/login?step=2fa`, or `/login?error=<code>` on failure).
- `apps/admin/src/components/login-form.tsx`: form now declares
  `action="/api/auth/login" method="post"` + `name` attributes on inputs, so it
  works with zero JS. Keeps the React `onSubmit` for the enhanced UX
  (inline errors, 2FA step) when JS works. Accepts `serverError`/`initialStep`
  props; shows localized `?error=` messages.
- `apps/admin/src/app/(auth)/login/page.tsx`: reads `searchParams`
  (`error`, `step`) and passes them to the form.
- `apps/admin/src/actions/auth.ts`: `signOutAction` now also clears the
  `__Secure-varka.session_token` cookie (production cookie name).
- `packages/i18n/locales/{en,ar,ur}/auth.json`: added `missingCredentials`.

## Verification
- `tsc --noEmit` on apps/admin: zero errors.
- Pushed via `github call-tool push_files` (user-approved); origin/main =
  1eee360. Vercel auto-deploys.

## Skills used
- `.claude/skills/wp-admin-dashboard/references/security.md` (login rate-limit +
  failed-attempt audit — both present in the new route handler).

## Follow-ups
- After Vercel deployment is READY, repeat the real-click login test on
  https://varka-cms.vercel.app/login — expect redirect to /dashboard.
- The underlying hydration failure root cause is still undiagnosed; the native
  POST fallback makes it non-blocking. If time permits, capture a browser
  console error from the login page to find why React doesn't hydrate.
- Then continue: fix the `varka-auth` web project build and deploy Astro.
