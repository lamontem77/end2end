import { Router } from 'express'
import { db, nextId } from '../db.js'
import type { WebhookEvent } from '../types.js'

export const webhooksRouter = Router()

const VALID_EVENTS: WebhookEvent[] = [
  'candidate.created',
  'application.created',
  'application.stage_change',
  'application.rejected',
  'application.hired',
  'application.message_created',
  'scorecard.submitted',
]

webhooksRouter.get('/', (_req, res) => {
  res.json({ webhooks: db.webhooks })
})

webhooksRouter.post('/', (req, res) => {
  const { url, events, secret } = req.body ?? {}
  if (!url || !Array.isArray(events) || events.length === 0) {
    return res.status(422).json({ error: 'url and a non-empty events[] are required' })
  }
  const invalid = events.filter((e: string) => !VALID_EVENTS.includes(e as WebhookEvent))
  if (invalid.length) return res.status(422).json({ error: `unknown event(s): ${invalid.join(', ')}`, valid_events: VALID_EVENTS })

  const webhook = { id: nextId('wh'), url, events, secret, created_at: new Date().toISOString() }
  db.webhooks.push(webhook)
  res.status(201).json(webhook)
})

webhooksRouter.delete('/:id', (req, res) => {
  const idx = db.webhooks.findIndex((w) => w.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'webhook not found' })
  db.webhooks.splice(idx, 1)
  res.status(204).send()
})

webhooksRouter.get('/:id/deliveries', (req, res) => {
  const deliveries = db.webhookDeliveries.filter((d) => d.webhook_id === req.params.id)
  res.json({ deliveries, total: deliveries.length })
})
