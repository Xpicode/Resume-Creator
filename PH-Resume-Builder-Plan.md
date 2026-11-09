# PH Resume Builder — Full Project Plan

> **Owner / decision maker:** Kian (Upright)
> **Plan written from three roles:** Software Engineer · UI/UX Designer · Cybersecurity
> **Goal:** A public, paid web app that helps Filipino job seekers build resumes that fit local hiring practices, tailor them to job posts with AI, and (later) fill out the government Personal Data Sheet.
> **Status:** Planning — v1.1 (Nov 2026). v1.1 cut the v1 scope for a solo developer, switched to one-document resume storage, and added user acquisition (1.6) and costs (10.1).

---

## Table of Contents

0. [How to use this file with your AI IDE](#0-how-to-use-this-file-with-your-ai-ide)
1. [Product definition](#1-product-definition)
2. [Recommended tech stack](#2-recommended-tech-stack)
3. [System architecture](#3-system-architecture)
4. [Data model](#4-data-model)
5. [UI/UX plan](#5-uiux-plan)
6. [Security & privacy plan](#6-security--privacy-plan)
7. [AI design](#7-ai-design)
8. [Phase-by-phase build plan](#8-phase-by-phase-build-plan)
9. [Testing & quality](#9-testing--quality)
10. [Monetization](#10-monetization)
11. [Legal & business checklist (PH)](#11-legal--business-checklist-ph)
12. [Launch checklist](#12-launch-checklist)
13. [Risks & mitigations](#13-risks--mitigations)
14. [Success metrics](#14-success-metrics)
15. [Open decisions for Kian](#15-open-decisions-for-kian)

---

## 0. How to use this file with your AI IDE

**Working model:** Kian decides → the AI IDE implements and audits → Claude advises and writes prompts.

**The rules the IDE must follow on every task live in [AGENTS.md](AGENTS.md)**, which most AI IDEs load automatically. (If yours reads a different file, such as `CLAUDE.md`, point that file to `AGENTS.md`.)

Give the IDE **one phase of Section 8 at a time**, not this whole file.

---

## 1. Product definition

### 1.1 Problem

Filipino job seekers — especially fresh grads — either use foreign resume builders that don't fit local hiring (no 2x2 photo, no eligibility/PRC/TESDA sections, no seminars, no character references), or they copy outdated Word templates. Most don't know how to make a resume pass ATS (applicant tracking system) filters used on JobStreet, Indeed and company career sites. Government applicants also struggle with the long Personal Data Sheet (PDS).

### 1.2 Solution

A mobile-first web app where a user:

1. Fills in a guided form built for PH resumes.
2. Picks a template (ATS-safe or traditional PH style with photo).
3. Downloads a clean PDF.
4. Optionally tailors it to a specific job post with AI.
5. (Later) Fills the CS Form 212 PDS once and exports it.

### 1.3 Target users (personas)

| Persona                                          | Situation                                       | Main need                                            |
| ------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| **Fresh grad (primary)**                         | Just graduated, has OJT, thesis, orgs, seminars | "I don't know what to put." Guidance + good examples |
| **Entry-level worker**                           | 1–3 years experience, applying to many jobs     | Fast tailoring per job post                          |
| **Career shifter**                               | Moving to a new field (e.g., BPO → IT)          | Re-framing past experience                           |
| **Government applicant**                         | Applying to LGU/agency posts                    | PDS + resume in one place                            |
| **Career office / training center (B2B, later)** | Helps many students/trainees                    | Bulk accounts, standard templates                    |

### 1.4 Positioning

"The resume builder made for how Filipinos actually apply for jobs." Differentiators:

- PH-specific sections and optional PH fields (photo, civil status, birthdate — all toggleable).
- Fresh-grad mode with guided examples.
- AI tailoring to a pasted job post — **never invents experience**.
- Pay with GCash, Maya or card; low-cost short passes instead of expensive subscriptions.
- PDS (CS Form 212) export — rare among resume tools.

### 1.5 Scope summary

| In scope (v1 public)                                                                                                                                           | Later                                                                                                                                                | Out of scope                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Accounts, multiple resumes, guided editor, 2 templates (ATS Classic, PH Traditional), PDF export, photo, AI bullet improver, AI tailoring, ATS check, payments | PDS export, share link, application tracker, resume import, Filipino UI, B2B accounts, cover letters, Modern template, dark mode, MFA, drag-and-drop | Job listings/matching, recruiter accounts, native mobile app, video resumes |

### 1.6 Getting the first 1,000 users

SEO guides take months to rank, so they cannot be the only channel. Test one channel in Phase 0, before building.

| Channel                                                             | What to do                                                                                             | When                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------- |
| **Facebook groups** (job hunting, fresh grads, school/batch groups) | Share free resume samples and tips with a link; follow each group's rules                              | Phase 0 test, then launch |
| **School career offices / training centers**                        | Offer a free resume workshop for a graduating class using the app (also the start of the B2B pipeline) | Phase 0 interviews → beta |
| **TikTok / Reels**                                                  | Short "fix this resume" videos with before/after                                                       | From the beta             |
| **SEO guides**                                                      | The 5 starter guides in Phase 3                                                                        | Launch; pays off later    |

**Phase 0 demand test:** a waitlist landing page plus one channel above. Starting hypothesis: 100 waitlist sign-ups in 2 weeks. If that is hard to reach, rethink the channel or the offer before building.

---

## 2. Recommended tech stack

Chosen for: one developer + AI IDE, strong security defaults, low starting cost, scales to paying users.

| Layer                | Choice                                                                      | Why                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | **Next.js 16 (App Router) + React 19 + TypeScript (strict)**                | Full-stack in one repo; server actions; you already use Next.js                                                                     |
| Styling / UI         | **Tailwind CSS v4 + shadcn/ui** (Radix-based)                               | Accessible components you own and can customize                                                                                     |
| Forms + editor state | **React Hook Form + Zod**, debounced autosave                               | One Zod schema shared by form and server; the form already holds the editor state, so no separate state library                     |
| Reordering           | **↑/↓ buttons** (no drag-and-drop library in v1)                            | Works on phones and with the keyboard; one implementation for all screens                                                           |
| Database             | **PostgreSQL on Supabase** (region: **Singapore**)                          | Closest region to PH; Postgres + RLS                                                                                                |
| Auth                 | **Supabase Auth** via `@supabase/ssr`                                       | Email + password, Google login, anonymous sign-in, email verification, CAPTCHA (TOTP MFA later)                                     |
| File storage         | **Supabase Storage** (private bucket)                                       | Profile photos with per-user access rules                                                                                           |
| PDF                  | **@react-pdf/renderer**                                                     | Real selectable text (ATS-friendly), embedded fonts, runs in Node. Server-side only — never in the browser bundle (see 3.2 Preview) |
| PDS export (Phase 4) | **ExcelJS** filling the official CSC template                               | The official PDS is distributed as an Excel file                                                                                    |
| Image processing     | **sharp**                                                                   | Resize, re-encode and strip EXIF/GPS from photos                                                                                    |
| AI                   | **Claude API** (Anthropic TypeScript SDK) behind a small provider interface | Haiku for quick rewrites, Sonnet for tailoring; swappable                                                                           |
| Payments             | **PayMongo** (Checkout Sessions; Subscriptions later)                       | GCash, Maya, cards; PH company                                                                                                      |
| Rate limiting        | **Supabase Auth built-in limits + AI credits + Vercel Firewall rules**      | No extra service in v1 (see 6.7); add Upstash Redis if abuse appears                                                                |
| Bot protection       | **Cloudflare Turnstile** (via Supabase Auth CAPTCHA)                        | Free, privacy-friendly                                                                                                              |
| Email                | **Resend** as custom SMTP for Supabase Auth + receipts                      | Supabase's built-in email is for testing only                                                                                       |
| Hosting              | **Vercel Pro** (app) + **Supabase** (DB/auth/storage)                       | Easy deploys, preview environments. Vercel's free Hobby plan does not allow commercial use (costs in 10.1)                          |
| DNS / WAF            | **Cloudflare** (DNS, optional proxy)                                        | DDoS protection                                                                                                                     |
| Monitoring           | **Sentry** (with PII scrubbing)                                             | Error tracking                                                                                                                      |
| Product analytics    | **PostHog** (cookieless mode) or **Plausible**                              | No personal data in events                                                                                                          |
| Testing              | **Vitest**, **Playwright**, **@axe-core/playwright**                        | Unit, E2E, accessibility                                                                                                            |
| CI                   | **GitHub Actions** + **Dependabot** + **CodeQL** + GitHub secret scanning   | Automated checks on every PR                                                                                                        |

> **Version rule for the IDE:** use the latest stable versions at project start, pin them in `package.json`, commit the lockfile. Do not use canary/preview releases.

**Why not Firebase / MongoDB / plain PHP?** Resume data is personal, and the account, payment and entitlement data around it is relational. Postgres + RLS gives database-level protection even if app code has a bug.

---

## 3. System architecture

### 3.1 High-level diagram

```
[Browser / Phone]
     │  HTTPS
     ▼
[Cloudflare DNS/WAF] ──► [Vercel: Next.js 16 app]
                              │
          ┌───────────────────┼─────────────────────┬──────────────────┐
          ▼                   ▼                     ▼                  ▼
 [Supabase Postgres+RLS] [Supabase Storage]   [Claude API]      [PayMongo]
 [Supabase Auth]         (private photos)     (AI features)     (payments + webhooks)
          │
 [Resend] (email)   [Sentry] (errors)
```

### 3.2 Key flows

**Editing:** browser edits → React Hook Form state → debounced (≈800 ms) server action `saveResume()` (whole document) → Zod validate → ownership check → Postgres (RLS also enforces owner). Uses an `updated_at` version check so two open tabs don't silently overwrite each other.

**Preview:** the server renders the PDF with the same react-pdf template used for export (single source of truth → preview = download). The browser only _displays_ it — either as page images made on the server, or drawn with pdf.js; the Phase 0 spike picks one. react-pdf itself never runs in the browser: it is heavy for low-end phones, and Android Chrome does not reliably show PDFs inside a page.

**Download:** `GET /api/pdf/[resumeId]` (Node runtime) → auth + ownership + plan check → render PDF on server → `Cache-Control: no-store` → file named `Lastname_Firstname_Resume.pdf`. Server-side render is what enforces premium templates.

**AI:** server action → auth (verified account only) → per-minute cap + credit check (atomic) → strip contact details → call Claude with a strict JSON output schema → validate with Zod → return suggestions → user accepts/rejects each one.

**Payments:** user clicks "Get Pass" → server creates PayMongo Checkout Session (server-side amount, never from browser) → user pays with GCash/Maya/card → **PayMongo webhook** → verify signature → idempotent insert → grant entitlement. The success redirect page only _shows_ status; it never grants access.

### 3.3 Folder structure

```
/
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/            # landing, templates, pricing, faq, privacy, terms, blog
│  │  ├─ (auth)/                 # login, signup, forgot-password, auth/callback
│  │  ├─ (app)/                  # protected area
│  │  │  ├─ dashboard/
│  │  │  ├─ resumes/[id]/edit/
│  │  │  ├─ resumes/[id]/tailor/
│  │  │  ├─ cover-letters/[id]/     # later — not in v1
│  │  │  ├─ settings/            # profile, security, privacy (export/delete)
│  │  │  └─ billing/
│  │  ├─ r/[slug]/               # public share page (Phase 4)
│  │  └─ api/
│  │     ├─ pdf/[id]/route.ts
│  │     └─ webhooks/paymongo/route.ts
│  ├─ components/
│  │  ├─ ui/                     # shadcn components
│  │  └─ editor/                 # section forms, item cards, toolbar
│  ├─ features/
│  │  ├─ resume/                 # actions, queries, schemas per section type
│  │  ├─ ai/                     # provider interface, prompts, schemas
│  │  ├─ billing/                # plans, checkout, entitlements
│  │  ├─ ats/                    # rule-based ATS checker
│  │  └─ pds/                    # Phase 4
│  ├─ pdf/
│  │  ├─ fonts/                  # bundled OFL fonts (must support ñ, é, etc.)
│  │  └─ templates/              # ats-classic.tsx, ph-traditional.tsx
│  ├─ lib/
│  │  ├─ supabase/               # server.ts, browser.ts, admin.ts ("server-only")
│  │  ├─ env.ts                  # Zod-validated environment variables
│  │  ├─ auth.ts                 # requireUser(), requireOwner()
│  │  ├─ rate-limit.ts           # AI per-minute cap counted from ai_usage rows
│  │  └─ security/               # headers, sanitize, image processing
│  └─ proxy.ts                   # Next.js 16 name for middleware: session refresh + headers only
├─ supabase/
│  ├─ migrations/                # SQL migrations incl. RLS policies
│  └─ seed.sql                   # fake data only
├─ tests/
│  ├─ unit/
│  ├─ rls/                       # "user A cannot read user B" tests
│  └─ e2e/
└─ .github/workflows/ci.yml
```

### 3.4 Environments

| Env        | App               | Database                        | Data             |
| ---------- | ----------------- | ------------------------------- | ---------------- |
| Local      | `next dev`        | Supabase CLI (Docker)           | Seed (fake) data |
| Staging    | Vercel preview    | Separate Supabase project       | Fake data only   |
| Production | Vercel production | Supabase production (paid plan) | Real users       |

Never copy production data into local or staging.

---

## 4. Data model

### 4.1 Design approach

- **Document model:** each resume is **one row** with a `content jsonb` column holding personal info, sections and items, validated by one `ResumeSchema` (Zod) built from a **schema per section type**. A resume is always loaded and saved whole and is small, so separate section/item tables would add tables, RLS policies and reorder code without benefit. Duplicate, tailored copy and data export become a one-row copy. Split into tables later only if cross-resume queries are needed.
- **Parse `content` with Zod on read as well as on write.** With Supabase, a user can write to their own rows directly through the API, bypassing server actions, so stored JSON is untrusted input.
- Every user-owned table has a `user_id` column so RLS policies stay simple and fast.
- All IDs are `uuid` (no guessable sequential IDs).
- Money stored as **integer centavos**.

### 4.2 Tables

**profiles** — 1:1 with `auth.users`

| Column                  | Type        | Notes                                                       |
| ----------------------- | ----------- | ----------------------------------------------------------- |
| id                      | uuid PK     | = `auth.users.id`                                           |
| display_name            | text        |                                                             |
| onboarding_goal         | enum        | `fresh_grad`, `experienced`, `career_shifter`, `government` |
| locale                  | text        | `en` default, `fil` later                                   |
| created_at / updated_at | timestamptz |                                                             |

**resumes**

| Column           | Type             | Notes                                                                                                         |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| id               | uuid PK          |                                                                                                               |
| user_id          | uuid FK          |                                                                                                               |
| title            | text             | e.g., "IT Support – Accenture"                                                                                |
| template_slug    | text             | `ats-classic`, `ph-traditional` (`modern` later)                                                              |
| paper_size       | enum             | `A4`, `LETTER`                                                                                                |
| settings         | jsonb            | accent color, font, which optional PH fields to show                                                          |
| content          | jsonb            | the whole resume: `personal` + `sections[]` (shapes below); size capped by a check constraint (~200 KB)       |
| has_photo        | boolean          | the photo path is always built on the server as `{user_id}/{resume_id}/photo.jpg`, never read from the client |
| parent_resume_id | uuid null        | set when duplicated/tailored from another resume                                                              |
| is_public        | boolean          | default `false` (Phase 4)                                                                                     |
| public_slug      | text unique null | random, ≥ 12 chars (Phase 4)                                                                                  |
| updated_at       | timestamptz      | used for conflict detection                                                                                   |
| created_at       | timestamptz      |                                                                                                               |

**`content.personal`** — object inside `resumes.content`

| Column                                     | Notes                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| first_name, middle_name, last_name, suffix |                                                                                                       |
| headline                                   | e.g., "Computer Science Graduate"                                                                     |
| email, phone, city_province                |                                                                                                       |
| full_address                               | optional, hidden by default                                                                           |
| birthdate, civil_status, nationality, sex  | **optional, all hidden by default**; show a tip that these are not required by most private employers |
| links                                      | jsonb array (LinkedIn, GitHub, portfolio)                                                             |

**`content.sections[]`** — array inside `resumes.content`; array order is the display order

| Column     | Notes                                                                                                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id         | uuid                                                                                                                                                                                                           |
| type       | enum: `summary`, `education`, `experience`, `internship`, `skills`, `trainings_seminars`, `licenses_eligibility`, `certifications`, `projects`, `organizations`, `awards`, `languages`, `references`, `custom` |
| title      | user can rename ("Work Experience" → "Employment History")                                                                                                                                                     |
| is_visible | boolean                                                                                                                                                                                                        |
| items      | array of items (below)                                                                                                                                                                                         |

**`sections[].items[]`** — array order is the display order

| Column           | Notes                                            |
| ---------------- | ------------------------------------------------ |
| id               | uuid; AI suggestions point at items by this id   |
| _(other fields)_ | validated by the Zod schema for the section type |

Example item schemas (Zod, simplified):

- `education`: school, degree/course, start/end (month-year or "Present"), honors, thesis_title, relevant_coursework[]
- `experience` / `internship`: company, role, location, start, end, is_current, bullets[] (max ~8, each ≤ 300 chars)
- `licenses_eligibility`: name (e.g., "Civil Service Professional", "PRC – Registered Nurse", "TESDA NC II – Computer Systems Servicing"), number (optional, **hidden by default**), date_passed, rating (optional), validity
- `trainings_seminars`: title, organizer, date, hours
- `references`: name, position, company, contact (optional) + section-level toggle "Available upon request"

**templates** — slug, name, is_ats_safe, supports_photo, is_premium, version

**job_targets** — id, user_id, resume_id, company, position, job_description (text, max 15,000 chars), created_at

**ai_suggestions** — id, user_id, resume_id, job_target_id, feature, payload jsonb, status (`pending`/`applied`/`dismissed`), created_at. Auto-delete after 90 days.

**cover_letters** _(later — not in v1)_ — id, user_id, resume_id, job_target_id, content, updated_at

**ai_usage** — id, user_id, feature, model, input_tokens, output_tokens, status, created_at. **No prompt or output text.**

**entitlements** — id, user_id, plan (`free`, `pass_30d`, …), ai_credits_remaining, starts_at, ends_at, source_payment_id

**payments** — id, user_id, provider, provider_ref, amount_centavos, currency, status, created_at

**webhook_events** — provider_event_id (unique), type, received_at, processed_at → guarantees idempotency

**consents** — id, user_id, consent_type (`privacy_policy`, `terms`, `ai_processing`, `marketing`), version, granted_at, withdrawn_at

**audit_log** _(later — not in v1; Supabase Auth keeps its own log of logins)_ — id, user_id, action (`login`, `password_change`, `export_data`, `delete_account`, `share_enabled`, …), entity, entity_id, created_at. No personal content.

_(Phase 3–4 tables: `applications` for the tracker, `pds_records` for the PDS.)_

### 4.3 RLS pattern (applied to every user-owned table)

```sql
alter table public.resumes enable row level security;

create policy "owner can select" on public.resumes
  for select using (auth.uid() = user_id);
create policy "owner can insert" on public.resumes
  for insert with check (auth.uid() = user_id);
create policy "owner can update" on public.resumes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner can delete" on public.resumes
  for delete using (auth.uid() = user_id);
```

- `payments`, `entitlements`, `webhook_events`, `ai_usage`: users get **select only on their own rows**; inserts/updates happen only from server code using the service role.
- **Plan limits are enforced in the database, not only in app code** (for example the Free plan's 1-resume limit as a check in the `resumes` insert policy or a trigger), because users can call the Supabase API directly.
- Storage bucket `photos` is **private**; policy allows access only when the first folder in the path equals `auth.uid()` (path: `{user_id}/{resume_id}/photo.jpg`).

---

## 5. UI/UX plan

### 5.1 Design principles

1. **Mobile-first.** Many PH users will build their resume on a phone. Every screen must work at 360px wide.
2. **Show, don't ask.** Every field has a realistic example placeholder ("e.g., Assisted 40+ customers daily at the front counter").
3. **Progressive disclosure.** Basic fields first; advanced/optional fields behind "More options".
4. **Never lose work.** Autosave with a visible "Saved · just now" indicator; offline warning.
5. **Honest guidance.** Tips explain _why_ (e.g., "Most private companies no longer require your birthdate or civil status").
6. **Low-bandwidth friendly.** Small JS bundles, lazy-load the PDF preview, compress images.
7. **Accessible:** WCAG 2.2 AA (contrast, keyboard navigation, labels, focus states, error messages announced to screen readers).

### 5.2 Sitemap

**Public:** Landing · Templates gallery · Pricing · FAQ · Blog (SEO guides) · Privacy Policy · Terms · Login · Sign up

**App:** Onboarding · Dashboard · Editor · Template picker · Tailor to job · ATS check · Download dialog · Share settings (Phase 4) · Application tracker (Phase 4) · PDS (Phase 4) · Settings · Billing

### 5.3 Main user flows

**First-time user (target: first PDF in under 15 minutes)**

1. Landing → "Create my resume — free"
2. Start building right away — no account yet (anonymous session, see 6.2). Creating an account (Google or verified email) is offered after the first download ("Keep your resume — create a free account") and is required for AI and payments
3. Onboarding: "What describes you?" (Fresh grad / Experienced / Career shifter / Government applicant) → pre-selects the right sections and order
4. Guided editor: one section at a time with progress bar (Personal → Education → Experience/OJT → Skills → Trainings → Licenses → References)
5. Pick template → preview → Download PDF
6. Prompt: "Applying to a specific job? Tailor this resume" (AI upsell)

**Returning user**
Dashboard → resume card → Edit / Duplicate / Tailor / Download / Delete

**Tailor to job**

1. Choose base resume → paste job post (or company + position + description)
2. AI analysis screen: matched keywords ✓, missing keywords ✗, suggested changes
3. Suggestions shown as **before → after** cards, each with **Accept / Edit / Dismiss**
4. Option to save as a _new tailored copy_ (keeps the original untouched)
5. _(Later: "Generate cover letter for this job")_

### 5.4 Screen specs (key ones)

**Dashboard**

- Resume cards: thumbnail, title, template, last edited, menu (Edit, Duplicate, Tailor, Download, Rename, Delete with confirm)
- "New resume" card; plan badge + AI credits left
- Empty state: friendly illustration + "Start with your first resume"

**Editor (desktop ≥ 1024px):** left panel = section list (↑/↓ buttons to reorder, eye icon to hide) + active section form; right panel = live preview with zoom and page-count indicator.

**Editor (mobile):** top tabs **Edit | Preview**; section list as collapsible cards; reorder with the same ↑/↓ buttons; sticky bottom bar: Save status · Preview · Download.

**Item form (Experience):** Company · Role · Location · Start/End month pickers · "I currently work here" · Bullets with "✨ Improve with AI" per bullet · inline tips.

**Download dialog:** template, paper size (A4/Letter), file name preview, "Hide optional personal fields" reminder, Download button.

**Settings → Privacy:** Download my data (JSON) · Delete account (type DELETE to confirm, explains what is deleted) · Consent history · AI processing toggle.

### 5.5 Resume templates (Phase 1: two — ATS Classic and PH Traditional)

| Template             | Layout                                                     | Photo    | ATS-safe   | Use for                                                  |
| -------------------- | ---------------------------------------------------------- | -------- | ---------- | -------------------------------------------------------- |
| **ATS Classic**      | Single column, standard headings, no icons/tables for text | No       | ✅         | Online applications (JobStreet, Indeed, company portals) |
| **Modern** _(later)_ | Single column, accent color, subtle dividers               | Optional | ✅         | General use                                              |
| **PH Traditional**   | Header with 2x2 photo, personal details block              | Yes      | ⚠️ partial | Walk-in / printed applications that ask for a photo      |

Template rules (all templates):

- Real text only (no text in images); standard section headings ("Work Experience", "Education", "Skills").
- Embedded fonts with full Filipino/Spanish character support (ñ, Ñ, é) — test names like "Peñaflorida" and "Santo Niño".
- Fonts must be OFL-licensed (e.g., Inter, Source Sans 3, Lora, Merriweather).
- Dates in one consistent format (e.g., "Jun 2025 – Aug 2025").
- Target 1 page for fresh grads; warn when > 2 pages.

### 5.6 Design system

- **Tokens:** colors, spacing (4px scale), radius, shadows, typography defined as CSS variables; light mode only in v1 (dark mode later; PDFs are always light).
- **UI font:** Inter. **Color direction:** trustworthy deep blue primary + warm accent for CTAs; success/warning/error colors at AA contrast.
- **Components:** shadcn/ui — Button, Input, Textarea, Select, Dialog, Sheet (mobile panels), Tabs, Toast, Tooltip, Progress, Card, Badge.
- **Microcopy tone:** friendly, encouraging, plain English (Filipino UI in Phase 4). Example: "Nice! Your Education section is done. Next: your OJT or work experience."

### 5.7 Accessibility checklist

- Every input has a visible label; errors linked with `aria-describedby`.
- All actions keyboard-reachable; visible focus ring.
- Reordering uses ↑/↓ buttons that work with the keyboard (no drag-and-drop in v1).
- Color is never the only signal (icons + text for ✓/✗ keyword matches).
- Automated axe checks in E2E tests; manual check with a screen reader before launch.

---

## 6. Security & privacy plan

Resume data is **personal information**, and several fields (age/birthdate, civil status, education, government-issued numbers) count as **sensitive personal information** under the Data Privacy Act of 2012 (RA 10173). Treat the whole database as sensitive.

### 6.1 Threat model (what we protect against)

| Threat                       | Example                                                  | Main controls                                                                                   |
| ---------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Broken access control / IDOR | User changes resume ID in URL to read someone else's     | RLS + server ownership checks + RLS tests                                                       |
| Account takeover             | Credential stuffing, weak passwords                      | CAPTCHA, rate limits, leaked-password check, email verification (MFA later)                     |
| Data leak via share links    | Guessable or indexed public resumes                      | Random slugs, off by default, `noindex`, revocable, hides contact info option                   |
| Malicious file upload        | Script disguised as image, GPS in EXIF                   | Type sniffing, size limit, re-encode with sharp, strip metadata, private bucket                 |
| XSS                          | Script in a resume field                                 | React escaping, no `dangerouslySetInnerHTML`, strict CSP                                        |
| Prompt injection             | Job post text telling AI to output something else        | Untrusted-content separation, JSON schema output, Zod validation, user approval                 |
| Payment fraud                | Fake "paid" redirect, replayed webhooks                  | Entitlements only from verified webhooks, idempotency, server-side prices                       |
| Abuse / cost attack          | Bots spamming AI endpoint or creating anonymous accounts | AI only for verified accounts, credits, per-minute caps, CAPTCHA on sign-up and anonymous start |
| Secret leakage               | Service role key in client bundle                        | `server-only` imports, env validation, secret scanning                                          |
| Supply chain                 | Compromised npm package                                  | Lockfile, Dependabot, `npm audit`, minimal dependencies                                         |
| Logging leaks                | Resume text in error logs                                | Never log content; Sentry PII scrubbing                                                         |

### 6.2 Authentication

- Supabase Auth: email + password and Google OAuth.
- **Anonymous sign-in** so people can build and download before creating an account (protects the 15-minute first-PDF target). The anonymous user is later converted to a permanent account by adding an email or Google login, keeping the same `user_id` and data.
  - Turnstile CAPTCHA on starting an anonymous session (Supabase recommends this).
  - Anonymous users can edit, preview and download; they **cannot** use AI, pay, or create more than 1 resume. Enforce this in RLS/policies using the `is_anonymous` JWT claim, not only in app code.
  - A scheduled job deletes anonymous accounts unused for 30 days, with their photos.
- **Email verification required** before using AI or paying.
- Password: minimum 10 characters; enable Supabase **leaked password protection** (check plan availability).
- **CAPTCHA (Turnstile)** on sign-up, anonymous start, login after failures, and password reset.
- **Optional TOTP MFA** later (after launch), recommended in settings.
- Sessions in **httpOnly, Secure, SameSite=Lax** cookies via `@supabase/ssr`.
- Re-authentication required for: password change, email change, account deletion, data export.
- Custom SMTP (Resend) with SPF, DKIM and DMARC on your domain so emails don't go to spam.

### 6.3 Authorization (most important)

- **Defense in depth:** (1) RLS in Postgres, (2) `requireOwner()` check in every server action/route, (3) tests proving user A can't touch user B's data.
- **Do not rely on `proxy.ts` (middleware) for auth decisions.** It only refreshes sessions and sets headers. Every protected page, action and route checks the user itself.
- The **service role key** is used only in `lib/supabase/admin.ts` (marked `server-only`) for webhooks and admin jobs.
- Server actions are public HTTP endpoints — treat each one like an API: auth → validate → authorize → act.

### 6.4 Input & output handling

- Zod validation on every server entry point; max lengths on all strings; reject unknown keys.
- React escapes output by default; **never** use `dangerouslySetInnerHTML` with user content.
- Rich text: **not used** in v1 (bullets are plain text). This removes a large XSS surface.
- Job description input: max 15,000 characters; stored as plain text.

### 6.5 File uploads (profile photo)

- Accept JPEG/PNG/WebP only; check **magic bytes**, not just the file extension.
- Max 5 MB upload → server re-encodes to JPEG ≤ 600×600 with sharp → **strips all EXIF/GPS metadata**.
- In-app 2x2 crop tool (square) before upload.
- Stored in a **private** bucket; served through short-lived signed URLs (e.g., 60 seconds).
- Deleted when the resume or account is deleted.

### 6.6 HTTP security headers

- `Content-Security-Policy`, `frame-ancestors 'none'` everywhere:
  - **App pages** (`(app)`, `(auth)`): strict CSP **with nonces** (scripts only from self + required providers).
  - **Marketing pages** (`(marketing)`): CSP **without nonces**. In Next.js, nonces force every page to render dynamically, which would hurt landing-page speed and SEO. These pages hold no user data.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation
- `Cache-Control: no-store` on all authenticated pages, PDF downloads and data exports

### 6.7 Rate limits (starting values — tune later)

No separate rate-limit service in v1. Add Upstash Redis only if abuse shows up in logs.

| Endpoint                                  | Limit                                        | How                                                                               |
| ----------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| Login / sign-up / reset / anonymous start | 5 per 15 min per IP + per email              | Supabase Auth built-in rate limits + Turnstile                                    |
| AI actions                                | 10 per minute per user, plus monthly credits | Count the user's `ai_usage` rows in the last minute; credits decrement atomically |
| PDF download                              | 30 per hour per IP                           | Vercel Firewall rate-limit rule (check what your plan includes)                   |
| Photo upload                              | 10 per hour per IP                           | Vercel Firewall rule                                                              |
| Data export                               | 3 per day per user                           | Vercel Firewall rule, or count rows if an export log is added                     |
| Public share page (Phase 4)               | 60 per minute per IP                         | Vercel Firewall rule                                                              |

### 6.8 Privacy by design

- **Data minimization:** optional PH fields (birthdate, civil status, sex, full address, license numbers) are hidden by default and clearly labeled optional.
- **AI minimization:** name, email, phone, address and photo are **removed before sending to the AI**; the AI gets only the text it needs.
- **Third-party data:** character references belong to other people — show "Ask your references for permission before listing their contact details" and offer "Available upon request".
- **User rights (DPA):** download my data (JSON), correct data (editor), delete account (hard delete of resumes, items, photos, AI history; payment records kept only as long as tax rules require — confirm the period with an accountant).
- **Retention:** AI suggestions auto-deleted after 90 days; job descriptions deleted with their resume; inactive free accounts — notify, then delete after 24 months (decide and state it in the Privacy Policy).
- **Consent:** record version + timestamp of Privacy Policy, Terms and AI-processing consent at sign-up; separate opt-in for marketing emails.
- **Analytics:** cookieless, no personal data in events (event names + anonymous IDs only).
- **Sentry:** scrub request bodies, disable session replay (or mask all inputs) on editor pages.

### 6.9 Data Privacy Act compliance tasks

- Appoint a **Data Protection Officer** (can be you at the start) and publish a DPO contact email.
- Write a **Privacy Policy** and **Terms of Service** (have a lawyer review before charging money).
- **NPC registration:** registration of data processing systems is **mandatory** once you process sensitive personal information of **1,000 or more individuals** (also for 250+ employees, or for risky processing / automated decision-making). A public resume app will likely cross 1,000 users — plan to register through the NPC Registration System (NPCRS) **before or at launch**. If not yet covered, NPC expects a sworn declaration for exemption. Confirm with a privacy lawyer.
- **Breach response plan:** who investigates, how to contain, and notification to the NPC and affected users within **72 hours** of knowing about a qualifying breach (confirm current NPC breach rules).
- Keep a **record of processing activities** (what data, why, where stored, who can access, how long kept).
- Sign/accept **data processing terms** with vendors (Supabase, Vercel, Anthropic, PayMongo, Resend, Sentry) and list them in the Privacy Policy as processors.
- Note cross-border transfer: data is stored in Singapore and processed by foreign providers — disclose this.

### 6.10 Operational security

- GitHub: 2FA required, protected `main` branch, PR checks required, secret scanning + push protection on.
- Vercel/Supabase/PayMongo accounts: 2FA on, least-privilege team roles.
- Rotate keys if leaked; keep a list of all secrets and where they're used.
- Backups: Supabase paid plan daily backups; **test a restore once before launch**.
- Pre-launch: OWASP ZAP baseline scan + manual IDOR testing + dependency audit.
- After launch: monthly dependency updates, quarterly access review.

---

## 7. AI design

### 7.1 Features

| Feature                           | Phase                | Model tier             | Notes                          |
| --------------------------------- | -------------------- | ---------------------- | ------------------------------ |
| Improve a bullet                  | 2                    | Fast (Claude Haiku)    | Returns 2–3 options            |
| Write summary                     | 2                    | Fast                   | From the user's own sections   |
| Tailor to job post                | 2                    | Strong (Claude Sonnet) | Keyword analysis + suggestions |
| Cover letter                      | Later (after launch) | Strong                 | Editable draft                 |
| ATS check                         | 2                    | **No AI** — rule-based | Free, instant, no cost         |
| Resume import (PDF/DOCX → fields) | 4                    | Strong                 | User reviews every field       |

Wrap the provider in `features/ai/provider.ts` so models can be changed in one place.

### 7.2 Honesty rules (hard requirements)

1. The AI may **only rephrase or reorder facts the user entered**. It must not add employers, titles, dates, numbers, degrees, licenses or skills the user didn't provide.
2. If a job requires something the user lacks, the AI lists it as a **gap** ("The job asks for Excel; add it only if you actually have this skill") — never inserts it.
3. **Automatic check:** after the AI responds, compare numbers and proper nouns in each suggestion against the user's original text. If something new appears, show a warning badge: "This adds details not in your resume — confirm it's true."
4. Nothing is applied without the user clicking **Accept**.

### 7.3 Prompt-injection defense

- System prompt contains the rules; the job description and resume text are passed as clearly delimited **untrusted data**, with the instruction that text inside them is never an instruction.
- Output must match a **JSON schema** (e.g., `{ suggestions: [{ itemId, original, proposed, reason }], missingKeywords: [], gaps: [] }`) and is validated with Zod; invalid output → retry once → friendly error.
- `itemId`s in output must exist in the user's resume, or the suggestion is dropped.
- The AI has **no tools** and cannot access any other data.

### 7.4 Cost control

- Credits per plan; credits decremented **atomically** in Postgres (`update … set credits = credits - 1 where credits > 0 returning …`).
- AI only for verified, non-anonymous accounts.
- Max input sizes; max output tokens per feature.
- Log tokens in `ai_usage` (no content) to calculate cost per user and set prices.
- Optional: cache identical "improve bullet" requests per user for 24h.

### 7.5 ATS check (rule-based)

Checks: contact info present · standard section headings · no missing dates · consistent date format · bullets start with action verbs · bullet length · page count · photo used with ATS template warning · keyword match % against the pasted job post (simple tokenization + stopword removal + synonyms list). Output: score + checklist with "Fix" buttons that jump to the field.

---

## 8. Phase-by-phase build plan

Time estimates assume one developer working part-time with an AI IDE. Each phase ends with a demo + checklist review by Kian.

---

### Phase 0 — Discovery & Foundations (≈ 1 week)

**Goal:** confirm demand, lock decisions, set up a secure project skeleton.

Tasks:

1. **Validate:** interview 8–10 people (fresh grads, HR, a career office, **2–3 government applicants**). Ask: how they make resumes now, what's hard, would they pay ₱99 for a job-hunt pass? **Ask about the PDS:** how painful is it, would they pay for it? The answer decides whether the PDS moves before launch (Section 15, decision 4).
2. **Demand test (Section 1.6):** a simple waitlist page + one acquisition channel for 2 weeks. Record sign-ups per channel.
3. **Preview spike (half a day):** render a sample resume on the server and show it on a low/mid-range Android phone, as page images and with pdf.js. Pick the one that is fast and sharp enough (Section 3.2).
4. Collect 10 real PH job posts (IT, BPO, admin, government) for testing AI and ATS rules later.
5. Decide product name; check domain availability and IPOPHL trademark search.
6. Wireframes (low-fidelity) for: Landing, Onboarding, Dashboard, Editor (desktop + mobile), Download dialog.
7. Design tokens + 2 template mockups (ATS Classic, PH Traditional).
8. Create repo, Next.js 16 + TypeScript strict, Tailwind v4, shadcn/ui, ESLint, Prettier. Copy [AGENTS.md](AGENTS.md) into the repo root.
9. Supabase projects (local, staging, prod — prod can wait until Phase 3), Singapore region.
10. `lib/env.ts` with Zod-validated env vars; `.env.example` committed, real `.env` ignored.
11. CI: typecheck, lint, unit tests, build; Dependabot; CodeQL; secret scanning + push protection.
12. Security headers + CSP baseline (nonces on app pages only, Section 6.6).
13. **Start the paperwork track** (Section 11): DTI registration, then BIR. PayMongo needs these documents and approval can take weeks, so it must not wait until Phase 3.

**Deliverables:** interview notes, demand-test numbers, preview-spike decision, wireframes, repo with CI green, deployed "Hello" page on staging.
**Done when:** CI passes on a PR; staging URL loads with security headers (check at securityheaders.com); the demand test reached its target, or Kian has decided what to change.

---

### Phase 1 — Core Resume Builder MVP (≈ 3–4 weeks)

**Goal:** a user can build a resume and download a professional PDF — with or without an account yet.

**1A. Auth & accounts (week 1)**

1. Anonymous start (Section 6.2) with Turnstile; privacy notice + consent shown before the first field.
2. Convert to a permanent account (email + Google), email verification, login, forgot password, logout.
3. Turnstile CAPTCHA on sign-up and reset.
4. `profiles` table + trigger to create a profile on sign-up (anonymous included).
5. Consent capture (Privacy Policy + Terms versions) at anonymous start; re-confirm at account creation.
6. Protected `(app)` layout with `requireUser()`.
7. Draft Privacy Policy and Terms pages (lawyer review in Phase 3).

**1B. Data layer (week 1–2)** 8. Migrations for `profiles`, `resumes` (with `content jsonb`), `templates`, `consents` — **with RLS in the same migration**, including the anonymous and Free-plan limits (Section 4.3). 9. `ResumeSchema` + one Zod schema per section type in `features/resume/schemas/`. 10. Server actions: create/rename/duplicate/delete resume; `saveResume` (whole document, `updated_at` check) — each with auth + ownership + Zod. 11. **RLS test suite:** two test users + one anonymous user; prove cross-user read/write/delete is blocked on every table, and the 1-resume limit holds even when calling the Supabase API directly.

**1C. Editor UX (week 2–3)** 12. Onboarding goal picker → default sections per goal. 13. Dashboard with resume cards and empty state. 14. Guided editor: section list, forms, inline tips/examples, show/hide, reorder with ↑/↓ buttons. 15. Autosave (debounced) + save indicator + conflict detection (`updated_at` check). 16. Optional PH fields toggles (hidden by default) with explanation tips. 17. Photo upload: crop to square → server re-encode + strip EXIF → private bucket.

**1D. Templates & PDF (week 3–4)** 18. Bundle fonts; build `ATS Classic` and `PH Traditional` react-pdf templates. 19. Live preview rendered on the server using the method picked in the Phase 0 spike (lazy-loaded, debounced). 20. `GET /api/pdf/[id]`: auth, ownership, `no-store`, proper file name, A4/Letter. 21. Test PDFs: special characters (ñ), long names, 2-page overflow, empty sections hidden, text is selectable/copyable (ATS).

**1E. Privacy features (week 4)** 22. Settings: download my data (JSON), delete account (re-auth + confirm + full cascade incl. photos). 23. Scheduled cleanup of anonymous accounts unused for 30 days (incl. photos).

**Paperwork track (not code, in parallel):** finish DTI + BIR; apply for the PayMongo merchant account.

**Phase 1 deliverables:** working builder on staging with 2 templates.
**Done when:**

- A new visitor goes from landing page → resume → PDF on a phone in < 15 min, without being forced to sign up first.
- RLS tests pass for every table.
- PDF text is selectable and passes a copy-paste test.
- Account deletion removes all user rows and files (verified by test).
- Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 on landing and dashboard.

---

### Phase 2 — AI Assistant & ATS Check (≈ 2–3 weeks)

**Goal:** make resumes better and job-specific, safely and affordably.

1. `features/ai/provider.ts` (Claude SDK) with model config per feature; API key server-only.
2. `ai_usage`, `job_targets`, `ai_suggestions`, `entitlements` tables + RLS.
3. Free-tier credits when an account is verified (via `entitlements`), atomic credit decrement. Anonymous users get no AI.
4. Per-minute AI cap on all AI actions (count recent `ai_usage` rows, Section 6.7).
5. **Improve bullet** (2–3 options) and **Write summary**.
6. **Tailor to job:** paste job post → keyword match, gaps, suggestions as before/after cards with Accept / Edit / Dismiss → option to save as a tailored copy.
7. Honesty checker (new numbers/proper nouns warning) — Section 7.2.
8. Prompt-injection tests: job posts containing "ignore previous instructions…" must not change behavior or output format.
9. **ATS check** (rule-based) with score and "Fix" links.
10. AI consent toggle in settings; if off, AI buttons explain why they're disabled.

**Done when:**

- 10 real PH job posts tested; no suggestion invents an employer, date, degree or license.
- Invalid AI output is handled gracefully (retry once, then friendly message).
- Credits can't go below zero even with 20 parallel requests (test).
- Average AI cost per active user is measured and recorded for pricing.

---

### Phase 3 — Monetization, Hardening & Public Launch (≈ 2–3 weeks)

**Goal:** accept payments safely and launch publicly.

**3A. Payments**

1. Plans config in code (`features/billing/plans.ts`) — prices only on the server.
2. PayMongo Checkout Session for one-time **Job Hunt Pass** (GCash, Maya, card). The merchant account should already be approved from the paperwork track.
3. Webhook route: verify signature with the webhook secret, store event ID (unique) for idempotency, then grant entitlement in a DB transaction.
4. Billing page: current plan, expiry date, credits left, payment history, receipts by email.
5. Expiry handling: downgrade gracefully (keep resumes; lock premium templates/AI beyond free credits).
6. Test with PayMongo test mode: success, failure, duplicate webhook, delayed webhook, refund.

**3B. Hardening** 7. Re-auth for sensitive actions confirmed. 8. Sentry with PII scrubbing; uptime monitor on landing + API health route. 9. OWASP ZAP baseline scan on staging; fix all High/Medium findings. 10. Manual IDOR test pass (try every ID-based URL/action with a second account and an anonymous one). 11. Backup restore drill on the production Supabase project. 12. Lawyer review of Privacy Policy and Terms; DPO contact published; NPC registration assessment done.

**3C. Launch** 13. Landing page with template gallery, honest feature list, FAQ, pricing. 14. SEO: metadata, sitemap, robots, Open Graph images; 5 starter blog guides (e.g., "Fresh graduate resume sample Philippines", "What to put in a resume with no experience", "ATS-friendly resume tips for JobStreet"). 15. Closed beta (20–50 users, recruited from the Phase 0 waitlist) → fix issues → public launch. 16. Feedback widget + support email.

**Done when:** a real ₱ payment via GCash in production grants access only after the webhook; refund removes access; launch checklist (Section 12) is 100% complete.

---

### Phase 4 — PH Power Features (≈ 3–4 weeks)

> If the Phase 0 interviews show strong demand from government applicants, move the PDS builder **before** Phase 3 launch (Section 15, decision 4). It is the feature competitors don't have.

1. **PDS builder (CS Form 212, Revised 2025):**
   - Download the **official Excel template from the CSC website**; map every field **from the actual file**, not from memory or old (2017) versions.
   - Separate `pds_records` table; reuse resume data where it matches (education, trainings, eligibility, work experience).
   - **Government ID numbers are not stored by default** — the user types them at export time; "Remember on this account" is an opt-in that stores them **encrypted at the column level**.
   - Export filled Excel (ExcelJS) and PDF; user signs it themselves — **never generate signatures**.
   - Show the form's warning that misrepresentation in the PDS has legal consequences.
2. **Shareable link** `/r/{random-slug}`: off by default, `noindex` by default, revocable, option to hide phone/email, view counter.
3. **Application tracker:** company, position, date applied, status (Applied → Interview → Offer → Rejected), notes, link to tailored resume.
4. **Import existing resume** (PDF/DOCX → AI extracts fields → user reviews each section before saving). Files processed in memory and not stored.
5. **Filipino UI** (`fil` locale) with `next-intl` or equivalent.
6. **Cut from v1, add when users ask:** cover letter generator (+ `cover_letters` table), Modern template, optional TOTP MFA, dark mode, `audit_log`, drag-and-drop reordering on desktop.

**Done when:** a PDS export opens correctly in Excel and matches the official layout field-by-field; share links can't be guessed or found by search engines unless the user allows it.

---

### Phase 5 — Growth & B2B (ongoing)

1. **Career office / training center accounts:** admin dashboard, bulk seat purchase, invite students by email, standard school template. (Admins see only aggregate stats unless a student explicitly shares a resume.)
2. More templates (industry-specific: nursing, seafarer, BPO, IT, teaching).
3. Referral program ("give 7 days, get 7 days").
4. Recurring subscription option via PayMongo Subscriptions.
5. Interview prep: common PH interview questions practice with AI feedback.

---

## 9. Testing & quality

| Type           | Tool                                    | What                                                                                                                |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Unit           | Vitest                                  | Zod schemas, ATS rules, honesty checker, plan/credit logic                                                          |
| RLS / security | Vitest + Supabase local                 | Cross-user access blocked on every table & storage bucket; anonymous and Free-plan limits hold via direct API calls |
| Integration    | Vitest                                  | Server actions with a real local DB                                                                                 |
| E2E            | Playwright                              | Anonymous start → build → download → create account; tailor flow; payment (test mode); account deletion             |
| Accessibility  | @axe-core/playwright                    | No serious/critical violations                                                                                      |
| PDF            | Snapshot + text extraction              | Text selectable, ñ renders, page count stable                                                                       |
| AI evals       | Script with 10+ saved job posts         | No invented facts; valid JSON; injection attempts fail                                                              |
| Performance    | Lighthouse CI                           | Mobile thresholds from Phase 1                                                                                      |
| Security scan  | OWASP ZAP baseline, `npm audit`, CodeQL | Before each release                                                                                                 |

**Global Definition of Done:** typecheck + lint + tests pass in CI · works at 360px · no new security warnings · RLS on new tables · no personal data in logs · Kian approved the demo.

---

## 10. Monetization

> Prices below are **starting hypotheses** to validate in Phase 0 interviews and the beta. Adjust after you know your AI cost per user.

| Plan                             | Price (hypothesis)                                    | Includes                                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free**                         | ₱0                                                    | 1 resume (AI tailoring edits that same resume; saving tailored copies is a paid feature), **both v1 templates including PH Traditional**, PDF download (no watermark), rule-based ATS check, small monthly AI credit allowance (verified accounts) |
| **Job Hunt Pass**                | ~₱99–₱149 / 30 days, one-time payment (no auto-renew) | Unlimited resumes and tailored copies, more AI credits, future premium templates, PDS export (Phase 4)                                                                                                                                             |
| **Pro (later)**                  | Monthly/yearly subscription                           | Same as Pass with auto-renew discount                                                                                                                                                                                                              |
| **School / Center (B2B, later)** | Per-seat or per-batch                                 | Bulk seats, admin dashboard, school template                                                                                                                                                                                                       |

Why a one-time pass first: many Filipino users prefer paying once via GCash/Maya over card-based auto-renewal, and it's simpler to build and support.

Why PH Traditional is free: it is the clearest proof of "made for how Filipinos apply". Charge for volume (more resumes, tailored copies, AI credits), not for the core promise.

**Avoid:** watermarks on free PDFs (it hurts trust and word-of-mouth); dark patterns like hard-to-cancel renewals.

### 10.1 Running costs and break-even (estimates — check current prices)

| Item            | Monthly cost (approx.)      | Notes                                                       |
| --------------- | --------------------------- | ----------------------------------------------------------- |
| Vercel Pro      | $20 (~₱1,150)               | Required: the free Hobby plan does not allow commercial use |
| Supabase Pro    | $25 (~₱1,450)               | Daily backups; needed for production                        |
| Resend          | Free tier at the start      | Upgrade when sign-ups exceed the free email limit           |
| Sentry          | Free developer tier         | One user                                                    |
| Domain          | ~₱100 (≈ ₱1,000–1,500/year) |                                                             |
| **Fixed total** | **≈ ₱2,700–2,900/month**    | Plus 12% VAT if the providers charge it                     |
| Claude API      | Variable                    | Keep under 25% of revenue (Section 14)                      |
| PayMongo fees   | ~2–4% per payment           | Depends on method; check current rates                      |

**Break-even (before income tax):** a ₱99 pass leaves about ₱72 after payment fees and 25% AI cost → **≈ 40 passes/month**. At ₱149 → **≈ 27 passes/month**. At 2–5% free-to-paid conversion, that needs roughly **800–2,000 active free users per month**, which is why Section 1.6 (acquisition) matters as much as the code.

---

## 11. Legal & business checklist (PH)

_Not legal or tax advice — confirm with a lawyer and an accountant._

**Start this in Phase 0.** The PayMongo merchant account needs the DTI and BIR documents, and approval can take weeks.

- [ ] Business registration (DTI for sole proprietorship, or SEC for a corporation), barangay clearance, mayor's/business permit as required by your LGU
- [ ] BIR registration and invoicing/receipts for online sales
- [ ] PayMongo merchant account (requires business documents)
- [ ] Privacy Policy, Terms of Service, Refund Policy (lawyer-reviewed)
- [ ] Data Protection Officer designated; NPC registration if covered (see 6.9)
- [ ] Vendor data processing agreements accepted and listed
- [ ] Trademark search (IPOPHL) for product name; register if you plan to scale
- [ ] Consumer-protection basics: clear pricing in pesos, what the pass includes, how refunds work
- [ ] Open-source license review of dependencies and fonts (OFL/MIT/Apache are fine)
- [ ] If you build this while employed, confirm your employment contract doesn't claim ownership of side projects

---

## 12. Launch checklist

**Product**

- [ ] Full flow works on Android Chrome (low/mid-range phone) and desktop
- [ ] Both templates tested with real fresh-grad and experienced resumes
- [ ] Anonymous start → download → create account works without losing data
- [ ] Error, empty and loading states for every screen
- [ ] Support email + FAQ live

**Security**

- [ ] RLS enabled + tested on every table and storage bucket
- [ ] ZAP baseline: no High/Medium issues open
- [ ] Manual IDOR testing done
- [ ] Rate limits active on auth, AI, PDF, uploads, export
- [ ] Security headers verified (A or A+ on securityheaders.com)
- [ ] Secrets only in Vercel/Supabase env; key rotation list written
- [ ] 2FA on GitHub, Vercel, Supabase, PayMongo, domain registrar

**Privacy & legal**

- [ ] Privacy Policy, Terms, Refund Policy published
- [ ] DPO contact published; NPC registration handled
- [ ] Data export and account deletion tested in production
- [ ] Breach response plan written

**Operations**

- [ ] Backups on + restore tested
- [ ] Sentry + uptime alerts go to your phone/email
- [ ] Payment webhook tested in production with a real small payment + refund
- [ ] Analytics events defined (no PII)

---

## 13. Risks & mitigations

| Risk                                            | Impact                                  | Mitigation                                                                                        |
| ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Big competitors (Canva, global resume builders) | Hard to get attention                   | Own the PH niche: PH sections, PDS, GCash, Filipino guides, SEO for PH searches                   |
| AI costs exceed revenue                         | Losses                                  | Credits, cheap model for small tasks, rule-based ATS, measure cost per user before setting prices |
| AI invents experience                           | Users get in trouble; reputation damage | Honesty rules, new-fact warnings, manual accept only                                              |
| Data breach                                     | Legal penalties, loss of trust          | Section 6 controls, minimal data, encrypted sensitive IDs, breach plan                            |
| PDS template changes                            | Broken exports                          | Template version field; monitor CSC downloads page; mapping tests                                 |
| Low willingness to pay                          | No revenue                              | Validate in Phase 0, low-price passes, B2B channel (schools/training centers)                     |
| Nobody finds the app                            | No users, no revenue                    | Acquisition plan (1.6) tested in Phase 0 before building                                          |
| Bots abuse anonymous sign-in                    | Database clutter, cost                  | Turnstile on anonymous start, no AI for anonymous users, 30-day cleanup job                       |
| Solo developer burnout                          | Delays                                  | Strict phases, v1 scope cut (Phase 4 item 6), launch before Phase 4                               |
| PDF rendering edge cases                        | Ugly or broken PDFs                     | Snapshot tests, character tests, page-overflow tests                                              |

---

## 14. Success metrics

| Metric                                  | Target (first 3 months after launch) |
| --------------------------------------- | ------------------------------------ |
| Activation: sign-ups who download a PDF | ≥ 50%                                |
| Time to first PDF (median)              | ≤ 15 minutes                         |
| Free → paid conversion                  | 2–5%                                 |
| AI cost per paying user                 | < 25% of what they pay               |
| Week-4 retention (returning users)      | ≥ 20%                                |
| Security incidents                      | 0                                    |
| Support response time                   | < 24 hours                           |

---

## 15. Open decisions for Kian

1. **Product name** (ideas to check: _Aplay_, _ResumeKo_, _HireReady PH_, _CVinas_ — verify domain + IPOPHL).
2. **Final pricing** and free-tier AI credit amount (after Phase 0 interviews and Phase 2 cost data). Check against the break-even in 10.1.
3. **Launch with or without Filipino UI?** (Plan says English first, Filipino in Phase 4.)
4. **PDS: before or after launch, and paid or free?** Decide after the Phase 0 interviews. Strong demand → build it before launch. Free PDS could be a strong marketing hook.
5. **First acquisition channel** to test in Phase 0 (Section 1.6).
6. **Business entity:** sole proprietorship (DTI) or under a company? Needed early — the paperwork track starts in Phase 0.
7. **B2B timing:** pitch to schools/training centers before or after public launch?
8. **Inactive account deletion period** (suggested: 24 months with email warning; anonymous accounts: 30 days).

---

_End of plan. Next step: review Section 15, lock decisions, then start Phase 0._
