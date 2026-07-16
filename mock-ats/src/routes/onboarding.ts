import { Router } from 'express'
import { db } from '../db.js'
import { fireWebhookEvent } from '../webhooks.js'
import type { OnboardingItemKey } from '../types.js'

export const onboardingRouter = Router()

function checkReadyToStart(applicationId: string) {
  const checklist = db.onboarding[applicationId]
  if (!checklist || checklist.ready_to_start) return
  const hardGatesClear = checklist.background_check.status === 'clear' && checklist.drug_test.status === 'clear'
  const allDone = checklist.offer_letter.status === 'complete' && hardGatesClear && checklist.tech_setup.status === 'complete'
  if (allDone) {
    checklist.ready_to_start = true
    fireWebhookEvent('onboarding.ready_to_start', checklist)
  }
}

// POST /v1/applications/:id/onboarding — creates the checklist. In a real
// flow this fires automatically when an application reaches "Offer
// Accepted" (see applications.ts's stage-transition handler).
onboardingRouter.post('/:id/onboarding', (req, res) => {
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'application not found' })
  if (db.onboarding[application.id]) return res.json(db.onboarding[application.id])

  const now = new Date().toISOString()
  const startDate = req.body?.start_date ?? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  const checklist = {
    application_id: application.id,
    start_date: startDate,
    offer_letter: { status: 'complete' as const, updated_at: now },
    background_check: { status: 'not_started' as const, updated_at: now },
    drug_test: { status: 'not_started' as const, updated_at: now },
    tech_setup: { status: 'not_started' as const, updated_at: now },
    ready_to_start: false,
  }
  db.onboarding[application.id] = checklist
  res.status(201).json(checklist)
})

onboardingRouter.get('/:id/onboarding', (req, res) => {
  const checklist = db.onboarding[req.params.id]
  if (!checklist) return res.status(404).json({ error: 'no onboarding checklist for this application' })
  res.json(checklist)
})

const VALID_ITEMS: OnboardingItemKey[] = ['offer_letter', 'background_check', 'drug_test', 'tech_setup']

onboardingRouter.patch('/:id/onboarding/:item', (req, res) => {
  const checklist = db.onboarding[req.params.id]
  if (!checklist) return res.status(404).json({ error: 'no onboarding checklist for this application' })
  const item = req.params.item as OnboardingItemKey
  if (!VALID_ITEMS.includes(item)) return res.status(422).json({ error: `item must be one of: ${VALID_ITEMS.join(', ')}` })
  const { status } = req.body ?? {}
  if (!status) return res.status(422).json({ error: 'status is required' })

  checklist[item] = { status, updated_at: new Date().toISOString() }
  fireWebhookEvent('onboarding.updated', checklist)
  checkReadyToStart(checklist.application_id)
  res.json(checklist)
})
