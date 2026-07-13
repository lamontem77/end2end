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

## Where things live

- `src/types` — the PRD's data model (`Candidate`, `AgentDraft`, `NewHireTracker`, etc).
- `src/lib/stageEngine.ts` — the stage → auto-assign/SLA/agent-trigger table from PRD §7.
- `src/lib/agent.ts` — mock draft generator (PRD §19).
- `src/store/useStore.ts` — single source of truth: candidates, agent drafts, new-hire trackers, notifications, and every action that moves the system forward (stage moves, draft approve/decline, scorecards, BGC/DT, tech setup, digest inputs).
- `src/pages` — one file per route in the PRD's IA (`/tickets/*`, `/new-hires*`, `/scheduling/*`, `/reports`, `/settings`).
- `src/components` — sidebar, command palette, kanban board/cards, ticket drawer, scheduling approval cards, new-hire checklist.

## Try the end-to-end scenario

Jordan Rivera is seeded at "Pending Feedback" (Round 1 already interviewed). From there: submit the scorecard → HM advances to offer → approve the agent's offer letter draft in Scheduling → Approvals → HM approves offer terms → approve the e-sign send → simulate the candidate signing → Jordan graduates to New Hire Tracker with 4 sub-tickets → initiate BGC/DT, resolve results, progress Tech Setup → Jordan hits Ready to Start → check Settings → Digest Preview to see it reflected in Jamie's weekly email.

Settings → Danger Zone has a "Reset Demo Data" button to restore the seeded scenario at any point.
