# PH Resume Builder

Resume builder for Filipino job seekers. Full plan: [PH-Resume-Builder-Plan.md](PH-Resume-Builder-Plan.md). Rules for AI coding agents: [AGENTS.md](AGENTS.md).

**Status:** Phase 0 — waitlist page, preview spike, project foundations.

## Run locally

Requires Node.js 20.9+ (CI uses 24).

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev                  # http://localhost:3000
```

Checks (all must pass before a task is done — see AGENTS.md):

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

## One-time setup

1. **Supabase (staging project, Singapore region):** open SQL Editor and run
   `supabase/migrations/20261109000000_waitlist.sql`. Put the project URL, secret key and
   publishable key in `.env.local` (and the first two in Vercel's environment settings).
   Then `npm test` also runs `tests/rls/`, which proves the browser key cannot read or write the waitlist.
2. **Cloudflare Turnstile:** `.env.example` holds Cloudflare's test keys (always pass). Create a
   real widget in the Cloudflare dashboard for staging/production and set
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` in Vercel.
3. **GitHub repo settings:** turn on CodeQL (Code security → default setup), secret scanning and
   push protection; protect `main` and require the CI check.
4. **Vercel:** import the repo. Check the headers on the staging URL at securityheaders.com.
5. **Before sharing the waitlist link:** set the real privacy contact in `src/lib/site.ts`.

## Where things are

| Path                                       | What                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| `src/app/(marketing)/`                     | Waitlist landing page and Privacy Notice                       |
| `src/features/waitlist/`                   | Form, server action, Zod schema                                |
| `src/lib/security/csp.ts` + `src/proxy.ts` | Security headers; nonce CSP for app pages only                 |
| `src/lib/env.ts`                           | Zod-validated server env                                       |
| `src/app/spike/preview/`                   | **Throwaway** preview spike — delete once the method is chosen |
| `supabase/migrations/`                     | SQL migrations (RLS in the same file as each table)            |
| `tests/unit/`, `tests/rls/`                | Vitest tests                                                   |

## Preview spike (plan 3.2)

Open `/spike/preview` on a low/mid-range Android phone (same Wi-Fi: `npm run build && npm start`,
then `http://<your-PC-IP>:3000/spike/preview`, or use the Vercel preview URL). Tap each option a
few times and note the timings and text sharpness. Server-side results measured on the dev PC:

| Option                  | Server render | Download               |
| ----------------------- | ------------- | ---------------------- |
| PDF (for pdf.js)        | ~330 ms       | 16 KB + pdf.js library |
| A: image, PNG (2x)      | ~250–430 ms   | 231 KB                 |
| A: image, WebP q90 (2x) | ~250–310 ms   | 94 KB                  |
