export type UserRole =
  | 'recruiter'
  | 'rc'
  | 'interviewer'
  | 'hiring_manager'
  | 'ta_lead'
  | 'hr'
  | 'it'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarColor: string
}

export type Stage =
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

export const STAGES: Stage[] = [
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

export interface StageConfig {
  stage: Stage
  assignRole: UserRole | null
  slaHours: number | null
  agentTrigger: AgentActionType | null
}

export type Priority = 'standard' | 'priority' | 'urgent'

export interface Note {
  id: string
  author: string
  content: string
  createdAt: string
}

export type ActivityEventType =
  | 'stage_change'
  | 'assignment_change'
  | 'agent_draft_created'
  | 'agent_draft_approved'
  | 'agent_draft_declined'
  | 'email_sent'
  | 'scorecard_submitted'
  | 'note_added'
  | 'sla_warning'
  | 'sla_breach'
  | 'bgc_dt_initiated'
  | 'bgc_dt_result'
  | 'sub_ticket_change'
  | 'ticket_created'
  | 'round_created'
  | 'substatus_change'
  | 'interview_completed'
  | 'decision_recorded'
  | 'candidate_nudged'
  | 'escalated'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  label: string
  actor?: string
  timestamp: string
  meta?: Record<string, string>
}

// "Everything is an event" (v2 spec, product principle #4): every state
// change is written here too, append-only, keyed to a candidate. Reports
// and exports are computed from this — never from hand-maintained counters.
// candidate.activityLog is the same data filtered to one candidate, kept for
// the existing timeline UI; this is the flat, global, cross-candidate log.
export interface AppEvent extends ActivityEvent {
  candidateId: string
}

// Phase 1 sub-status model (v2 spec): a round's position is always
// (stage, subStatus). SLA timers, ownership, and the next-action text all
// derive from subStatus + its timestamp, not from the coarser Stage alone.
export type SubStatus =
  | 'needs_scheduling' // nothing sent yet — owner: coordinator (+ scheduling agent)
  | 'availability_requested' // waiting on candidate reply — owner: candidate
  | 'scheduled' // interview booked, waiting for the date — no SLA pressure
  | 'awaiting_feedback' // interview happened, feedback outstanding — owner: interviewer(s)
  | 'feedback_complete' // all feedback in, decision required — owner: recruiter

export type RoundDecision = 'advance' | 'reject' | 'hold'

export interface InterviewerFeedback {
  interviewerId: string
  interviewerName: string
  status: 'pending' | 'submitted'
  submittedAt?: string
}

export interface InterviewRound {
  id: string
  roundNumber: number
  interviewers: InterviewerFeedback[]
  subStatus: SubStatus
  format: 'virtual' | 'in_person'
  webexLink?: string
  createdAt: string // needs_scheduling started (round stub created)
  requestSentAt?: string // availability_requested started
  scheduledAt?: string // the interview's actual date/time, once booked
  interviewCompletedAt?: string // awaiting_feedback started
  feedbackCompletedAt?: string // feedback_complete started (all interviewers submitted)
  roundCompletedAt?: string // decision recorded — round lifecycle fully done
  decision?: RoundDecision
}

export interface Scorecard {
  id: string
  roundId: string
  interviewerId: string
  submittedBy: string
  submittedAt: string
  recommendation: 'strong_yes' | 'yes' | 'no' | 'strong_no'
  notes: string
}

export type AssessmentStatus = 'not_sent' | 'sent' | 'in_progress' | 'completed' | 'reviewed'

export interface OfferDetails {
  compensation?: string
  startDate?: string
  status: 'not_started' | 'drafted' | 'pending_hm_approval' | 'extended' | 'accepted' | 'declined'
  signedAt?: string
}

export type AgentActionType =
  | 'availability_request'
  | 'schedule_invite'
  | 'self_schedule'
  | 'assessment_send'
  | 'assessment_reminder'
  | 'offer_letter'
  | 'offer_send'
  | 'rejection_email'
  | 'interview_prep'
  | 'interviewer_nudge'
  | 'bgc_initiation'
  | 'drug_test_order'
  | 'start_date_confirmation'
  | 'offer_confirmation'

export interface AgentDraft {
  id: string
  candidateId: string
  candidateName: string
  type: AgentActionType
  title: string
  subject?: string
  content: string
  recipients: string[]
  ccRecipients: string[]
  meta: Record<string, string>
  status: 'pending' | 'approved' | 'declined' | 'sent'
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  declinedReason?: string
  approverRole: UserRole
  internalPreview?: string
  externalPreview?: string
}

export type SubTicketType = 'offer_letter' | 'bgc' | 'drug_test' | 'tech_setup'
export type SubTicketStatus =
  | 'not_started'
  | 'pending'
  | 'in_progress'
  | 'clear'
  | 'flagged'
  | 'failed'
  | 'complete'

export interface SubTicket {
  id: string
  type: SubTicketType
  status: SubTicketStatus
  assignee: string
  slaDeadline?: string
  isHardGate: boolean
  result?: string
  completedAt?: string
  notes?: string
}

export interface NewHireTracker {
  candidateId: string
  startDate: string
  offerLetter: SubTicket
  backgroundCheck: SubTicket
  drugTest: SubTicket
  techSetup: SubTicket
  readyToStart: boolean
}

export interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  department: string
  source: string
  currentStage: Stage
  currentAssigneeId: string
  priority: Priority
  tags: string[]
  stageEnteredAt: string
  slaDeadline: string | null
  notes: Note[]
  activityLog: ActivityEvent[]
  interviewRounds: InterviewRound[]
  scorecards: Scorecard[]
  assessmentStatus: AssessmentStatus
  offerDetails?: OfferDetails
  recruiterId: string
  rcId: string
  hiringManagerId: string
  createdAt: string
  updatedAt: string
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  candidateId?: string
  read: boolean
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  candidateId?: string
  createdAt: string
}
