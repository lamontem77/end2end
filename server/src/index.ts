import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cron from 'node-cron'
import { verifySlackSignature, postSlackMessage } from './slack.js'
import { handleMessage } from './intent.js'
import { demoStore } from './demoStore.js'
import { BreezyClient } from './breezy.js'
import { runSync, getAllCandidates, getCandidate, advanceCandidateStage, getSyncState } from './syncEngine.js'
import {
  getAuthUrl,
  handleOAuthCallback,
  getGoogleStatus,
  revokeGoogle,
  sendGmail,
  getFreeBusy,
  bookCalendarEvent,
  type EmailPayload,
  type BookEventRequest,
} from './google.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001
const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const BOT_USER_ID = process.env.SLACK_BOT_USER_ID
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

// ─── Breezy client (singleton, lazy-initialized) ──────────────────────────────

let breezyClient: BreezyClient | null = null

function getBreezyClient(): BreezyClient | null {
  if (breezyClient) return breezyClient
  const email = process.env.BREEZY_EMAIL
  const password = process.env.BREEZY_PASSWORD
  const companyId = process.env.BREEZY_COMPANY_ID
  if (!email || !password) return null
  breezyClient = new BreezyClient(email, password, companyId)
  return breezyClient
}

// ─── Express setup ────────────────────────────────────────────────────────────

const app = express()

app.use(
  express.json({
    verify: (req, _res, buf) => {
      ;(req as Request & { rawBody?: Buffer }).rawBody = buf
    },
  }),
)

// CORS — allow the frontend origin
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (_req.method === 'OPTIONS') { res.status(204).end(); return }
  next()
})

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/healthz', (_req, res) => res.json({ ok: true }))

// ─── Breezy routes ────────────────────────────────────────────────────────────

