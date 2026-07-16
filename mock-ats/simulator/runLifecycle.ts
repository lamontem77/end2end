// Drives one candidate through the entire pipeline against the mock ATS —
// apply -> recruiter screen -> assessment -> 3 interview rounds with
// interviewer feedback -> debrief -> offer -> onboarding (BGC, drug test,
// tech setup) -> day one — logging every state transition. Then runs a
// short stress-test batch of additional candidates through just the
// scheduling exchange to show the candidate simulator's messy behavior
// (accept / reschedule / ghost) in aggregate.
//
// Requires the mock ATS server running (`npm run dev` in mock-ats/).
import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { atsClient } from './atsClient.js'
import { personaFor, decideSchedulingResponse, type SchedulingAction } from './persona.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOG_DIR = join(__dirname, '..', 'logs')

interface LogEntry {
  at: string
  step: string
  detail?: unknown
}
const timeline: LogEntry[] = []

function record(step: string, detail?: unknown) {
  const entry: LogEntry = { at: new Date().toISOString(), step, detail }
  timeline.push(entry)
  console.log(`[lifecycle] ${step}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

const INTERVIEWERS = [
  { id: 'u-devon', name: 'Devon K.', email: 'devon.k@recruiteros.dev' },
  { id: 'u-priya', name: 'Priya R.', email: 'priya.r@recruiteros.dev' },
  { id: 'u-marcus', name: 'Marcus T.', email: 'marcus.t@recruiteros.dev' },
]
const RECRUITER = { id: 'u-sarah', name: 'Sarah M.', email: 'sarah.m@recruiteros.dev' }
const COORDINATOR = { id: 'u-alex', name: 'Alex T.', email: 'alex.t@recruiteros.dev' }
const HIRING_MANAGER = { id: 'u-jamie', name: 'Jamie L.', email: 'jamie.l@recruiteros.dev' }

// Requests availability, decides + posts the candidate's reply using its
// persona, and retries on ghosting up to `maxAttempts` before escalating
// (a coordinator follow-up call) so the featured narrative always resolves
// — same "someone eventually picks up the phone" outcome a real RC would
// drive to, rather than the pipeline silently stalling forever.
async function requestAndAwaitScheduling(
  applicationId: string,
  candidateFirstName: string,
  candidateId: string,
  interviewer: { id: string; name: string },
  roundLabel: string,
  maxAttempts = 3,
): Promise<{ slot: string; attempts: number; resolution: 'accepted' | 'escalated'; rescheduleCount: number }> {
  const persona = personaFor(candidateId)
  await atsClient.getFreeBusy(interviewer.id, 5) // real call, shown for realism/logging even though we don't hard-filter on it here
  let proposedSlots = [3, 4, 5].map((d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString())
  let rescheduleCount = 0

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await atsClient.postMessage(applicationId, {
      from: 'coordinator',
      type: 'availability_request',
      text: `Hi ${candidateFirstName}, could you share a time that works for your ${roundLabel} with ${interviewer.name}?`,
      proposed_slots: proposedSlots,
    })
    record(`Coordinator sent availability request for ${roundLabel} (attempt ${attempt}/${maxAttempts})`, { proposedSlots })

    const action: SchedulingAction = decideSchedulingResponse(persona, proposedSlots, candidateFirstName)

    if (action.kind === 'ghost') {
      record(`Candidate did not respond (ghosted) to ${roundLabel} request`)
      if (attempt === maxAttempts) {
        const fallbackSlot = proposedSlots[0]
        await atsClient.postMessage(applicationId, {
          from: 'coordinator',
          type: 'note',
          text: `No response after ${maxAttempts} attempts — coordinator followed up by phone and confirmed ${fallbackSlot}.`,
        })
        record(`Escalation: coordinator phone follow-up confirmed a time for ${roundLabel}`, { fallbackSlot })
        return { slot: fallbackSlot, attempts: attempt, resolution: 'escalated', rescheduleCount }
      }
      continue
    }

    if (action.kind === 'accept') {
      await atsClient.postMessage(applicationId, { from: 'candidate', type: 'reply', text: action.text, chosen_slot: action.chosen_slot })
      record(`Candidate accepted a time for ${roundLabel}`, { chosen_slot: action.chosen_slot })
      return { slot: action.chosen_slot, attempts: attempt, resolution: 'accepted', rescheduleCount }
    }

    // reschedule
    rescheduleCount++
    await atsClient.postMessage(applicationId, { from: 'candidate', type: 'reply', text: action.text, proposed_slots: action.proposed_slots })
    record(`Candidate proposed alternate times for ${roundLabel}`, { alternates: action.proposed_slots })
    proposedSlots = action.proposed_slots
    if (attempt === maxAttempts) {
      // Ran out of attempts while still negotiating — coordinator just
      // locks in the candidate's latest counter-proposal instead of
      // escalating (they did respond, just not to our first offer).
      record(`Locking in candidate's latest proposed time for ${roundLabel} after ${maxAttempts} rounds of negotiation`)
      return { slot: proposedSlots[0], attempts: attempt, resolution: 'accepted', rescheduleCount }
    }
  }

  // Unreachable — every branch above returns.
  return { slot: proposedSlots[0], attempts: maxAttempts, resolution: 'accepted', rescheduleCount }
}

