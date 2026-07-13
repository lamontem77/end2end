import crypto from 'node:crypto'
import type { Request } from 'express'

const MAX_CLOCK_SKEW_SECONDS = 60 * 5

// Verifies the request actually came from Slack. Requires `req.rawBody` to
// have been captured by the express.json() verify hook in index.ts — Slack
// signs the exact raw bytes, so a re-serialized JSON body will not match.
export function verifySlackSignature(req: Request, signingSecret: string): boolean {
  const timestamp = req.header('X-Slack-Request-Timestamp')
  const signature = req.header('X-Slack-Signature')
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody
  if (!timestamp || !signature || !rawBody) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (Number.isNaN(age) || age > MAX_CLOCK_SKEW_SECONDS) return false

  const base = `v0:${timestamp}:${rawBody.toString('utf8')}`
  const expected = `v0=${crypto.createHmac('sha256', signingSecret).update(base).digest('hex')}`

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Posts a reply into the channel/DM the triggering event came from.
export async function postSlackMessage(botToken: string, channel: string, text: string, threadTs?: string) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel, text, thread_ts: threadTs }),
  })
  const data = (await res.json()) as { ok: boolean; error?: string }
  if (!data.ok) {
    console.error('[slack] chat.postMessage failed:', data.error)
  }
}