/** POST /api/breezy/connect — save credentials and test connection */
app.post('/api/breezy/connect', async (req: Request, res: Response) => {
  const { email, password, companyId } = req.body as {
    email?: string
    password?: string
    companyId?: string
  }
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' }); return
  }
  try {
    const client = new BreezyClient(email, password, companyId)
    const companyName = await client.testConnection()
    // Persist as the active client
    breezyClient = client
    process.env.BREEZY_EMAIL = email
    process.env.BREEZY_PASSWORD = password
    if (companyId) process.env.BREEZY_COMPANY_ID = companyId
    res.json({ ok: true, companyName })
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

/** GET /api/breezy/status — connection + sync status */
app.get('/api/breezy/status', (_req, res) => {
  const client = getBreezyClient()
  res.json({
    connected: client !== null,
    sync: getSyncState(),
  })
})

/** POST /api/breezy/sync — trigger immediate sync */
app.post('/api/breezy/sync', async (_req, res) => {
  const client = getBreezyClient()
  if (!client) { res.status(400).json({ error: 'Breezy not connected' }); return }
  try {
    await runSync(client)
    res.json({ ok: true, sync: getSyncState() })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

/** GET /api/breezy/stages — list Breezy stages (for mapping UI) */
app.get('/api/breezy/stages', async (_req, res) => {
  const client = getBreezyClient()
  if (!client) { res.status(400).json({ error: 'Breezy not connected' }); return }
  try {
    const stages = await client.getStages()
    res.json(stages)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

/** GET /api/candidates — all synced candidates */
app.get('/api/candidates', (_req, res) => {
  res.json(getAllCandidates())
})

/** GET /api/candidates/:id — single synced candidate */
app.get('/api/candidates/:id', (req, res) => {
  const c = getCandidate(req.params.id)
  if (!c) { res.status(404).json({ error: 'Not found' }); return }
  res.json(c)
})

/** POST /api/candidates/:id/advance — advance stage in our system + push to Breezy */
app.post('/api/candidates/:id/advance', async (req: Request, res: Response) => {
  const client = getBreezyClient()
  if (!client) { res.status(400).json({ error: 'Breezy not connected' }); return }
  const { targetStage, breezyStage, note } = req.body as {
    targetStage: string
    breezyStage: { id: string; name: string }
    note?: string
  }
  try {
    const updated = await advanceCandidateStage(
      client,
      req.params.id,
      targetStage as Parameters<typeof advanceCandidateStage>[2],
      breezyStage,
      note,
    )
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

/** POST /api/candidates/:id/note — add a note to a candidate in Breezy */
app.post('/api/candidates/:id/note', async (req: Request, res: Response) => {
  const client = getBreezyClient()
  if (!client) { res.status(400).json({ error: 'Breezy not connected' }); return }
  const c = getCandidate(req.params.id)
  if (!c) { res.status(404).json({ error: 'Not found' }); return }
  const { content } = req.body as { content: string }
  try {
    await client.addNote(c.breezyPositionId, c.breezyId, content)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

// ─── Google OAuth routes ───────────────────────────────────────────────────────

/** GET /api/google/oauth/start — redirect to Google consent screen */
app.get('/api/google/oauth/start', (_req, res) => {
  try {
    const url = getAuthUrl()
    res.redirect(url)
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : 'Google OAuth not configured')
  }
})

/** GET /api/google/oauth/callback — exchange code for tokens */
app.get('/api/google/oauth/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined
  if (!code) { res.status(400).send('Missing code'); return }
  try {
    const email = await handleOAuthCallback(code)
    // Redirect back to the frontend settings page
    res.redirect(`${FRONTEND_URL}/settings?google=connected&email=${encodeURIComponent(email)}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.redirect(`${FRONTEND_URL}/settings?google=error&message=${encodeURIComponent(msg)}`)
  }
})

/** GET /api/google/status */
app.get('/api/google/status', (_req, res) => {
  res.json(getGoogleStatus())
})

/** POST /api/google/revoke */
app.post('/api/google/revoke', (_req, res) => {
  revokeGoogle()
  res.json({ ok: true })
})

// ─── Email routes ─────────────────────────────────────────────────────────────

/** POST /api/email/send — send an email via Gmail (called when RC approves a draft) */
app.post('/api/email/send', async (req: Request, res: Response) => {
  const payload = req.body as EmailPayload
  if (!payload.to?.length || !payload.subject) {
    res.status(400).json({ error: 'to and subject are required' }); return
  }
  try {
    const messageId = await sendGmail(payload)
    res.json({ ok: true, messageId })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

// ─── Calendar routes ───────────────────────────────────────────────────────────

/** POST /api/calendar/freebusy — check availability for a list of emails */
app.post('/api/calendar/freebusy', async (req: Request, res: Response) => {
  const { emails, timeMin, timeMax } = req.body as {
    emails: string[]
    timeMin: string
    timeMax: string
  }
  if (!emails?.length || !timeMin || !timeMax) {
    res.status(400).json({ error: 'emails, timeMin, and timeMax are required' }); return
  }
  try {
    const busy = await getFreeBusy({ emails, timeMin, timeMax })
    res.json(busy)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

/** POST /api/calendar/book — create a calendar event and send invites */
app.post('/api/calendar/book', async (req: Request, res: Response) => {
  const payload = req.body as BookEventRequest
  if (!payload.summary || !payload.startIso || !payload.endIso || !payload.attendeeEmails?.length) {
    res.status(400).json({ error: 'summary, startIso, endIso, and attendeeEmails are required' }); return
  }
  try {
    const event = await bookCalendarEvent(payload)
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

// ─── Slack routes (unchanged) ─────────────────────────────────────────────────

app.post('/slack/events', async (req, res) => {
  if (req.body.type === 'url_verification') {
    res.json({ challenge: req.body.challenge }); return
  }
  if (!SIGNING_SECRET || !verifySlackSignature(req, SIGNING_SECRET)) {
    res.status(401).send('invalid signature'); return
  }
  res.status(200).send('ok')
  const event = req.body.event
  if (!event || event.bot_id) return
  const isDirectMessage = event.type === 'message' && event.channel_type === 'im'
  const isMention = event.type === 'app_mention'
  if (!isDirectMessage && !isMention) return
  const text: string = BOT_USER_ID
    ? event.text.replace(`<@${BOT_USER_ID}>`, '').trim()
    : event.text
  try {
    const reply = await handleMessage(text, demoStore)
    if (BOT_TOKEN) await postSlackMessage(BOT_TOKEN, event.channel, reply, event.thread_ts)
    else console.log(`[dry-run reply to ${event.channel}]`, reply)
  } catch (err) {
    console.error('[slack/events] failed to handle message:', err)
    if (BOT_TOKEN) {
      await postSlackMessage(BOT_TOKEN, event.channel, 'Sorry, something went wrong handling that request.', event.thread_ts)
    }
  }
})

// ─── Startup + periodic sync ──────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`RecruiterOS server listening on :${PORT}`)
  console.log(`  CORS allowed origin: ${FRONTEND_URL}`)

  const client = getBreezyClient()
  if (client) {
    console.log('[breezy] credentials found — running initial sync...')
    await runSync(client)
    // Sync every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('[breezy] scheduled sync...')
      await runSync(client)
    })
  } else {
    console.log('[breezy] no credentials set — running in demo mode (Breezy not connected)')
    console.log('  Set BREEZY_EMAIL and BREEZY_PASSWORD in server/.env to enable')
  }
})
