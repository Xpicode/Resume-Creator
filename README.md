# PH Resume Builder

Resume builder for Filipino job seekers. Full plan: [PH-Resume-Builder-Plan.md](PH-Resume-Builder-Plan.md). Rules for AI coding agents: [AGENTS.md](AGENTS.md).

**Status:** Phases 1 (core builder) and 2 (AI assistant + ATS check) built — see the notes at the end for what still needs a person to check.

## Run locally

Requires Node.js 20.9+ (CI uses 24) and Docker Desktop (for the local database).

```bash
npm install
npx supabase start            # local database, auth and storage in Docker
cp .env.example .env.local    # paste the keys printed by `supabase start`, add the two secrets
npm run dev                   # http://localhost:3000
```

Useful local pages: Supabase Studio http://127.0.0.1:54323 (browse data) and Mailpit http://127.0.0.1:54324 (confirmation and password-reset emails).

Reset the database (re-runs all migrations and the local-only `supabase/seed.sql`):

```bash
npx supabase db reset
```

Checks (all must pass before a task is done — see AGENTS.md). Tests in `tests/rls/` need the local database running; without it they are skipped.

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

## AI features (Phase 2)

Add `ANTHROPIC_API_KEY` to `.env.local` (and Vercel) to turn them on; without it the AI buttons say "not available" and everything else works. Set a monthly spend limit in the Claude Console.

- Models, effort and credit prices: `src/features/ai/config.ts` (Haiku 5.5 for bullet/summary rewrites, Sonnet 5.5 for tailoring, per the plan).
- Free plan: 10 AI credits a month (bullet = 1, summary = 1, tailoring = 3). Change `free_monthly_ai_credits()` in the migration and `FREE_MONTHLY_AI_CREDITS` together.
- Live eval — calls the real API and **costs money** (about $0.10–0.30 per run): `npm run ai:eval`. It prints the average cost per call. Replace the synthetic posts in `tests/eval/job-posts.ts` with the 10 real PH job posts from Phase 0.

## Payments (Phase 3)

Job Hunt Pass: ₱99 for 30 days, one-time (PayMongo: GCash, Maya, card). Price, days and credits live only in `src/features/billing/plans.ts`.

