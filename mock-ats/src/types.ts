// Resource shapes modeled loosely on Greenhouse's Harvest API (candidates,
// jobs, applications, scorecards) since it's a well-documented, realistic
// public shape — Eightfold/Workday/Merge.dev use similar resource-oriented
// conventions, so the mapping work to swap this for a real ATS later is
// "rename fields + add an auth header," not "redesign the integration."

export interface AtsUser {
  id: string
  name: string
  email: string
}

export interface AtsCandidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  title: string
  company: string
  resume_summary: string
  source: { id: string; name: string }
  created_at: string
}

export type StageName =
  | 'Applied'
  | 'Screening Scheduled'
  | 'Phone Screen'
  | 'Assessment to Send'
  | 'Assessment Pending'
  | 'Assessment Review'
  | 'Round N Scheduling'
  | 'Round N In Progress'
  | 'Pending Feedback'
  | 'Debrief / Decision'
  | 'Offer Prep'
  | 'Offer Pending Approval'
  | 'Offer Extended'
  | 'Offer Accepted'

export const STAGE_PIPELINE: StageName[] = [
  'Applied',
  'Screening Scheduled',
  'Phone Screen',
  'Assessment to Send',
  'Assessment Pending',
  'Assessment Review',
  'Round N Scheduling',
  'Round N In Progress',
  'Pending Feedback',
  'Debrief / Decision',
  'Offer Prep',
  'Offer Pending Approval',
  'Offer Extended',
  'Offer Accepted',
]

export interface AtsJob {
  id: string
  name: string
  department: string
  status: 'open' | 'closed' | 'draft'
  hiring_manager: AtsUser
  recruiter: AtsUser
  coordinator: AtsUser
  created_at: string
}

export interface StageHistoryEntry {
  stage: StageName
  entered_at: string
  actor: string
}

export interface AtsApplication {
  id: string
  candidate_id: string
  job_id: string
  status: 'active' | 'rejected' | 'hired'
  current_stage: StageName
  stage_history: StageHistoryEntry[]
  applied_at: string
  rejected_at?: string
  rejected_reason?: string
  hired_at?: string
}

export type MessageType = 'availability_request' | 'self_schedule_link' | 'reply' | 'confirmation' | 'assessment_send' | 'note'
export type MessageFrom = 'recruiter' | 'coordinator' | 'candidate' | 'system'

export interface ApplicationMessage {
  id: string
  application_id: string
  from: MessageFrom
  type: MessageType
  text: string
  proposed_slots?: string[]
  chosen_slot?: string
  created_at: string
}

export interface Scorecard {
  id: string
  application_id: string
  interviewer: AtsUser
  round: number
  recommendation: 'strong_yes' | 'yes' | 'no' | 'strong_no'
  notes: string
  submitted_at: string
}

export type OnboardingItemKey = 'offer_letter' | 'background_check' | 'drug_test' | 'tech_setup'
export type OnboardingItemStatus = 'not_started' | 'in_progress' | 'pending' | 'clear' | 'complete' | 'flagged' | 'failed'

export interface OnboardingItem {
  status: OnboardingItemStatus
  updated_at: string
}

export interface OnboardingChecklist {
  application_id: string
  start_date: string
  offer_letter: OnboardingItem
  background_check: OnboardingItem
  drug_test: OnboardingItem
  tech_setup: OnboardingItem
  ready_to_start: boolean
}

export type WebhookEvent =
  | 'candidate.created'
  | 'application.created'
  | 'application.stage_change'
  | 'application.rejected'
  | 'application.hired'
  | 'application.message_created'
  | 'scorecard.submitted'
  | 'onboarding.updated'
  | 'onboarding.ready_to_start'

export interface WebhookSubscription {
  id: string
  url: string
  events: WebhookEvent[]
  secret?: string
  created_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event: WebhookEvent
  payload: unknown
  attempted_at: string
  ok: boolean
  status?: number
  error?: string
}
