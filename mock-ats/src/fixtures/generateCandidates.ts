// Generates the synthetic dataset: 150 fake candidates, 8 requisitions, and
// realistic in-progress applications/messages/scorecards for a chunk of
// them, so the mock API boots with something that looks like a live ATS
// instead of an empty database. Never run this against real candidate data
// — Faker only, by design.
import { faker } from '@faker-js/faker'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type {
  AtsCandidate,
  AtsJob,
  AtsApplication,
  ApplicationMessage,
  Scorecard,
  StageHistoryEntry,
  StageName,
  AtsUser,
} from '../types.js'
import { STAGE_PIPELINE } from '../types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'data')

faker.seed(42) // reproducible dataset across runs

const INTERNAL_USERS: AtsUser[] = [
  { id: 'u-sarah', name: 'Sarah M.', email: 'sarah.m@recruiteros.dev' },
  { id: 'u-marcus', name: 'Marcus T.', email: 'marcus.t@recruiteros.dev' },
  { id: 'u-priya', name: 'Priya R.', email: 'priya.r@recruiteros.dev' },
  { id: 'u-alex', name: 'Alex T.', email: 'alex.t@recruiteros.dev' },
  { id: 'u-devon', name: 'Devon K.', email: 'devon.k@recruiteros.dev' },
  { id: 'u-jamie', name: 'Jamie L.', email: 'jamie.l@recruiteros.dev' },
  { id: 'u-noor', name: 'Noor H.', email: 'noor.h@recruiteros.dev' },
  { id: 'u-taylor', name: 'Taylor R.', email: 'taylor.r@recruiteros.dev' },
]

function pick<T>(arr: T[]): T {
  return faker.helpers.arrayElement(arr)
}

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Data', 'Sales', 'Marketing', 'People', 'IT'] as const
const ROLE_TITLES: Record<(typeof DEPARTMENTS)[number], string[]> = {
  Engineering: ['Software Engineer II', 'Senior Backend Engineer', 'Frontend Engineer', 'QA Engineer', 'Engineering Manager'],
  Product: ['Product Manager', 'Senior Product Manager', 'Product Analyst'],
  Design: ['Product Designer', 'Senior Product Designer', 'UX Researcher'],
  Data: ['Data Analyst', 'Data Scientist', 'Analytics Engineer'],
  Sales: ['Account Executive', 'Sales Development Rep', 'Sales Manager'],
  Marketing: ['Marketing Manager', 'Content Strategist', 'Growth Marketer'],
  People: ['Recruiting Coordinator', 'HR Business Partner', 'People Ops Manager'],
  IT: ['IT Support Specialist', 'Systems Administrator'],
}
const SOURCES = ['LinkedIn', 'Referral', 'Applied', 'Indeed', 'AngelList', 'University Recruiting']

const jobs: AtsJob[] = DEPARTMENTS.map((department) => {
  const titles = ROLE_TITLES[department]
  const name = pick(titles)
  return {
    id: faker.string.uuid(),
    name,
    department,
    status: 'open',
    hiring_manager: pick(INTERNAL_USERS),
    recruiter: pick(INTERNAL_USERS),
    coordinator: pick(INTERNAL_USERS),
    created_at: faker.date.past({ years: 1 }).toISOString(),
  }
})

function resumeSummary(title: string): string {
  const years = faker.number.int({ min: 1, max: 12 })
  const skill1 = faker.hacker.noun()
  const skill2 = faker.hacker.noun()
  const company = faker.company.name()
  return `${years} years of experience in ${title.toLowerCase()} roles, most recently at ${company}. Strong background in ${skill1} and ${skill2}. ${faker.lorem.sentence()}`
}

// Rough funnel shape: most applications sit early, fewer survive to the end.
const STAGE_WEIGHTS: [StageName, number][] = [
  ['Applied', 22],
  ['Screening Scheduled', 12],
  ['Phone Screen', 10],
  ['Assessment to Send', 8],
  ['Assessment Pending', 8],
  ['Assessment Review', 6],
  ['Round N Scheduling', 8],
  ['Round N In Progress', 6],
  ['Pending Feedback', 6],
  ['Debrief / Decision', 5],
  ['Offer Prep', 3],
  ['Offer Pending Approval', 2],
  ['Offer Extended', 2],
  ['Offer Accepted', 2],
]

function weightedStage(): StageName {
  return faker.helpers.weightedArrayElement(STAGE_WEIGHTS.map(([stage, weight]) => ({ value: stage, weight })))
}

function buildStageHistory(finalStage: StageName, appliedAt: Date, actor: string): StageHistoryEntry[] {
  const finalIndex = STAGE_PIPELINE.indexOf(finalStage)
  const history: StageHistoryEntry[] = []
  let cursor = new Date(appliedAt)
  for (let i = 0; i <= finalIndex; i++) {
    history.push({ stage: STAGE_PIPELINE[i], entered_at: cursor.toISOString(), actor })
    cursor = faker.date.soon({ days: faker.number.int({ min: 1, max: 4 }), refDate: cursor })
  }
  return history
}

