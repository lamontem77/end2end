# mock-ats

A standalone mock ATS backend, seeded with 150 synthetic (Faker-generated) candidates, plus a
candidate simulator agent that plays the candidate side of scheduling conversations. Built to
stress-test recruiting coordination logic (like the RecruiterOS frontend one level up in this
repo) against something that behaves like a real ATS + real, occasionally-flaky humans — without
ever touching real candidate data.

This is a separate Node project from the root frontend and from `server/` (the Slack bot
scaffold) — it doesn't share a build or get deployed with either. Nothing here is wired into the
deployed GitHub Pages demo, which is static and has no backend to talk to.

## Why this exists

1. **Synthetic data** you can safely use as a sales/demo dataset without ever risking real
   candidates' PII.
2. **A realistic API shape** (`/v1/candidates`, `/v1/jobs`, `/v1/applications`, `/v1/webhooks`,
   modeled on Greenhouse's Harvest API) so that whatever you build against this can plausibly be
   pointed at a real ATS later — that's a base-URL-and-auth-header swap, not a redesign.
3. **A candidate simulator agent** that replies to outreach the way real candidates do: mostly
   cooperative, sometimes negotiating for a different time, sometimes not replying at all. Real
   scheduling logic needs to survive that; a fixture that always says "yes, Tuesday 2pm works" never
   tests it.

## Quick start

```bash
npm install
npm run generate:candidates   # writes src/data/*.json — 150 candidates, 8 jobs, seeded
                               # applications/messages/scorecards (re-run any time to reshuffle)
npm run dev                   # mock ATS API on :4000 (see .env.example for the API key)
```

In a second terminal, run the full one-candidate walkthrough:

```bash
npm run simulate:lifecycle
```

This drives a candidate named Jordan Rivera through apply → recruiter screen → assessment →
3 interview rounds (each with a real scheduling negotiation against the candidate simulator,
including at least one realistic ghost/reschedule) → debrief → offer → onboarding (background
check, drug test, tech setup) → day one — logging every step to the console and to
`logs/lifecycle-<timestamp>.json` (both the script's own narration and the ATS's own
`stage_history`/activity audit trail). It then runs 8 more candidates through just the scheduling
exchange and prints an aggregate accept/reschedule/ghost breakdown.

To run the candidate simulator persistently instead (so it reacts to scheduling messages your
own code posts through the API, live):

```bash
npm run simulate:watch
```

It registers itself as a webhook subscriber and replies to any `availability_request` /
`self_schedule_link` message from a `coordinator`/`recruiter` after a simulated delay, using the
same persona logic as the lifecycle script.

## API shape

Base URL `http://localhost:4000`. Every request except `/healthz` requires
`Authorization: Bearer <MOCK_ATS_API_KEY>` (default `dev-key`, see `.env.example`).

| Endpoint | Notes |
|---|---|
| `GET /v1/candidates` | `?q=`, `?page=`, `?per_page=` |
| `POST /v1/candidates` | create |
| `GET /v1/jobs` | requisitions |
| `GET /v1/jobs/:id/stages` | the 14-stage pipeline (shared by every job in this mock) |
| `POST /v1/applications` | `{candidate_id, job_id}` → starts at "Applied" |
| `PATCH /v1/applications/:id/stage` | `{stage, actor}` — moves the pipeline, appends to `stage_history`, fires `application.stage_change` (and `application.hired` at Offer Accepted) |
| `POST /v1/applications/:id/reject` | |
| `GET/POST /v1/applications/:id/messages` | the scheduling/candidate-facing message thread — this is what the simulator reads and replies to |
| `GET/POST /v1/applications/:id/scorecards` | interview feedback |
| `GET /v1/applications/:id/activity` | merged chronological audit trail (stage changes + messages + scorecards) |
| `POST /v1/applications/:id/onboarding` | creates the BGC/drug-test/tech-setup checklist (call after Offer Accepted) |
| `PATCH /v1/applications/:id/onboarding/:item` | `item` is `background_check`\|`drug_test`\|`tech_setup`\|`offer_letter`; auto-computes `ready_to_start` once both hard gates are clear and tech setup is complete |
| `GET/POST /v1/webhooks` | subscribe a URL to any of the events below |
| `GET /v1/webhooks/:id/deliveries` | delivery attempt log (status/ok/error) — real webhooks fail sometimes; this doesn't pretend otherwise |
| `GET /v1/calendar/freebusy?user_id=&days=` | deterministic synthetic busy blocks |
| `POST /v1/calendar/events` | synthetic event + fake join link |
| `GET /v1/_debug/outbox` | every email the sandboxed email integration "sent" |

Webhook events: `candidate.created`, `application.created`, `application.stage_change`,
`application.rejected`, `application.hired`, `application.message_created`,
`scorecard.submitted`, `onboarding.updated`, `onboarding.ready_to_start`.

## What's real vs. stubbed

- **Faker data generation, the REST API, stage/application/message/scorecard/onboarding state,
  webhook delivery (including failure logging)** — all real, all working, no external
  dependencies.
- **Email** (`src/integrations/email.ts`) — defaults to a capture-only console/in-memory outbox
  (inspect via `GET /v1/_debug/outbox`). Two real swap-ins are documented inline and left
  inert: Mailtrap's sandbox SMTP (recommended — it's built for exactly this, mail is captured,
  never delivered) or Resend with a restricted/test sender. No credentials for either were
  available in this environment.
- **Calendar** (`src/integrations/calendar.ts`) — defaults to deterministic synthetic free/busy
  data (same user + day always yields the same busy blocks). Real swap-ins documented inline:
  Google Calendar API against a dedicated throwaway test Workspace account, or a Nylas sandbox
  account (nylas.com offers one free, specifically for this). No credentials available here
  either.
- **Candidate simulator persona** — genuinely randomized per-run behavior (ghost/accept/
  reschedule), but persona *traits* (how likely a given candidate is to ghost) are deterministic
  per candidate ID, so the same candidate is consistently flaky or consistently prompt across a
  run — closer to how real people actually behave than pure randomness would be.

## Files

```
src/
  types.ts                    Greenhouse-shaped resource types + the stage pipeline
  db.ts                       in-memory store, loaded from src/data/*.json on boot
  webhooks.ts                 fire-and-log delivery to subscriber URLs
  fixtures/generateCandidates.ts   Faker generator — never run against real data
  data/*.json                 generated fixtures (candidates, jobs, applications, messages, scorecards, users)
  integrations/email.ts       sandboxed email (see above)
  integrations/calendar.ts    sandboxed calendar (see above)
  routes/                     candidates, jobs, applications, webhooks, calendar, onboarding
  server.ts                   Express app entry point
simulator/
  persona.ts                  per-candidate behavior traits + the accept/reschedule/ghost decision
  atsClient.ts                 fetch wrapper other scripts use to talk to the API
  watch.ts                    persistent candidate-agent service (webhook-driven)
  runLifecycle.ts             the full one-candidate walkthrough + scheduling stress test
```
