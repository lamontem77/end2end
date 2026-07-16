import { Router } from 'express'
import { db, nextId } from '../db.js'
import { fireWebhookEvent } from '../webhooks.js'

export const candidatesRouter = Router()

// GET /v1/candidates?per_page=25&page=1&q=jordan
candidatesRouter.get('/', (req, res) => {
  const perPage = Math.min(Number(req.query.per_page) || 25, 100)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const q = String(req.query.q ?? '').toLowerCase()

  let results = db.candidates
  if (q) {
    results = results.filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  }

  const start = (page - 1) * perPage
  const page_results = results.slice(start, start + perPage)
  res.json({ candidates: page_results, total: results.length, page, per_page: perPage })
})

candidatesRouter.get('/:id', (req, res) => {
  const candidate = db.candidates.find((c) => c.id === req.params.id)
  if (!candidate) return res.status(404).json({ error: 'candidate not found' })
  res.json(candidate)
})

// POST /v1/candidates — real Greenhouse callers send resume + basic info;
// we accept the same shape and fill in an id/created_at.
candidatesRouter.post('/', (req, res) => {
  const { first_name, last_name, email, phone, title, company, resume_summary, source } = req.body ?? {}
  if (!first_name || !last_name || !email) {
    return res.status(422).json({ error: 'first_name, last_name, and email are required' })
  }
  const candidate = {
    id: nextId('cand'),
    first_name,
    last_name,
    email,
    phone: phone ?? '',
    title: title ?? '',
    company: company ?? '',
    resume_summary: resume_summary ?? '',
    source: source ?? { id: nextId('src'), name: 'Applied' },
    created_at: new Date().toISOString(),
  }
  db.candidates.push(candidate)
  fireWebhookEvent('candidate.created', candidate)
  res.status(201).json(candidate)
})
