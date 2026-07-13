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

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  label: string
  actor?: string
  timestamp: string
  meta?: Record<string, string>
}

export interface InterviewRound {
  id: string
  roundNumber: number
  interviewerId: string
  interviewerName: string
  scheduledAt?: string
  format: 'virtual' | 'in_person'
  feedbackStatus: 'pending' | 'submitted'
  webexLink?: string
}

export interface Scorecard {
  id: string
  roundId: string
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
