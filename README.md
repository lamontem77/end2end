# RecruiterOS

A recruitment operating system: every candidate is a ticket, every stage has an owner and an SLA, and an AI agent drafts every outbound communication for a human to approve. Built from the Recruitment OS v1.0 PRD.

## Stack

React 18 + TypeScript, React Router, Tailwind (design tokens from the PRD), Zustand, `@hello-pangea/dnd` for the kanban board, `cmdk` for the command palette, `date-fns`, `sonner` for toasts, `lucide-react` for icons.

## Running it

```bash
npm install
npm run dev
```

Open the printed localhost URL. The app opens straight into `/tickets/board`, seeded with the PRD's Jordan Rivera end-to-end scenario plus a handful of other candidates so every stage/SLA state has something in it.

`npm run build` runs `tsc -b && vite build`. `npm run lint` runs oxlint.

## What's real vs. stubbed

This is a frontend-only build — there's no server. **Everything is real UI and business logic** (stage engine, auto-assignment, SLA countdowns and escalation, agent-draft approval flow, hard/soft gates on the New Hire Tracker, weekly digest generation) running against an in-memory Zustand store persisted to `localStorage`, standing in for the PRD's Supabase backend. Swapping in real Supabase tables/Realtime later is a matter of replacing `src/store/useStore.ts`'s persistence layer — the actions and their side effects are already the shape a backend would need.

Explicitly stubbed (no external credentials in this environment):

- **Claude API** (`src/lib/agent.ts`) — generates the same draft content shape (subject/body/recipients/cc) that a real `POST /v1/messages` call would return, using the PRD's system prompt as a comment for reference. Swap `generateDraftContent` for a real fetch once a backend + API key exist.
- **Google/Outlook Calendar, Webex, HackerRank, e-signature, Checkr, Resend/SMTP** — represented as inert config in Settings → Integrations, and as placeholder links/labels in agent drafts (e.g. a fake Webex URL is generated so the UI has something to show).
- Steps that depend on an external reply (candidate replying to an email, candidate picking a self-schedule slot, candidate completing a HackerRank assessment) are exposed as explicit "Simulate: …" buttons in the ticket drawer, since there's no real inbox to parse.
- **Slack bot** — see the "Chat assistant / Slack bot" section below. The request→draft pipeline is fully real and testable in-app; the actual Slack webhook server lives in `server/` and is untested (no Slack app credentials or shared database were available here).

## Where things live

- `src/types` — the PRD's data model (`Candidate`, `AgentDraft`, `NewHireTracker`, etc).
- `src/lib/stageEngine.ts` — the stage → auto-assign/SLA/agent-trigger table from PRD §7.
- `src/lib/agent.ts` — mock draft generator (PRD §19).
- `src/lib/botIntent.ts` — natural-language request parser for the chat assistant / Slack bot.
- `src/store/useStore.ts` — single source of truth: candidates, agent drafts, new-hire trackers, notifications, chat messages, and every action that moves the system forward (stage moves, draft approve/decline, scorecards, BGC/DT, tech setup, digest inputs).
- `src/pages` — one file per route in the PRD's IA (`/tickets/*`, `/new-hires*`, `/scheduling/*`, `/reports`, `/settings`).
- `src/components` — sidebar, command palette, kanban board/cards, ticket drawer, scheduling approval cards, new-hire checklist, assistant chat panel.
- `server/` — standalone Node backend for the real Slack app (separate `package.json`, not part of the Vite build). See `server/README.md`.
- `mock-ats/` — standalone mock ATS API + synthetic candidate data + candidate simulator agent (separate `package.json`). See `mock-ats/README.md`.

## Chat assistant / Slack bot

The bottom-right chat bubble opens an assistant that parses plain-English requests — "schedule
an interview with Jordan Rivera," "self-schedule a call with Taylor Kim," "nudge the interviewer
on Jordan Rivera," "what's the status of Casey Liu?" — and, for actionable requests, creates the
exact same `AgentDraft` the UI would if you'd clicked through it by hand (`requestScheduling` /
`createAgentDraft` in the store). The draft lands in My Queue → Approvals like anything else —
**the bot never sends anything to a candidate on its own**, matching the PRD's "agent never
sends without human approval" rule. Status questions are read-only lookups.

This panel is explicitly framed as "a preview of the Slack bot": the parsing logic
(`src/lib/botIntent.ts`) and the dispatch logic (`sendChatMessage` in `src/store/useStore.ts`)
are the same code a real Slack integration needs — only the transport differs (an in-app text
box vs. a Slack DM). `server/` has a from-scratch Express backend that receives Slack's Events
API webhooks, verifies Slack's request signature, and reuses a ported copy of the same intent
parser. It compiles and its signature verification/health-check endpoints were smoke-tested, but
it has **not** been connected to a live Slack workspace (no app credentials available in this
environment) and its candidate store is an in-memory placeholder rather than the app's real
data — see `server/README.md` for exactly what's left to wire up before it's production-ready.

## Mock ATS + synthetic data + candidate simulator

`mock-ats/` is a separate, fully standalone service (own `package.json`, not wired into this
frontend or its GitHub Pages deploy) built for a different purpose than the demo above: stress-
testing recruiting coordination logic against something that behaves like a real ATS and real,
occasionally messy candidates.

- **150 synthetic candidates** generated with `@faker-js/faker` (names, emails, phones, resume
  blurbs) — safe to use as a sales-demo dataset since none of it is real. Regenerate any time with
  `npm run generate:candidates`.
- **A mock ATS REST API** (`/v1/candidates`, `/v1/jobs`, `/v1/applications`, `/v1/webhooks`, …)
  shaped after Greenhouse's Harvest API conventions, so pointing real code at a real ATS later is
  a base-URL-and-auth swap. Includes working webhook delivery with a failure/delivery log, not
  just fire-and-forget.
- **A candidate simulator agent** with per-candidate personas (consistently flaky vs. consistently
  prompt) that accepts, counter-proposes, or ghosts scheduling messages — either persistently via
  webhook (`npm run simulate:watch`) or invoked directly by the lifecycle script below.
- **A full-lifecycle script** (`npm run simulate:lifecycle`) that drives one candidate through
  apply → recruiter screen → assessment → 3 interview rounds (each independently negotiated
  against the simulator, including realistic ghosting/rescheduling) → debrief → offer →
  onboarding (BGC, drug test, tech setup) → day one, logging every transition to the console and
  to a JSON file — then runs 8 more candidates through just the scheduling exchange and prints an
  accept/reschedule/ghost breakdown.
- **Sandboxed email + calendar** — no real Mailtrap/Resend/Google Calendar/Nylas credentials were
  available in this environment, so these default to a capture-only outbox and deterministic
  synthetic free/busy data, with the real swap-in points documented inline in
  `mock-ats/src/integrations/`.

See `mock-ats/README.md` for the full endpoint reference and setup.

## Try the end-to-end scenario

Jordan Rivera is seeded at "Pending Feedback" (Round 1 already interviewed). From there: submit the scorecard → HM advances to offer → approve the agent's offer letter draft in Scheduling → Approvals → HM approves offer terms → approve the e-sign send → simulate the candidate signing → Jordan graduates to New Hire Tracker with 4 sub-tickets → initiate BGC/DT, resolve results, progress Tech Setup → Jordan hits Ready to Start → check Settings → Digest Preview to see it reflected in Jamie's weekly email.

Settings → Danger Zone has a "Reset Demo Data" button to restore the seeded scenario at any point.
