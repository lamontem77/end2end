import { format, formatDistanceToNowStrict } from 'date-fns'
import type { Candidate, InterviewRound, NewHireTracker, User } from '../types'
import { formatSlaLabel } from './stageEngine'
import { candidateReplyUrgency, pendingInterviewerNames, subStatusDeadline, submittedCount, userName } from './subStatus'

export interface StatusLineResult {
  text: string
  lastCompleted: string | null
  currentPosition: string
  nextAction: string | null
  nextOwnerName: string | null
  nextDue: string | null
  stalled: boolean
}

function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  return format(new Date(iso), 'MMM d')
}
function fmtDateTime(iso?: string | null): string {
  if (!iso) return ''
  return format(new Date(iso), "MMM d, h:mm a")
}
function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)))
}

function activeRound(candidate: Candidate): InterviewRound | null {
  const rounds = candidate.interviewRounds
  if (rounds.length === 0) return null
  // The active round is the most recent one still in flight (no decision
  // recorded yet); if every round has a decision, the last one stands as
  // the most recently completed milestone.
  return rounds.find((r) => !r.roundCompletedAt) ?? rounds[rounds.length - 1]
}

function lastCompletedRound(candidate: Candidate): InterviewRound | null {
  const completed = candidate.interviewRounds.filter((r) => r.roundCompletedAt)
  return completed.length ? completed[completed.length - 1] : null
}

function roundMilestoneText(round: InterviewRound): string {
  const label = round.decision === 'reject' ? 'rejected' : round.decision === 'hold' ? 'held' : 'completed'
  return `Round ${round.roundNumber} ${label} ${fmtDate(round.roundCompletedAt)}`
}

// The stage a candidate just entered doubles as the timestamp the previous
// milestone was reached — "Advanced to Assessment to Send" means the phone
// screen was just completed, at that same moment.
const PREV_MILESTONE_LABEL: Partial<Record<Candidate['currentStage'], string>> = {
  'Screening Scheduled': 'Applied',
  'Phone Screen': 'Screening scheduled',
  'Assessment to Send': 'Phone screen completed',
  'Assessment Pending': 'Assessment sent',
  'Assessment Review': 'Assessment submitted',
  'Offer Prep': 'Advanced to offer',
  'Offer Pending Approval': 'Offer letter drafted',
  'Offer Extended': 'Offer approved',
  'Offer Accepted': 'Offer extended',
}

/**
 * Single source of truth for "where is this candidate, and what happens
 * next" — computed at read time from (stage, sub_status, events), never
 * stored as editable text. Used by the card, the drawer, the assistant,
 * and every export. No component should build its own version of this.
 */
