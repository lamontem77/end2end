import 'dotenv/config'
import express from 'express'
import { db } from './db.js'
import { candidatesRouter } from './routes/candidates.js'
import { jobsRouter } from './routes/jobs.js'
import { applicationsRouter } from './routes/applications.js'
import { webhooksRouter } from './routes/webhooks.js'
import { calendarRouter } from './routes/calendar.js'
import { onboardingRouter } from './routes/onboarding.js'
import { getOutbox } from './integrations/email.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
// Toy auth, standing in for the API key / OAuth bearer token a real ATS
// would require. Swapping to a real ATS later means swapping this header
// check (and the base URL) for whatever Eightfold/Workday/Greenhouse expect.
const API_KEY = process.env.MOCK_ATS_API_KEY ?? 'dev-key'

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  if (req.path === '/healthz') return next()
  const key = req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  if (key !== API_KEY) return res.status(401).json({ error: 'invalid or missing API key' })
  next()
})

app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    counts: {
      candidates: db.candidates.length,
      jobs: db.jobs.length,
      applications: db.applications.length,
      messages: db.messages.length,
      scorecards: db.scorecards.length,
      webhooks: db.webhooks.length,
    },
  })
})

app.use('/v1/candidates', candidatesRouter)
app.use('/v1/jobs', jobsRouter)
app.use('/v1/applications', applicationsRouter)
app.use('/v1/applications', onboardingRouter)
app.use('/v1/webhooks', webhooksRouter)
app.use('/v1/calendar', calendarRouter)

// Inspect what the sandboxed email integration would have sent — the
// mock-ATS equivalent of checking a Mailtrap inbox.
app.get('/v1/_debug/outbox', (_req, res) => {
  res.json({ emails: getOutbox() })
})

app.use((req, res) => {
  res.status(404).json({ error: `no route for ${req.method} ${req.path}` })
})

app.listen(PORT, () => {
  console.log(`Mock ATS API listening on :${PORT} (${db.candidates.length} candidates, ${db.jobs.length} jobs, ${db.applications.length} applications loaded)`)
})
