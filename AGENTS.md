# PH Resume Builder — rules for AI coding agents

Full plan: [PH-Resume-Builder-Plan.md](PH-Resume-Builder-Plan.md). Read only the phase you are working on (Section 8) and the sections it points to — not the whole file.

**Working model:** Kian decides → the AI IDE implements and audits → Claude advises and writes prompts.

Rules for every task:

1. **Work one phase at a time, one task at a time.** Do not start the next task until the current one meets its acceptance criteria.
2. **Never overwrite Kian's own edits.** Read the current file before changing it. If something conflicts with the plan, stop and ask.
3. **Security rules in Section 6 of the plan are mandatory**, not suggestions. A task is not done if it breaks one.
4. **Every database table gets Row Level Security (RLS) in the same migration that creates it.**
5. **Every server action and API route checks the logged-in user itself.** Never trust a `userId` or `resumeId` coming from the browser without checking ownership.
6. **Validate all input with Zod** on the server, even if the form already validated it. Parse stored resume `content` with Zod on read too.
7. **No secrets in client code.** Anything starting with `NEXT_PUBLIC_` is public.
8. **Never log resume content, job descriptions, AI prompts, or personal info.**
9. **Write tests with the feature** (see Section 9 of the plan), not after.
10. **Before marking a task done:** `typecheck`, `lint`, `test` all pass, and the feature works on a phone-size screen (360px wide).
11. **Do not add libraries or features the plan marks as "later" or "cut from v1"** (for example drag-and-drop, Zustand, Upstash, dark mode, cover letters, MFA). Ask first.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
