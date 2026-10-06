# Public registration with manual approval — 2026-10-05

User request: create /register page (ElevenLabs-style), gated by dashboard setting,
manual admin approval, mandatory email verification.

## What was done
- `apps/admin/src/app/(auth)/register/page.tsx` — new; redirects to /login when
  registration disabled (`general.membership` setting).
- `apps/admin/src/components/register-form.tsx` — new; ElevenLabs-style:
  Full Name, Email, Password (eye toggle), validation via registerSchema,
  "Already registered? Sign in" link, Terms/Privacy note, success state.
- `apps/admin/src/actions/auth.ts`:
  - `signUpEmailAction(name, email, password)` — checks `general.membership`,
    validates, calls Better Auth signUpEmail, sets `disabled: true` on the new
    user (pending admin approval), assigns default role from settings.
  - `getRegistrationStatusAction()` — public check for the register page.
  - `signInEmailAction` now blocks disabled accounts with "pending admin approval".
- `apps/admin/src/app/(auth)/login/page.tsx` + `login-form.tsx` — "Don't have an
  account? Create account" link shown when registration enabled.
- i18n: registration keys in en/ur/ar auth.json (es falls back to en).
- CSS: `.v-login-hint`, `.v-login-terms` + dark mode.

## Security notes
- Email verification enforced by Better Auth (`requireEmailVerification` in prod,
  `sendOnSignUp: true`).
- New users are `disabled: true` — cannot sign in until admin enables them in
  Users page (existing enable/disable UI).
- Password min length 12 (Better Auth config + registerSchema).
- Registration toggle: Settings → General → "Anyone can register" (membership).

## Verification
- `npx tsc --noEmit` clean, `npx next build` succeeded.
- Pushed via github-pat contents-push (12/12 files).
- NOT live-tested (needs Vercel deploy + real signup flow test).
