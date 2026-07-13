import 'dotenv/config'
import express, { type Request } from 'express'
import { verifySlackSignature, postSlackMessage } from './slack.js'
import { handleMessage } from './intent.js'
import { demoStore } from './demoStore.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const BOT_USER_ID = process.env.SLACK_BOT_USER_ID // used to strip the @mention out of app_mention text

if (!SIGNING_SECRET || !BOT_TOKEN) {
  console.warn(
    '[startup] SLACK_SIGNING_SECRET and/or SLACK_BOT_TOKEN are not set. ' +
      'The server will run, but every Slack request will fail signature verification ' +
      'and no replies can be sent. See server/README.md.',
  )
}

const app = express()

// Slack signs the raw request body, so we have to capture it before
// express.json() parses (and thereby normalizes/re-serializes) it.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      ;(req as Request & { rawBody?: Buffer }).rawBody = buf
    },
  }),
)

app.post('/slack/events', async (req, res) => {
  // 1. URL verification handshake — Slack calls this once when you first
  //    set the Request URL in your app config.
  if (req.body.type === 'url_verification') {
    res.json({ challenge: req.body.challenge })
    return
  }

  // 2. Verify the request actually came from Slack before doing anything else.
  if (!SIGNING_SECRET || !verifySlackSignature(req, SIGNING_SECRET)) {
    res.status(401).send('invalid signature')
    return
  }

  // Acknowledge immediately — Slack retries if you take longer than 3s.
  res.status(200).send('ok')

  const event = req.body.event
  if (!event || event.bot_id) return // ignore our own messages

  const isDirectMessage = event.type === 'message' && event.channel_type === 'im'
  const isMention = event.type === 'app_mention'
  if (!isDirectMessage && !isMention) return

  const text: string = BOT_USER_ID ? event.text.replace(`<@${BOT_USER_ID}>`, '').trim() : event.text

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

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`RecruiterOS Slack bot listening on :${PORT}`)
})