1. PayMongo dashboard → Developers: copy the **test** secret key (`sk_test_…`) into `PAYMONGO_SECRET_KEY`.
2. Developers → Webhooks → add endpoint `https://<your-domain>/api/webhooks/paymongo` with events `checkout_session.payment.paid`, `payment.refunded`, `payment.refund.updated`; copy its secret into `PAYMONGO_WEBHOOK_SECRET`. (PayMongo can't reach `localhost` — test webhooks on staging, or with a tunnel such as `cloudflared tunnel --url http://localhost:3000`.)
3. Buy a pass in test mode → Billing shows "confirming…" until the webhook arrives, then the pass. Refund it in the PayMongo dashboard → the pass ends.
4. Live: switch to `sk_live_…` and a separate live webhook. A live key only accepts live events (and a test key only test events).

**Refund by hand** (if a refund webhook never arrives) — Supabase Studio → SQL editor:
`select process_payment_event('manual-' || gen_random_uuid(), 'payment.refunded', true, null, 'pay_…', null, 30, 100);`

## Try the flow

1. Open http://localhost:3000/start, tick the box, **Start my resume** (guest session).
2. Pick a goal → the editor opens with the matching sections. Changes save automatically.
3. **Download PDF**. Then **Save my resume** → create an account (confirm via Mailpit). The resume moves to the new account.

## Before staging / production

1. **Supabase project (Singapore):** link it and push the migrations (`npx supabase link`, `npx supabase db push`). In the dashboard:
   - Authentication → Sign In / Providers: enable **anonymous sign-ins**, **email confirmations**, minimum password length **10**, **leaked password protection**; add **Google** (OAuth client from Google Cloud).
   - Authentication → URL Configuration: site URL + `https://<your-domain>/auth/callback` in redirect URLs.
   - Authentication → Attack Protection: enable **Turnstile** with your secret key.
   - Authentication → SMTP: use Resend (plan 6.2); the built-in email is for testing only.
2. **Vercel env vars:** everything in `.env.example`. `CRON_SECRET` enables the daily guest cleanup in `vercel.json`.
3. **GitHub:** turn on CodeQL default setup, secret scanning and push protection; protect `main` and require the CI check.
4. **Before sharing any link:** set the real privacy and support emails in `src/lib/site.ts`; have a lawyer review `/privacy-policy`, `/terms` and `/refund-policy` (all marked draft).
5. **Monitoring:** create a Sentry project (free tier) and set `NEXT_PUBLIC_SENTRY_DSN`; point an uptime monitor (e.g. UptimeRobot / Better Stack, free) at `https://<your-domain>/` and `/api/health`, alerting your phone.
6. **Vercel Firewall rate limits per IP** (extra layer; the app already limits per user, see Phase 3 notes): PDF download 30/hour (`/api/resumes/*/pdf`), preview 60/minute (`/api/resumes/*/preview`), export 3/day (`/api/export`). Set `NEXT_PUBLIC_SITE_URL` to the real domain.

## Where things are

| Path                                                      | What                                                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/`                                    | Tables, RLS policies, plan limits, photo bucket — RLS in the same file as each table                                      |
| `src/features/resume/sections.ts`                         | Every section type and its fields — schemas, editor forms and PDF all come from here                                      |
| `src/features/resume/schema.ts`, `view.ts`                | Zod schemas; what the PDF prints (dates, hidden fields, empty sections)                                                   |
| `src/features/resume/actions.ts`                          | Create / duplicate / delete / autosave / photo upload                                                                     |
| `src/features/editor/`                                    | The editor (autosave, sections, personal info, preview, download dialog)                                                  |
| `src/pdf/`                                                | Fonts, the two templates, PDF and preview-image rendering                                                                 |
| `src/features/auth/`                                      | Guest start, sign-up, login, Google, reset, guest→account merge                                                           |
| `src/features/account/`                                   | Delete account, merge, guest cleanup (service role)                                                                       |
| `src/app/api/`                                            | PDF, preview, photo, data export, cleanup cron                                                                            |
| `src/proxy.ts`, `src/lib/security/`                       | Nonce CSP for app pages, session refresh, image checks                                                                    |
| `src/features/ai/`                                        | AI: config, provider (only file that calls Claude), guard (consent, credits, limits), prompts, honesty check, tailor page |
| `src/features/ats/check.ts`                               | Rule-based ATS check (no AI)                                                                                              |
| `src/features/billing/`, `src/app/api/webhooks/paymongo/` | Plans, PayMongo checkout + signed webhook, Billing page helpers                                                           |
| `src/features/share/`, `src/app/r/[slug]/`                | Public share links: settings page, public page + PDF, what a link may show                                                |
| `src/features/blog/posts.ts`, `src/app/(marketing)/`      | Landing, pricing, FAQ, guides, legal pages; `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`                              |
| `tests/unit/`, `tests/rls/`                               | Vitest; `rls/` runs against the local database                                                                            |
| `tests/eval/`                                             | Live AI eval (`npm run ai:eval`), not part of `npm test`                                                                  |

## Phase 1 notes

Choices that differ from the plan text, each simpler and easy to upgrade later:

- **Preview:** server-rendered image of all pages (the Phase 0 Option A). The phone test from Phase 0 is still worth doing on the real editor.
- **Editor state:** plain React state instead of React Hook Form — the whole resume is one object; Zod validates every save on the server.
- **Photo crop:** the server crops to a square around the most detailed area (usually the face); no manual crop tool yet.
- **Guest → existing account:** handled for password login, Google and email sign-up (the gap found in the plan review). The guest's resume moves over even if that puts a Free account above 1 resume.
- **No audit log, no progress bar, no rename on the dashboard** (rename is the "Resume name" field in the editor).

Not yet checked by a person: everything in a real browser (forms, Turnstile widget, autosave, conflict message, photo upload, download dialog, mobile layout at 360 px), Google sign-in (needs OAuth keys), and the Lighthouse / accessibility targets.

## Phase 2 notes

- AI is **off until the user turns it on** (first click on any AI button, or Settings). Guests and unconfirmed emails can't use it. Names, contact details and the photo are never sent.
- Every AI call: verified account → consent → 10 calls/minute cap → credits charged atomically in the database (tested with 20 parallel requests) → refunded if the AI fails or refuses. `ai_usage` logs tokens only, never text.
- Honesty: suggestions can only rephrase existing text (headline, summary, bullets); targets are checked against the resume; new numbers or names get a warning badge; nothing changes until the user clicks Use this / Accept.
- Tailoring uses Sonnet 5.5 with server-side refusal fallback (`fallbacks: "default"`). Haiku 5.5 has no server fallback — a refusal there shows a message and refunds the credit.
- "Save as a tailored copy" is not built: it needs more than 1 resume, which is a Job Hunt Pass feature (Phase 3). Free users apply suggestions to the same resume (plan 10).
- Not yet done by a person: running `npm run ai:eval` with a real key (needs your OK to spend), the 10 real job posts, measuring average AI cost per active user, and clicking through the AI screens in a browser.

## Phase 3 notes

- **Payments:** access is granted only by the signed webhook, in one database transaction with the event id stored for idempotency. Tested through the real route: success, delayed webhook, duplicate webhook, same payment twice, forged signature, wrong mode, wrong amount, failed payment, refund (ends the pass, removes credits), stacking a second pass, resume limit, account deletion (payment record kept but unlinked, for tax records).
- **Pass benefits:** up to 50 resumes and 100 AI credits for 30 days. "Tailored copy" = Duplicate on the dashboard, then Tailor the copy (no separate button yet). After a pass ends, extra resumes stay editable; creating new ones is blocked.
- **Sentry** is off until `NEXT_PUBLIC_SENTRY_DSN` is set; no request bodies, cookies, headers, user or Session Replay. The browser SDK only downloads when a DSN is set.
- **Rate limits (per user, in the database):** preview 60/minute, PDF 30/hour, photo upload 10/hour, export 3/day — `src/lib/security/rate-limit.ts`. Over the limit: 429 / a friendly message; the preview says "paused". Counters are deleted after 2 days by the daily cleanup. Auth limits are Supabase's (+ Turnstile); AI is 10/minute + credits; checkout 5/hour.
- **Feedback** is a "Send feedback" email link in the app footer (no feedback table — read the inbox).
- **Not built (plan "later" or not needed yet):** analytics events, a separate /pricing page (pricing is on the landing page), a PayMongo receipt page (PayMongo emails receipts).
- **Only you can do:** PayMongo merchant approval and test-mode run with real test keys, lawyer review (Privacy, Terms, Refund), DPO contact + NPC registration check, OWASP ZAP scan on staging, manual IDOR pass with two accounts, backup restore drill on production Supabase, Sentry + uptime alerts, closed beta (20–50 users from the waitlist), a real ₱ GCash payment + refund in production.

## Phase 4 notes

- **Share links (done):** Editor or dashboard → **Share**. Off by default; a link is 16 random characters (can't be guessed or listed); turning it off deletes it for good and turning it on again makes a new one. The public page `/r/{link}` and its PDF are `noindex` unless the owner allows search engines. Phone, email and full address are hidden unless the owner shows them; the photo and optional PH details (birthdate, civil status, sex, nationality) are never on a public link. Views are counted (no visitor data stored). Public PDF downloads: 60/hour per owner.
- **PDS builder:** waiting for the official file. CSC replaced the form: **CS Form No. 212, Revised 2026** (CSC MC No. 05, s. 2026), not "Revised 2025" as the plan says. Download the Excel from csc.gov.ph and save it as `docs/pds/CS-Form-212-Revised-2026.xlsx`; the builder is mapped from that file.
- **Not started (your choice):** application tracker, import existing resume, Filipino UI.
