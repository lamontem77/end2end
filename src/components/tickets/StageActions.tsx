import { useState } from 'react'
import { toast } from 'sonner'
import type { Candidate } from '../../types'
import { useStore } from '../../store/useStore'

const RECOMMENDATIONS = [
  { value: 'strong_yes', label: 'Strong Yes' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'strong_no', label: 'Strong No' },
] as const

function ScorecardForm({ onSubmit }: { onSubmit: (rec: (typeof RECOMMENDATIONS)[number]['value'], notes: string) => void }) {
  const [rec, setRec] = useState<(typeof RECOMMENDATIONS)[number]['value']>('yes')
  const [notes, setNotes] = useState('')
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
      <select value={rec} onChange={(e) => setRec(e.target.value as typeof rec)} className="input">
        {RECOMMENDATIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Scorecard notes…" rows={2} className="input resize-none" />
      <button
        onClick={() => {
          onSubmit(rec, notes)
          setNotes('')
        }}
        className="self-end rounded-button bg-accent px-3 py-1.5 text-meta font-medium text-white hover:bg-accent-hover"
      >
        Submit Scorecard
      </button>
    </div>
  )
}

function ActionButton({ children, onClick, variant = 'primary' }: { children: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger' }) {
  const cls =
    variant === 'primary'
      ? 'bg-accent text-white hover:bg-accent-hover'
      : variant === 'danger'
        ? 'bg-danger/15 text-danger hover:bg-danger/25'
        : 'border border-border text-text-primary hover:bg-surface-elevated'
  return (
    <button onClick={onClick} className={`rounded-button px-3 py-1.5 text-meta font-medium transition-colors duration-micro ${cls}`}>
      {children}
    </button>
  )
}

export function StageActions({ candidate }: { candidate: Candidate }) {
  const moveToStage = useStore((s) => s.moveToStage)
  const requestScheduling = useStore((s) => s.requestScheduling)
  const simulateCandidateReply = useStore((s) => s.simulateCandidateReply)
  const simulateAssessmentComplete = useStore((s) => s.simulateAssessmentComplete)
  const simulateCandidateSignsOffer = useStore((s) => s.simulateCandidateSignsOffer)
  const createAgentDraft = useStore((s) => s.createAgentDraft)
  const submitScorecard = useStore((s) => s.submitScorecard)
  const hmDecision = useStore((s) => s.hmDecision)
  const hmApproveOffer = useStore((s) => s.hmApproveOffer)
  const rejectCandidate = useStore((s) => s.rejectCandidate)
  const pendingAction = useStore((s) => s.pendingCandidateActions[candidate.id])
  const agentDrafts = useStore((s) => s.agentDrafts)

  const hasPendingDraft = agentDrafts.some((d) => d.candidateId === candidate.id && d.status === 'pending')
  const isRejected = candidate.tags.includes('Rejected')

  if (isRejected) {
    return <div className="text-meta text-text-secondary">This candidate has been marked rejected.</div>
  }

  const rejectLink = (
    <button onClick={() => rejectCandidate(candidate.id)} className="text-caption text-text-muted hover:text-danger">
      Reject candidate
    </button>
  )

  const wrap = (content: React.ReactNode) => (
    <div className="flex flex-col gap-2">
      {content}
      <div>{rejectLink}</div>
    </div>
  )

  if (hasPendingDraft) {
    return wrap(<div className="text-meta text-text-secondary">A draft is waiting for approval in the Approvals Queue.</div>)
  }

  if (pendingAction) {
    return wrap(
      <div className="flex flex-col gap-2">
        <div className="text-meta text-text-secondary">Waiting on candidate to reply with availability…</div>
        <ActionButton onClick={() => simulateCandidateReply(candidate.id)} variant="secondary">
          Simulate: Candidate replied with times
        </ActionButton>
      </div>,
    )
  }

  switch (candidate.currentStage) {
    case 'Applied':
      return wrap(<ActionButton onClick={() => moveToStage(candidate.id, 'Screening Scheduled', 'You')}>Advance to Screening</ActionButton>)

    case 'Screening Scheduled':
    case 'Round N Scheduling':
      return wrap(
        <div className="flex gap-2">
          <ActionButton onClick={() => requestScheduling(candidate.id, 'manual')}>Request Availability</ActionButton>
          <ActionButton variant="secondary" onClick={() => requestScheduling(candidate.id, 'self_schedule')}>
            Self-Schedule
          </ActionButton>
        </div>,
      )

    case 'Phone Screen':
      return wrap(
        <ScorecardForm
          onSubmit={(rec, notes) => {
            toast.success('Scorecard submitted')
            useStore.getState().addNote(candidate.id, `Phone screen scorecard: ${rec.replace('_', ' ')} — ${notes || 'No additional notes'}`)
            moveToStage(candidate.id, 'Assessment to Send', 'You')
          }}
        />,
      )

    case 'Assessment to Send':
      return wrap(<ActionButton onClick={() => createAgentDraft(candidate.id, 'assessment_send')}>Send Assessment</ActionButton>)

    case 'Assessment Pending':
      return wrap(
        <ActionButton variant="secondary" onClick={() => simulateAssessmentComplete(candidate.id)}>
          Simulate: Candidate completes assessment
        </ActionButton>,
      )

    case 'Assessment Review':
      return wrap(<ActionButton onClick={() => moveToStage(candidate.id, 'Round N Scheduling', 'You')}>Advance to Round 1 Scheduling</ActionButton>)

    case 'Round N In Progress':
      return wrap(<ActionButton onClick={() => moveToStage(candidate.id, 'Pending Feedback', 'You')}>Mark Interview Complete</ActionButton>)

    case 'Pending Feedback': {
      const round = candidate.interviewRounds[candidate.interviewRounds.length - 1]
      if (!round) return wrap(<div className="text-meta text-text-secondary">No interview round on file.</div>)
      return wrap(
        <ScorecardForm
          onSubmit={(rec, notes) => {
            submitScorecard(candidate.id, round.id, rec, notes)
            toast.success('Scorecard submitted — advanced to Debrief / Decision')
          }}
        />,
      )
    }

    case 'Debrief / Decision':
      return wrap(
        <div className="flex gap-2">
          <ActionButton onClick={() => hmDecision(candidate.id, 'advance')}>Advance to Offer</ActionButton>
          <ActionButton variant="danger" onClick={() => hmDecision(candidate.id, 'reject')}>
            Reject
          </ActionButton>
        </div>,
      )

    case 'Offer Prep':
      return wrap(<div className="text-meta text-text-secondary">Agent is drafting the offer letter — review it in Scheduling → Approvals.</div>)

    case 'Offer Pending Approval':
      return wrap(<ActionButton onClick={() => hmApproveOffer(candidate.id)}>Approve Offer Terms</ActionButton>)

    case 'Offer Extended':
      return wrap(
        <ActionButton variant="secondary" onClick={() => simulateCandidateSignsOffer(candidate.id)}>
          Simulate: Candidate signs offer
        </ActionButton>,
      )

    case 'Offer Accepted':
      return wrap(<div className="text-meta text-success">Graduated to New Hire Tracker.</div>)

    default:
      return wrap(null)
  }
}
