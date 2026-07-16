import { Draggable } from '@hello-pangea/dnd'
import { AlertCircle, Zap } from 'lucide-react'
import type { Candidate } from '../../types'
import { slaState } from '../../lib/stageEngine'
import { SUB_STATUS_LABEL, subStatusUrgency } from '../../lib/subStatus'
import { statusLine } from '../../lib/statusLine'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Avatar'
import { PriorityTag } from '../ui/PriorityTag'
import { SlaBadge } from '../ui/SlaBadge'

const BORDER: Record<string, string> = {
  ok: 'border-l-border',
  warning: 'border-l-warning',
  breach: 'border-l-danger',
  at_risk: 'border-l-danger',
}

function daysInStage(stageEnteredAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)))
}

export function CandidateCard({ candidate, index }: { candidate: Candidate; index: number }) {
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)
  const agentDrafts = useStore((s) => s.agentDrafts)
  const users = useStore((s) => s.users)
  const assignee = useStore((s) => s.userById(candidate.currentAssigneeId))
  const state = slaState(candidate.slaDeadline, candidate.stageEnteredAt)
  const hasPendingDraft = agentDrafts.some((d) => d.candidateId === candidate.id && d.status === 'pending')
  const borderClass = hasPendingDraft ? 'border-l-accent' : BORDER[state]
  const tint = state === 'breach' || state === 'at_risk' ? 'bg-danger/[0.04]' : ''

  const sl = statusLine(candidate, users)
  const action = sl.nextAction

  // Active round sub-status chip
  const isRoundStage = candidate.currentStage === 'Round N Scheduling' || candidate.currentStage === 'Round N In Progress' || candidate.currentStage === 'Pending Feedback' || candidate.currentStage === 'Debrief / Decision'
  const activeRound = isRoundStage ? (candidate.interviewRounds.find((r) => !r.roundCompletedAt) ?? candidate.interviewRounds[candidate.interviewRounds.length - 1]) : null
  const subStatusLabel = activeRound ? SUB_STATUS_LABEL[activeRound.subStatus] : null
  const subStatusColor = activeRound ? subStatusUrgency(activeRound) : null

  return (
    <Draggable draggableId={candidate.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => setSelectedCandidate(candidate.id)}
          className={`mb-2 cursor-pointer rounded-card border border-border border-l-[3px] ${borderClass} ${tint} bg-surface p-3 shadow-card transition-all duration-micro hover:-translate-y-px hover:border-text-muted hover:shadow-card-hover ${
            snapshot.isDragging ? 'rotate-1 shadow-card-hover' : ''
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <PriorityTag priority={candidate.priority} />
            <span className="text-caption text-text-secondary">{daysInStage(candidate.stageEnteredAt)}d in stage</span>
          </div>

          <div className="text-label font-semibold text-text-primary">{candidate.name}</div>
          <div className="text-meta text-text-secondary">{candidate.role}</div>

          {subStatusLabel && (
            <div className={`mt-1.5 inline-flex items-center gap-1 rounded-tag px-1.5 py-0.5 text-caption font-medium ${subStatusColor === 'amber' ? 'bg-warning/10 text-warning' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'}`}>
              {subStatusLabel}
            </div>
          )}

          {action && (
            <div className={`mt-1.5 inline-flex items-center gap-1 rounded-tag px-1.5 py-1 text-caption font-medium ${sl.stalled ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
              {sl.stalled ? <AlertCircle className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              {action}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Avatar userId={candidate.currentAssigneeId} size={20} />
              <span className="text-caption text-text-secondary">{assignee?.name}</span>
            </div>
            <SlaBadge deadline={candidate.slaDeadline} stageEnteredAt={candidate.stageEnteredAt} />
          </div>
        </div>
      )}
    </Draggable>
  )
}