export function statusLine(candidate: Candidate, users: User[], tracker?: NewHireTracker): StatusLineResult {
  const stage = candidate.currentStage
  const isRoundStage = stage === 'Round N Scheduling' || stage === 'Round N In Progress' || stage === 'Pending Feedback' || stage === 'Debrief / Decision'

  let lastCompleted: string | null = null
  let currentPosition: string = stage
  let nextAction: string | null = null
  let nextOwnerName: string | null = null
  let nextDue: string | null = null
  let stalled = false

  if (stage === 'Applied') {
    lastCompleted = null
    currentPosition = `Applied ${fmtDate(candidate.createdAt)}`
    nextAction = 'Advance to Screening'
    nextOwnerName = userName(users, candidate.recruiterId)
    nextDue = formatSlaLabel(candidate.slaDeadline)
  } else if (isRoundStage) {
    const round = activeRound(candidate)
    const prevRound = lastCompletedRound(candidate)
    lastCompleted = prevRound ? roundMilestoneText(prevRound) : `Assessment reviewed ${fmtDate(candidate.stageEnteredAt)}`

    if (!round) {
      stalled = true
      currentPosition = `${stage} — no round on file`
    } else {
      switch (round.subStatus) {
        case 'needs_scheduling': {
          currentPosition = `Round ${round.roundNumber} needs scheduling`
          nextAction = 'Send availability request'
          nextOwnerName = userName(users, candidate.rcId)
          nextDue = formatDeadline(subStatusDeadline(round))
          break
        }
        case 'availability_requested': {
          const urgency = candidateReplyUrgency(round)
          currentPosition = `Round ${round.roundNumber} awaiting candidate availability (requested ${fmtDate(round.requestSentAt)}, ${daysAgo(round.requestSentAt!)}d ago)`
          if (urgency === 'waiting') {
            nextAction = 'Candidate reply expected'
            nextOwnerName = null
          } else if (urgency === 'nudge_due') {
            nextAction = 'Nudge candidate — 2 business days with no reply'
            nextOwnerName = userName(users, candidate.rcId)
          } else {
            nextAction = 'Escalate — follow up with candidate directly'
            nextOwnerName = userName(users, candidate.rcId)
          }
          break
        }
        case 'scheduled': {
          currentPosition = `Round ${round.roundNumber} scheduled ${fmtDateTime(round.scheduledAt)}`
          const names = round.interviewers.map((i) => i.interviewerName)
          nextAction = `Interview, then feedback due from ${names.join(', ') || 'interviewer'}`
          nextOwnerName = null
          nextDue = round.scheduledAt ? `in ${formatDistanceToNowStrict(new Date(round.scheduledAt))}` : null
          break
        }
        case 'awaiting_feedback': {
          const { submitted, total } = submittedCount(round)
          const pending = pendingInterviewerNames(round)
          currentPosition = `Round ${round.roundNumber} interviewed ${fmtDate(round.interviewCompletedAt)} · Awaiting feedback (${submitted} of ${total} submitted)`
          if (pending.length === 0 && total === 0) {
            stalled = true
            nextAction = null
          } else {
            nextAction = `Pending: ${pending.join(', ')}`
            nextOwnerName = pending[0] ?? null
          }
          nextDue = formatDeadline(subStatusDeadline(round))
          break
        }
        case 'feedback_complete': {
          lastCompleted = `Round ${round.roundNumber} completed ${fmtDate(round.feedbackCompletedAt)}`
          currentPosition = 'Awaiting decision'
          nextAction = 'Make hiring decision'
          nextOwnerName = userName(users, candidate.recruiterId)
          nextDue = formatDeadline(subStatusDeadline(round))
          break
        }
      }
    }
  } else if (stage === 'Offer Accepted' && tracker) {
    lastCompleted = `Offer accepted ${fmtDate(candidate.offerDetails?.signedAt ?? candidate.stageEnteredAt)}`
    const bgcDone = tracker.backgroundCheck.status === 'clear'
    const dtDone = tracker.drugTest.status === 'clear'
    const techDone = tracker.techSetup.status === 'complete'
    if (tracker.readyToStart) {
      currentPosition = 'Ready to start'
      nextAction = `Day one: ${fmtDate(tracker.startDate)}`
      nextOwnerName = null
    } else if (tracker.backgroundCheck.status === 'not_started' && tracker.drugTest.status === 'not_started') {
      currentPosition = 'Pre-checks not yet initiated'
      nextAction = 'Initiate background check and drug test'
      nextOwnerName = userName(users, candidate.rcId)
    } else if (!bgcDone || !dtDone) {
      currentPosition = `Background check ${bgcDone ? 'clear' : 'in progress'} · Drug test ${dtDone ? 'clear' : 'in progress'}`
      nextAction = 'Awaiting pre-check results'
      nextOwnerName = 'HR Ops'
      nextDue = fmtDate(tracker.startDate) ? `due ${fmtDate(tracker.startDate)}` : null
    } else if (!techDone) {
      currentPosition = 'Pre-checks clear · Tech setup in progress'
      nextAction = 'Complete tech setup'
      nextOwnerName = 'IT'
      nextDue = `due ${fmtDate(tracker.startDate)}`
    } else {
      currentPosition = 'Finalizing onboarding'
      nextAction = 'Confirm ready to start'
      nextOwnerName = userName(users, candidate.rcId)
    }
  } else {
    // Applied/Screening/Phone Screen/Assessment stages, and Offer Accepted
    // without a tracker yet — simple stage-level treatment.
    lastCompleted = PREV_MILESTONE_LABEL[stage] ? `${PREV_MILESTONE_LABEL[stage]} ${fmtDate(candidate.stageEnteredAt)}` : null
    currentPosition = `${stage} (since ${fmtDate(candidate.stageEnteredAt)})`
    nextAction = nextActionLabel(stage)
    nextOwnerName = userName(users, candidate.currentAssigneeId)
    nextDue = formatSlaLabel(candidate.slaDeadline)
  }

  // Defensive net: every branch above sets a concrete nextAction except the
  // two explicit `stalled = true` cases (no round on file; a round awaiting
  // feedback with nobody assigned to give it) and legitimately-terminal
  // states (ready to start). If something still slipped through without an
  // owner or an action, treat it as stalled rather than silently showing
  // nothing — that's exactly the "silently stalled candidate" this line
  // exists to catch.
  if (!nextAction && !stalled && currentPosition !== 'Ready to start') {
    stalled = true
  }

  const parts = [lastCompleted, currentPosition, nextAction ? `Next: ${nextAction}${nextOwnerName ? ` (${nextOwnerName})` : ''}${nextDue ? ` — ${nextDue}` : ''}` : null].filter(Boolean)

  const text = stalled && !nextAction ? `${[lastCompleted, currentPosition].filter(Boolean).join(' · ')} · No next step assigned — needs attention` : parts.join(' · ')

  return { text, lastCompleted, currentPosition, nextAction, nextOwnerName, nextDue, stalled }
}

function formatDeadline(deadline: Date | null): string | null {
  if (!deadline) return null
  return formatSlaLabel(deadline.toISOString())
}

function nextActionLabel(stage: Candidate['currentStage']): string | null {
  switch (stage) {
    case 'Screening Scheduled':
      return 'Send availability request'
    case 'Phone Screen':
      return 'Submit phone screen scorecard'
    case 'Assessment to Send':
      return 'Send assessment'
    case 'Assessment Pending':
      return 'Awaiting candidate submission'
    case 'Assessment Review':
      return 'Review assessment results'
    case 'Offer Prep':
      return 'Approve offer letter draft'
    case 'Offer Pending Approval':
      return 'Approve offer terms'
    case 'Offer Extended':
      return 'Awaiting candidate signature'
    case 'Offer Accepted':
      return 'Graduate to New Hire Tracker'
    default:
      return null
  }
}