async function runFeaturedCandidate() {
  record('=== Featured candidate: full lifecycle ===')

  const jobs = await atsClient.listJobs()
  const job = jobs.jobs.find((j) => j.department === 'Engineering') ?? jobs.jobs[0]
  record('Selected requisition', { job_id: job.id, name: job.name, department: job.department })

  const candidate = await atsClient.createCandidate({
    first_name: 'Jordan',
    last_name: 'Rivera',
    email: 'jordan.rivera@example.com',
    phone: '+15550142233',
    title: 'Software Engineer',
    company: 'Previous Co',
    resume_summary: 'Full-stack engineer with 5 years of experience shipping production web applications.',
    source: { id: 'src_linkedin', name: 'LinkedIn' },
  })
  record('Candidate created', { candidate_id: candidate.id, name: `${candidate.first_name} ${candidate.last_name}` })

  // --- Apply ---
  const application = await atsClient.createApplication(candidate.id, job.id)
  record('Application created — stage: Applied', { application_id: application.id })

  // --- Recruiter screen ---
  await atsClient.moveStage(application.id, 'Screening Scheduled', RECRUITER.name)
  record('Advanced to Screening Scheduled', { actor: RECRUITER.name })
  const screen = await requestAndAwaitScheduling(application.id, candidate.first_name, candidate.id, RECRUITER, 'phone screen')

  await atsClient.moveStage(application.id, 'Phone Screen', COORDINATOR.name)
  const phoneScreenEvent = await atsClient.createEvent({ organizer: RECRUITER.email, attendees: [candidate.email], start: screen.slot, end: screen.slot })
  record('Phone screen scheduled and stage advanced to Phone Screen', { calendar_event: phoneScreenEvent.id })
  await sleep(200)
  record('Phone screen completed — recruiter recommends moving forward')

  // --- Assessment ---
  await atsClient.moveStage(application.id, 'Assessment to Send', COORDINATOR.name)
  await atsClient.postMessage(application.id, {
    from: 'coordinator',
    type: 'assessment_send',
    text: `Hi ${candidate.first_name}, next step is a take-home assessment. You'll have 5 days to complete it.`,
  })
  record('Assessment sent')
  await atsClient.moveStage(application.id, 'Assessment Pending', COORDINATOR.name)
  await sleep(200)
  record('Candidate submitted the completed assessment')
  await atsClient.moveStage(application.id, 'Assessment Review', RECRUITER.name)
  record('Recruiter reviewing assessment — result: pass')

  // --- Rounds 1-3 ---
  for (let round = 1; round <= 3; round++) {
    const interviewer = INTERVIEWERS[round - 1]
    await atsClient.moveStage(application.id, 'Round N Scheduling', COORDINATOR.name)
    record(`Round ${round}: stage -> Round N Scheduling`, { interviewer: interviewer.name })
    const scheduled = await requestAndAwaitScheduling(application.id, candidate.first_name, candidate.id, interviewer, `Round ${round} interview`)

    await atsClient.moveStage(application.id, 'Round N In Progress', COORDINATOR.name)
    const event = await atsClient.createEvent({ organizer: interviewer.email, attendees: [candidate.email, RECRUITER.email], start: scheduled.slot, end: scheduled.slot })
    record(`Round ${round} interview scheduled`, { calendar_event: event.id, interviewer: interviewer.name })

    await atsClient.moveStage(application.id, 'Pending Feedback', interviewer.name)
    record(`Round ${round} interview completed — feedback task assigned to ${interviewer.name}`)

    const recommendation = round === 3 ? 'strong_yes' : Math.random() > 0.15 ? 'yes' : 'strong_yes'
    await atsClient.postScorecard(application.id, { interviewer, round, recommendation, notes: `Solid round ${round} performance, would advance.` })
    record(`${interviewer.name} submitted scorecard for round ${round}`, { recommendation })
  }

  // --- Debrief + offer ---
  await atsClient.moveStage(application.id, 'Debrief / Decision', HIRING_MANAGER.name)
  record('Advanced to Debrief / Decision', { actor: HIRING_MANAGER.name })
  await sleep(150)
  record(`${HIRING_MANAGER.name} reviewed scorecards and decided: advance to offer`)

  await atsClient.moveStage(application.id, 'Offer Prep', RECRUITER.name)
  await atsClient.postMessage(application.id, { from: 'recruiter', type: 'note', text: 'Offer letter drafted — role, comp, start date populated from requisition.' })
  record('Offer letter drafted')

  await atsClient.moveStage(application.id, 'Offer Pending Approval', HIRING_MANAGER.name)
  record('Offer routed to hiring manager for approval')
  await sleep(150)
  await atsClient.moveStage(application.id, 'Offer Extended', COORDINATOR.name)
  await atsClient.postMessage(application.id, { from: 'coordinator', type: 'note', text: 'Offer approved and sent to candidate for e-signature.' })
  record('Offer extended to candidate')

  await sleep(200)
  await atsClient.moveStage(application.id, 'Offer Accepted', COORDINATOR.name)
  record('Candidate accepted the offer — stage: Offer Accepted (hired)')

  // --- Onboarding ---
  const startDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  const onboarding = await atsClient.createOnboarding(application.id, startDate)
  record('Onboarding checklist created', { start_date: startDate })

  await atsClient.patchOnboardingItem(application.id, 'background_check', 'in_progress')
  record('Background check initiated (Checkr)')
  await sleep(150)
  await atsClient.patchOnboardingItem(application.id, 'background_check', 'clear')
  record('Background check result: clear')

  await atsClient.patchOnboardingItem(application.id, 'drug_test', 'in_progress')
  record('Drug test ordered (Quest Diagnostics)')
  await sleep(150)
  await atsClient.patchOnboardingItem(application.id, 'drug_test', 'clear')
  record('Drug test result: negative/clear')

  await atsClient.patchOnboardingItem(application.id, 'tech_setup', 'in_progress')
  record('IT started tech setup')
  await sleep(150)
  const finalChecklist = await atsClient.patchOnboardingItem(application.id, 'tech_setup', 'complete')
  record('Tech setup complete', { ready_to_start: finalChecklist.ready_to_start })

  // --- Day one ---
  record(`Day One: ${candidate.first_name} ${candidate.last_name} starts as ${job.name} on ${onboarding.start_date}`)

  const activity = await atsClient.getActivity(application.id)
  record('=== Featured candidate lifecycle complete ===', { total_activity_events: activity.events.length })

  return { candidate, application, activity }
}

