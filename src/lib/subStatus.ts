import type { InterviewRound, SubStatus, User } from '../types'

// Per-sub-status SLA config (v2 spec, Phase 1). Configurable, business-day
// aware — a "2 business day" SLA started on a Friday affords the weekend,
// same as a human coordinator would expect.
export const SUB_STATUS_SLA_BUSINESS_DAYS: Partial<Record<SubStatus, number>> = {
  needs_scheduling: 2,
  awaiting_feedback: 2,
  feedback_complete: 1,
  // availability_requested and scheduled have their own logic below —
  // the former nudges/escalates on its own schedule, the latter has no
  // SLA pressure at all (it's just a countdown to the interview date).
}

export const NUDGE_AFTER_BUSINESS_DAYS = 2
export const ESCALATE_AFTER_BUSINESS_DAYS = 4

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay()
  return day === 0 || day === 6
}

/** Adds N business days (skipping Sat/Sun) to a date, at the same time of day. */
export function addBusinessDays(from: string | Date, days: number): Date {
  const result = new Date(from)
  let remaining = days
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1)
    if (!isWeekend(result)) remaining--
  }
  return result
}

/** Elapsed business days between two dates (partial days truncated down). */
export function businessDaysElapsed(from: string, to: Date = new Date()): number {
  let count = 0
  const cursor = new Date(from)
  cursor.setUTCHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setUTCHours(0, 0, 0, 0)
  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    if (!isWeekend(cursor)) count++
  }
  return count
}

export type SubStatusSlaState = 'ok' | 'warning' | 'breach'

/** Deadline for sub-statuses with a flat SLA (needs_scheduling / awaiting_feedback / feedback_complete). */
export function subStatusDeadline(round: InterviewRound): Date | null {
  const days = SUB_STATUS_SLA_BUSINESS_DAYS[round.subStatus]
  if (days === undefined) return null
  const anchor = round.subStatus === 'needs_scheduling' ? round.createdAt : round.subStatus === 'awaiting_feedback' ? round.interviewCompletedAt : round.feedbackCompletedAt
  if (!anchor) return null
  return addBusinessDays(anchor, days)
}

export function subStatusSlaState(round: InterviewRound, now: Date = new Date()): SubStatusSlaState {
  const deadline = subStatusDeadline(round)
  if (!deadline) return 'ok'
  const anchor = round.subStatus === 'needs_scheduling' ? round.createdAt : round.subStatus === 'awaiting_feedback' ? round.interviewCompletedAt : round.feedbackCompletedAt
  if (!anchor) return 'ok'
  const total = deadline.getTime() - new Date(anchor).getTime()
  const elapsed = now.getTime() - new Date(anchor).getTime()
  if (total <= 0) return 'ok'
  const ratio = elapsed / total
  if (ratio >= 1) return 'breach'
  if (ratio >= 0.75) return 'warning'
  return 'ok'
}

export type CandidateReplyUrgency = 'waiting' | 'nudge_due' | 'escalate'

/** Where a candidate's reply stands against the nudge/escalate thresholds. */
export function candidateReplyUrgency(round: InterviewRound, now: Date = new Date()): CandidateReplyUrgency {
  if (!round.requestSentAt) return 'waiting'
  const elapsed = businessDaysElapsed(round.requestSentAt, now)
  if (elapsed >= ESCALATE_AFTER_BUSINESS_DAYS) return 'escalate'
  if (elapsed >= NUDGE_AFTER_BUSINESS_DAYS) return 'nudge_due'
  return 'waiting'
}

/** Owner-facing role text for a round's current sub-status. Feeds the card chip and statusLine. */
export function subStatusOwnerId(round: InterviewRound, candidate: { rcId: string; recruiterId: string }): string | null {
  switch (round.subStatus) {
    case 'needs_scheduling':
      return candidate.rcId
    case 'availability_requested':
      return candidateReplyUrgency(round) === 'escalate' ? candidate.rcId : null // candidate owns it until escalation
    case 'scheduled':
      return null // nobody owes an action — just waiting for the date
    case 'awaiting_feedback':
      return round.interviewers.find((i) => i.status === 'pending')?.interviewerId ?? null
    case 'feedback_complete':
      return candidate.recruiterId
  }
}

/** Amber = someone owes an action right now. Teal/neutral = a waiting state. */
export function subStatusUrgency(round: InterviewRound): 'amber' | 'teal' {
  if (round.subStatus === 'needs_scheduling' || round.subStatus === 'awaiting_feedback' || round.subStatus === 'feedback_complete') return 'amber'
  if (round.subStatus === 'availability_requested' && candidateReplyUrgency(round) === 'escalate') return 'amber'
  return 'teal'
}

export const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  needs_scheduling: 'Needs scheduling',
  availability_requested: 'Awaiting candidate availability',
  scheduled: 'Scheduled',
  awaiting_feedback: 'Awaiting feedback',
  feedback_complete: 'Awaiting decision',
}

export function pendingInterviewerNames(round: InterviewRound): string[] {
  return round.interviewers.filter((i) => i.status === 'pending').map((i) => i.interviewerName)
}

export function submittedCount(round: InterviewRound): { submitted: number; total: number } {
  return { submitted: round.interviewers.filter((i) => i.status === 'submitted').length, total: round.interviewers.length }
}

export function userName(users: User[], id: string | null | undefined): string | null {
  if (!id) return null
  return users.find((u) => u.id === id)?.name ?? null
}
