import { STAGES } from '../types'
import type { AgentActionType, Stage, StageConfig, UserRole } from '../types'

export { STAGES }

// Central stage config per PRD section 7 — drives auto-assignment, SLA
// countdowns, and which agent action fires when a ticket enters a stage.
export const STAGE_CONFIG: Record<Stage, StageConfig> = {
  Applied: { stage: 'Applied', assignRole: 'recruiter', slaHours: 48, agentTrigger: null },
  'Screening Scheduled': {
    stage: 'Screening Scheduled',
    assignRole: 'rc',
    slaHours: 24,
    agentTrigger: 'availability_request',
  },
  'Phone Screen': {
    stage: 'Phone Screen',
    assignRole: 'recruiter',
    slaHours: 24,
    agentTrigger: null,
  },
  'Assessment to Send': {
    stage: 'Assessment to Send',
    assignRole: 'rc',
    slaHours: 4,
    agentTrigger: 'assessment_send',
  },
  'Assessment Pending': {
    stage: 'Assessment Pending',
    assignRole: 'rc',
    slaHours: 24 * 5,
    agentTrigger: null,
  },
  'Assessment Review': {
    stage: 'Assessment Review',
    assignRole: 'recruiter',
    slaHours: 48,
    agentTrigger: null,
  },
  'Round N Scheduling': {
    stage: 'Round N Scheduling',
    assignRole: 'rc',
    slaHours: 4,
    agentTrigger: 'availability_request',
  },
  'Round N In Progress': {
    stage: 'Round N In Progress',
    assignRole: 'interviewer',
    slaHours: null,
    agentTrigger: 'interview_prep',
  },
  'Pending Feedback': {
    stage: 'Pending Feedback',
    assignRole: 'interviewer',
    slaHours: 24,
    agentTrigger: null,
  },
  'Debrief / Decision': {
    stage: 'Debrief / Decision',
    assignRole: 'hiring_manager',
    slaHours: 24,
    agentTrigger: null,
  },
  'Offer Prep': {
    stage: 'Offer Prep',
    assignRole: 'recruiter',
    slaHours: 24,
    agentTrigger: 'offer_letter',
  },
  'Offer Pending Approval': {
    stage: 'Offer Pending Approval',
    assignRole: 'hiring_manager',
    slaHours: 24,
    agentTrigger: null,
  },
  'Offer Extended': {
    stage: 'Offer Extended',
    assignRole: 'rc',
    slaHours: 24 * 5,
    agentTrigger: 'offer_send',
  },
  'Offer Accepted': {
    stage: 'Offer Accepted',
    assignRole: 'rc',
    slaHours: null,
    agentTrigger: 'offer_confirmation',
  },
}

export function slaDeadlineFor(stage: Stage, from: Date = new Date()): string | null {
  const hours = STAGE_CONFIG[stage].slaHours
  if (hours === null) return null
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString()
}

export function assigneeRoleFor(stage: Stage): UserRole | null {
  return STAGE_CONFIG[stage].assignRole
}

export function agentTriggerFor(stage: Stage): AgentActionType | null {
  return STAGE_CONFIG[stage].agentTrigger
}

export type SlaState = 'ok' | 'warning' | 'breach' | 'at_risk'

/** 75% elapsed -> warning, 100% -> breach, 200% -> at_risk (escalation). */
export function slaState(deadline: string | null, stageEnteredAt: string): SlaState {
  if (!deadline) return 'ok'
  const start = new Date(stageEnteredAt).getTime()
  const end = new Date(deadline).getTime()
  const now = Date.now()
  const total = end - start
  if (total <= 0) return 'ok'
  const elapsedRatio = (now - start) / total
  if (elapsedRatio >= 2) return 'at_risk'
  if (elapsedRatio >= 1) return 'breach'
  if (elapsedRatio >= 0.75) return 'warning'
  return 'ok'
}

export function hoursRemaining(deadline: string | null): number | null {
  if (!deadline) return null
  return (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60)
}

export function formatSlaLabel(deadline: string | null): string {
  if (!deadline) return 'No SLA'
  const hrs = hoursRemaining(deadline)
  if (hrs === null) return 'No SLA'
  if (hrs < 0) {
    const overdue = Math.abs(hrs)
    if (overdue < 24) return `${Math.round(overdue)}h overdue`
    return `${Math.round(overdue / 24)}d overdue`
  }
  if (hrs < 24) return `${Math.round(hrs)}h left`
  return `${Math.round(hrs / 24)}d left`
}
