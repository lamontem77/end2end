import { Router } from 'express'
import { db } from '../db.js'
import { STAGE_PIPELINE } from '../types.js'

export const jobsRouter = Router()

jobsRouter.get('/', (req, res) => {
  const status = req.query.status as string | undefined
  const jobs = status ? db.jobs.filter((j) => j.status === status) : db.jobs
  res.json({ jobs, total: jobs.length })
})

jobsRouter.get('/:id', (req, res) => {
  const job = db.jobs.find((j) => j.id === req.params.id)
  if (!job) return res.status(404).json({ error: 'job not found' })
  res.json(job)
})

// GET /v1/jobs/:id/stages — the ordered pipeline for this job. Every job
// shares the same 14-stage pipeline in this mock (per-job custom pipelines
// are a real-ATS feature not worth modeling here).
jobsRouter.get('/:id/stages', (req, res) => {
  const job = db.jobs.find((j) => j.id === req.params.id)
  if (!job) return res.status(404).json({ error: 'job not found' })
  res.json({ job_id: job.id, stages: STAGE_PIPELINE })
})
