import { db, nextId } from './db.js'
import type { WebhookEvent } from './types.js'

const DELIVERY_TIMEOUT_MS = 3000

// Mimics how a real ATS delivers webhooks: best-effort POST with a short
// timeout, and every attempt (success or failure) is logged rather than
// silently dropped, since real webhook consumers need to see failures to
// debug them. Fire-and-forget from the caller's perspective — callers don't
// await delivery, only that the event was queued.
export function fireWebhookEvent(event: WebhookEvent, payload: unknown): void {
  const subscribers = db.webhooks.filter((w) => w.events.includes(event))
  for (const webhook of subscribers) {
    deliver(webhook.id, webhook.url, event, payload)
  }
}

async function deliver(webhookId: string, url: string, event: WebhookEvent, payload: unknown) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload, sent_at: new Date().toISOString() }),
      signal: controller.signal,
    })
    db.webhookDeliveries.push({
      id: nextId('whd'),
      webhook_id: webhookId,
      event,
      payload,
      attempted_at: new Date().toISOString(),
      ok: res.ok,
      status: res.status,
    })
  } catch (err) {
    db.webhookDeliveries.push({
      id: nextId('whd'),
      webhook_id: webhookId,
      event,
      payload,
      attempted_at: new Date().toISOString(),
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  } finally {
    clearTimeout(timeout)
  }
}
