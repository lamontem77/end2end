# RecruiterOS Slack bot (scaffold — untested)

This is the backend for a real Slack integration: a recruiter DMs the bot (or @-mentions it in
a channel) with something like "schedule an interview with Jordan Rivera," and it drafts the
same availability-request email the web app's Approvals Queue would show, so the RC just has to
approve it — no manual form-filling.

**This has not been run against a real Slack workspace in this environment** — there were no
Slack app credentials or hosting available. It's a correct, complete skeleton (signature
verification, event handling, reply posting) but treat it as a first draft to test against your
own Slack app before relying on it.

## The one thing to fix before this is "real"

`src/demoStore.ts` is an in-memory stand-in with two hardcoded candidates. It does **not** talk
to the web app's data (which currently lives in the browser's `localStorage` via Zustand — see
the root README). Wiring a Slack request to actually show up in a recruiter's My Queue requires:

1. Moving the web app's data to a real shared database (the original PRD specifies Supabase —
   see `TECH STACK` in the PRD). This is the same migration the frontend README flags as the
   path to production.
2. Implementing `CandidateStore` (`src/types.ts`) against that database instead of
   `demoStore.ts` — `listCandidates`, `requestScheduling`, `requestAssessmentSend`, and
   `nudgeInterviewer` should do exactly what the equivalent Zustand actions
   (`src/store/useStore.ts` in the root project — `requestScheduling`, `createAgentDraft`) do:
   create a pending `AgentDraft` row for a human to approve. Never send anything to a candidate
   directly from here.

Until that's done, this server is a working demonstration of the Slack plumbing, not a
connected feature.

## Setting up the Slack app

1. Go to https://api.slack.com/apps → **Create New App** → From scratch. Pick your workspace.
2. **OAuth & Permissions** → add Bot Token Scopes:
   - `chat:write` (send replies)
   - `app_mentions:read` (see @-mentions)
   - `im:history`, `im:read`, `im:write` (DM the bot directly)
3. **Install to Workspace**, then copy the **Bot User OAuth Token** (`xoxb-...`) into
   `SLACK_BOT_TOKEN`.
4. **Basic Information** → copy the **Signing Secret** into `SLACK_SIGNING_SECRET`.
5. **Event Subscriptions** → turn on, set Request URL to
   `https://<your-host>/slack/events` (see below for exposing this locally). Subscribe to bot
   events: `app_mention`, `message.im`.
6. **App Home** → enable the Messages Tab so users can DM the bot directly.
7. (Optional) Run `curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" https://slack.com/api/auth.test`
   to get the bot's user ID for `SLACK_BOT_USER_ID`.

## Running it

```bash
cp .env.example .env   # fill in the three Slack values
npm install
npm run dev
```

Slack's Request URL has to be a public HTTPS URL that reaches your machine. For local dev:

```bash
ngrok http 3000
```

then paste the `https://…ngrok…` URL (with `/slack/events` appended) into the Event
Subscriptions Request URL field above — Slack will immediately send a `url_verification`
challenge, which `src/index.ts` answers automatically.

## Files

- `src/index.ts` — the Express app: signature verification, event routing, reply posting.
- `src/slack.ts` — Slack request signing verification + `chat.postMessage` helper.
- `src/intent.ts` — the same natural-language parser as the in-app assistant
  (`../src/lib/botIntent.ts` in the web app), ported here since this is a separate Node project.
  Keep them in sync by hand, or extract both into a shared package once this is real.
- `src/types.ts` — the `CandidateStore` contract a real backend must implement.
- `src/demoStore.ts` — the in-memory placeholder described above.
