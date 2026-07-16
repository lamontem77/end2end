// The "candidate simulator agent" in persistent mode: registers a webhook
// against the mock ATS, and whenever a recruiter/coordinator sends a
// scheduling message, waits a simulated turnaround delay and then plays
// the candidate's side — accepting, countering, or ghosting — driven by
// that candidate's persona (see persona.ts). Run this alongside the mock
// ATS server to stress-test scheduling logic against messy real-world
// candidate behavior instead of always-cooperative fixtures.
import 'dotenv/config'
import express from 'express'
import { atsClient } from './atsClient.js'
import { personaFor, decideSchedulingResponse } from './persona.js'

const LISTEN_PORT = process.env.SIMULATOR_PORT ? Number(process.env.SIMULATOR_PORT) : 4100
const PUBLIC_URL = process.env.SIMULATOR_PUBLIC_URL ?? `http://localhost:${LISTEN_PORT}`
// Real candidates take hours/days to reply; scale that down for demo speed.
// Default: 1 simulated minute = 50ms of real time (a multi-hour reply lands in seconds).
const MS_PER_SIMULATED_MINUTE = process.env.SIMULATOR_MS_PER_MINUTE ? Number(process.env.SIMULATOR_MS_PER_MINUTE) : 50

const processedMessageIds = new Set<string>()

function log(...args: unknown[]) {
  console.log(`[candidate-sim ${new Date().toISOString()}]`, ...args)
}

const app = express()
app.use(express.json())

app.post('/webhook', async (req, res) => {
  res.status(200).send('ok')
  const { event, payload } = req.body ?? {}
  if (event !== 'application.message_created') return
  const message = payload
  if (!['coordinator', 'recruiter'].includes(message.from)) return
  if (!['availability_request', 'self_schedule_link'].includes(message.type)) return
  if (processedMessageIds.has(message.id)) return
  processedMessageIds.add(message.id)

  try {
    const application = await atsClient.getApplication(message.application_id)
    const candidate = await atsClient.getCandidate(application.candidate_id)
    const persona = personaFor(candidate.id)
    const action = decideSchedulingResponse(persona, message.proposed_slots, candidate.first_name)
    const [minDelay, maxDelay] = persona.responseDelayMinutes
    const delayMinutes = minDelay + Math.random() * (maxDelay - minDelay)
    const delayMs = Math.round(delayMinutes * MS_PER_SIMULATED_MINUTE)

    log(`${candidate.first_name} ${candidate.last_name} will respond in ~${Math.round(delayMinutes)} simulated min (persona: responsiveness=${persona.responsiveness.toFixed(2)}, decisiveness=${persona.decisiveness.toFixed(2)}) -> ${action.kind}`)

    setTimeout(async () => {
      try {
        if (action.kind === 'ghost') {
          log(`${candidate.first_name} ${candidate.last_name} GHOSTED message ${message.id} on application ${application.id}`)
          return
        }
        if (action.kind === 'accept') {
          await atsClient.postMessage(application.id, { from: 'candidate', type: 'reply', text: action.text, chosen_slot: action.chosen_slot })
          log(`${candidate.first_name} ${candidate.last_name} ACCEPTED a slot on application ${application.id}: ${action.chosen_slot}`)
          return
        }
        await atsClient.postMessage(application.id, { from: 'candidate', type: 'reply', text: action.text, proposed_slots: action.proposed_slots })
        log(`${candidate.first_name} ${candidate.last_name} COUNTERED with new times on application ${application.id}`)
      } catch (err) {
        log('error posting candidate response:', err instanceof Error ? err.message : err)
      }
    }, delayMs)
  } catch (err) {
    log('error handling webhook event:', err instanceof Error ? err.message : err)
  }
})

app.listen(LISTEN_PORT, async () => {
  log(`Candidate simulator listening on :${LISTEN_PORT}`)
  try {
    const webhook = await atsClient.registerWebhook(`${PUBLIC_URL}/webhook`, ['application.message_created'])
    log(`Registered webhook ${webhook.id} -> ${PUBLIC_URL}/webhook`)
  } catch (err) {
    log('failed to register webhook with mock ATS — is it running? ', err instanceof Error ? err.message : err)
  }
})
