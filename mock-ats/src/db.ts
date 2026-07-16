import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { AtsApplication, AtsCandidate, AtsJob, AtsUser, ApplicationMessage, Scorecard, WebhookDelivery, WebhookSubscription, OnboardingChecklist } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'))
}

// In-memory store seeded from the generated fixtures. Resets on restart —
// this is a demo/dev ATS, not a durable one. Run `npm run generate:candidates`
// to regenerate the fixtures Faker produced.
export const db = {
  users: load<AtsUser[]>('users.json'),
  candidates: load<AtsCandidate[]>('candidates.json'),
  jobs: load<AtsJob[]>('jobs.json'),
  applications: load<AtsApplication[]>('applications.json'),
  messages: load<ApplicationMessage[]>('messages.json'),
  scorecards: load<Scorecard[]>('scorecards.json'),
  webhooks: [] as WebhookSubscription[],
  webhookDeliveries: [] as WebhookDelivery[],
  onboarding: {} as Record<string, OnboardingChecklist>,
}

export function nextId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
