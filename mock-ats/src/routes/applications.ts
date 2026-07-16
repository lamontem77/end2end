import { Router } from 'express'
import { db, nextId } from '../db.js'
import { fireWebhookEvent } from '../webhooks.js'
import { STAGE_PIPELINE, type StageName } from '../types.js'
import { sendEmail } from '../integrations/email.js'

export const applicationsRouter = Router()

applicationsRouter.get('/', (req, res) => {
  const { candidate_id, job_id, status, stage } = req.query
  let results = db.applications
  if (candidate_id) results = results.filter((a) => a.candidate_id === candidate_id)
  if (job_id) results = results.filter((a) => a.job_id === job_id)
  if (status) results = results.filter((a) => a.status === status)
  if (stage) results = results.filter((a) => a.current_stage === stage)
  res.json({ applications: results, total: results.length })
})

applicationsRouter.get('/:id', (req, res) => {
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'application not found' })
  res.json(application)
})

// POST /v1/applications — a candidate applies to a job. Starts at "Applied".
applicationsRouter.post('/', (req, res) => {
  const { candidate_id, job_id } = req.body ?? {}
  const candidate = db.candidates.find((c) => c.id === candidate_id)
  const job = db.jobs.find((j) => j.id === job_id)
  if (!candidate || !job) return res.status(422).json({ error: 'candidate_id and job_id must reference existing records' })

  const now = new Date().toISOString()
  const application = {
    id: nextId('app'),
    candidate_id,
    job_id,
    status: 'active' as const,
    current_stage: 'Applied' as StageName,
    stage_history: [{ stage: 'Applied' as StageName, entered_at: now, actor: 'System' }],
    applied_at: now,
  }
  db.applications.push(application)
  fireWebhookEvent('application.created', application)
  res.status(201).json(application)
})

// PATCH /v1/applications/:id/stage — { stage } moves the application.
// Mirrors the frontend's stage engine: every move is appended to
// stage_history and fires a webhook, exactly like a real ATS would notify
// downstream systems of a pipeline change.
applicationsRouter.patch('/:id/stage', (req, res) => {
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'application not found' })
  const { stage, actor } = req.body ?? {}
  if (!STAGE_PIPELINE.includes(stage)) {
    return res.status(422).json({ error: `stage must be one of: ${STAGE_PIPELINE.join(', ')}` })
  }

  application.current_stage = stage
  application.stage_history.push({ stage, entered_at: new Date().toISOString(), actor: actor ?? 'System' })
  if (stage === 'Offer Accepted') {
    application.status = 'hired'
    application.hired_at = new Date().toISOString()
    fireWebhookEvent('application.hired', application)
  }
  fireWebhookEvent('application.stage_change', application)
  res.json(application)
})

applicationsRouter.post('/:id/reject', (req, res) => {
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'application not found' })
  application.status = 'rejected'
  application.rejected_at = new Date().toISOString()
  application.rejected_reason = req.body?.reason ?? 'Not specified'
  fireWebhookEvent('application.rejected', application)
  res.json(application)
})

// --- message thread (scheduling emails, candidate replies) ---

applicationsRouter.get('/:id/messages', (req, res) => {
  const messages = db.messages.filter((m) => m.application_id === req.params.id)
  res.json({ messages, total: messages.length })
})

applicationsRouter.post('/:id/messages', (req, res) => {
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'application not found' })
  const { from, type, text, proposed_slots, chosen_slot } = req.body ?? {}
  if (!from || !type || !text) return res.status(422).json({ error: 'from, type, and text are required' })

  const message = {
    id: nextId('msg'),
    application_id: application.id,
    from,
    type,
    text,
    proposed_slots,
    chosen_slot,
    created_at: new Date().toISOString(),
  }
  db.messages.push(message)
  fireWebhookEvent('application.message_created', message)

  // Coordinator/recruiter messages are candidate-facing emails in a real
  // ATS — route them through the sandboxed email integration so there's a
  // realistic outbox to inspect, same as a real send would produce.
  if (from === 'coordinator' || from === 'recruiter') {
    const candidate = db.candidates.find((c) => c.id === application.candidate_id)
    if (candidate) {
      sendEmail({ to: candidate.email, subject: `Re: ${application.id.slice(0, 8)} — ${type.replace(/_/g, ' ')}`, body: text }).catch(() => {})
    }
  }

  res.status(201).json(message)
})

// --- scorecards (interview feedback) ---

applicationsRouter.get('/:id/scorecards', (req, res) => {
  const scorecards = db.scorecards.filter((s) => s.application_id === req.params.id)
  res.json({ scorecards, total: scorecards.length })
})

applicationsRouter.post('/:id/scorecards', (req, res) => {
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'application not found' })
  const { interviewer, round, recommendation, notes } = req.body ?? {}
  if (!interviewer || !recommendation) return res.status(422).json({ error: 'interviewer and recommendation are required' })

  const scorecard = {
    id: nextId('sc'),
    application_id: application.id,
    interviewer,
    round: round ?? 1,
    recommendation,
    notes: notes ?? '',
    submitted_at: new Date().toISOString(),
  }
  db.scorecards.push(scorecard)
  fireWebhookEvent('scorecard.submitted', scorecard)
  res.status(201).json(scorecard)
})

// GET /v1/applications/:id/activity — merged, chronological audit trail:
// stage changes + messages + scorecards in one feed.
applicationsRouter.get('/:id/activity', (req, res) => {
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'application not found' })

  const events = [
    ...application.stage_history.map((s) => ({ type: 'stage_change' as const, at: s.entered_at, detail: s })),
    ...db.messages.filter((m) => m.application_id === application.id).map((m) => ({ type: 'message' as const, at: m.created_at, detail: m })),
    ...db.scorecards.filter((s) => s.application_id === application.id).map((s) => ({ type: 'scorecard' as const, at: s.submitted_at, detail: s })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  res.json({ application_id: application.id, events })
})