// Runs a batch of lightweight candidates through just the scheduling
// exchange to show the simulator's persona-driven behavior distribution —
// this is the "stress test the scheduling agent" half of the ask.
async function runSchedulingStressTest(count = 8) {
  record(`=== Stress test: ${count} candidates through scheduling only ===`)
  const jobs = await atsClient.listJobs()
  const stats = { accepted_first_try: 0, accepted_after_reschedule: 0, ghosted_then_escalated: 0, total_reschedules: 0 }

  for (let i = 0; i < count; i++) {
    const job = jobs.jobs[i % jobs.jobs.length]
    const candidate = await atsClient.createCandidate({
      first_name: `StressTest${i}`,
      last_name: 'Candidate',
      email: `stress.test.${i}@example.com`,
      title: job.name,
      source: { id: 'src_stress', name: 'Stress Test' },
    })
    const application = await atsClient.createApplication(candidate.id, job.id)
    await atsClient.moveStage(application.id, 'Screening Scheduled', COORDINATOR.name)
    const result = await requestAndAwaitScheduling(application.id, candidate.first_name, candidate.id, RECRUITER, 'phone screen', 3)
    stats.total_reschedules += result.rescheduleCount
    if (result.resolution === 'escalated') stats.ghosted_then_escalated++
    else if (result.rescheduleCount > 0) stats.accepted_after_reschedule++
    else stats.accepted_first_try++
  }

  record('Stress test complete', stats)
  return stats
}

async function main() {
  mkdirSync(LOG_DIR, { recursive: true })
  record('Lifecycle simulation started', { base_url: process.env.MOCK_ATS_BASE_URL ?? 'http://localhost:4000' })

  const featured = await runFeaturedCandidate()
  const stress = await runSchedulingStressTest()

  const outFile = join(LOG_DIR, `lifecycle-${Date.now()}.json`)
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        featured_candidate: { candidate_id: featured.candidate.id, application_id: featured.application.id, name: `${featured.candidate.first_name} ${featured.candidate.last_name}` },
        featured_ats_activity: featured.activity.events,
        stress_test_summary: stress,
        narrated_timeline: timeline,
      },
      null,
      2,
    ),
  )
  record(`Full log written to ${outFile}`)
}

main().catch((err) => {
  console.error('[lifecycle] FAILED:', err)
  process.exit(1)
})