const candidates: AtsCandidate[] = []
const applications: AtsApplication[] = []
const messages: ApplicationMessage[] = []
const scorecards: Scorecard[] = []

const CANDIDATE_COUNT = 150

for (let i = 0; i < CANDIDATE_COUNT; i++) {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const job = pick(jobs)
  const title = pick(ROLE_TITLES[job.department as keyof typeof ROLE_TITLES])

  const candidate: AtsCandidate = {
    id: faker.string.uuid(),
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number({ style: 'international' }),
    title,
    company: faker.company.name(),
    resume_summary: resumeSummary(title),
    source: { id: faker.string.uuid(), name: pick(SOURCES) },
    created_at: faker.date.past({ years: 1 }).toISOString(),
  }
  candidates.push(candidate)

  // ~70% of the pool has an active/past application; the rest are sourced
  // candidates sitting in the database without one yet, same as a real ATS.
  if (faker.number.int({ min: 1, max: 100 }) > 30) {
    const appliedAt = faker.date.recent({ days: 60 })
    const stage = weightedStage()
    const rejectedRoll = faker.number.int({ min: 1, max: 100 })
    const isRejected = rejectedRoll <= 20 && stage !== 'Offer Accepted'
    const isHired = stage === 'Offer Accepted'

    const application: AtsApplication = {
      id: faker.string.uuid(),
      candidate_id: candidate.id,
      job_id: job.id,
      status: isRejected ? 'rejected' : isHired ? 'hired' : 'active',
      current_stage: stage,
      stage_history: buildStageHistory(stage, appliedAt, job.coordinator.name),
      applied_at: appliedAt.toISOString(),
      ...(isRejected ? { rejected_at: faker.date.recent({ days: 10 }).toISOString(), rejected_reason: pick(['Not enough experience', 'Went with another candidate', 'Failed assessment', 'Compensation mismatch']) } : {}),
      ...(isHired ? { hired_at: faker.date.recent({ days: 5 }).toISOString() } : {}),
    }
    applications.push(application)

    // Scheduling message thread for anything past "Screening Scheduled".
    const stageIndex = STAGE_PIPELINE.indexOf(stage)
    if (stageIndex >= 1) {
      const requestedAt = faker.date.soon({ days: 1, refDate: appliedAt })
      messages.push({
        id: faker.string.uuid(),
        application_id: application.id,
        from: 'coordinator',
        type: 'availability_request',
        text: `Hi ${firstName}, thanks for your interest in the ${job.name} role! Could you share a few times that work for a quick chat this week?`,
        proposed_slots: [faker.date.soon({ days: 3 }).toISOString(), faker.date.soon({ days: 4 }).toISOString(), faker.date.soon({ days: 5 }).toISOString()],
        created_at: requestedAt.toISOString(),
      })
      if (stageIndex >= 2) {
        messages.push({
          id: faker.string.uuid(),
          application_id: application.id,
          from: 'candidate',
          type: 'reply',
          text: `Thanks! ${pick(['Tuesday at 2pm works great.', 'I can do Wednesday morning.', 'Any of those times work for me.'])}`,
          chosen_slot: faker.date.soon({ days: 3, refDate: requestedAt }).toISOString(),
          created_at: faker.date.soon({ days: 1, refDate: requestedAt }).toISOString(),
        })
      }
    }

    // Scorecards for anything that's completed at least one interview round.
    if (stageIndex >= STAGE_PIPELINE.indexOf('Pending Feedback')) {
      const rounds = stageIndex >= STAGE_PIPELINE.indexOf('Debrief / Decision') ? 1 : 1
      for (let r = 1; r <= rounds; r++) {
        scorecards.push({
          id: faker.string.uuid(),
          application_id: application.id,
          interviewer: pick(INTERNAL_USERS),
          round: r,
          recommendation: pick(['strong_yes', 'yes', 'yes', 'no', 'strong_no']),
          notes: faker.lorem.sentences(2),
          submitted_at: faker.date.recent({ days: 20 }).toISOString(),
        })
      }
    }
  }
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'candidates.json'), JSON.stringify(candidates, null, 2))
writeFileSync(join(OUT_DIR, 'jobs.json'), JSON.stringify(jobs, null, 2))
writeFileSync(join(OUT_DIR, 'applications.json'), JSON.stringify(applications, null, 2))
writeFileSync(join(OUT_DIR, 'messages.json'), JSON.stringify(messages, null, 2))
writeFileSync(join(OUT_DIR, 'scorecards.json'), JSON.stringify(scorecards, null, 2))
writeFileSync(join(OUT_DIR, 'users.json'), JSON.stringify(INTERNAL_USERS, null, 2))

console.log(`Generated ${candidates.length} candidates, ${jobs.length} jobs, ${applications.length} applications, ${messages.length} messages, ${scorecards.length} scorecards -> mock-ats/src/data/`)
