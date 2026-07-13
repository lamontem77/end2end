import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { X, FileText, ClipboardList, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Avatar'
import { SlaBadge } from '../ui/SlaBadge'
import { PriorityTag } from '../ui/PriorityTag'
import { StageActions } from './StageActions'
import { nextActionFor } from '../../lib/nextAction'

export function TicketDrawer({ candidateId }: { candidateId: string }) {
  const candidate = useStore((s) => s.candidateById(candidateId))
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)
  const assignee = useStore((s) => (candidate ? s.userById(candidate.currentAssigneeId) : undefined))
  const addNote = useStore((s) => s.addNote)
  const [note, setNote] = useState('')

  if (!candidate) return null
  const action = nextActionFor(candidate)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedCandidate(null)} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-surface-elevated shadow-card-hover animate-[slide-in_0.25s_ease]">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-subhead font-semibold text-text-primary">{candidate.name}</h2>
              <PriorityTag priority={candidate.priority} />
            </div>
            <div className="text-meta text-text-secondary">
              {candidate.role} · {candidate.department}
            </div>
            <div className="text-caption text-text-muted">
              Applied via {candidate.source} · {format(new Date(candidate.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
          <button onClick={() => setSelectedCandidate(null)} className="rounded-button p-1 text-text-secondary hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-border bg-surface p-3">
              <div className="text-caption font-medium uppercase tracking-wide text-text-muted">Current Stage</div>
              <div className="mt-1 text-body font-medium text-text-primary">{candidate.currentStage}</div>
            </div>
            <div className="rounded-card border border-border bg-surface p-3">
              <div className="text-caption font-medium uppercase tracking-wide text-text-muted">Assignee</div>
              <div className="mt-1 flex items-center gap-1.5">
                <Avatar userId={candidate.currentAssigneeId} size={18} />
                <span className="text-body font-medium text-text-primary">{assignee?.name}</span>
              </div>
              <div className="mt-1">
                <SlaBadge deadline={candidate.slaDeadline} stageEnteredAt={candidate.stageEnteredAt} />
              </div>
            </div>
          </div>

          {action && (
            <div className="mt-4">
              <SectionHeading>Next Action</SectionHeading>
              <div className="rounded-card border border-accent/30 bg-accent/5 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-body font-medium text-accent">
                  <Zap className="h-4 w-4" /> {action}
                </div>
                <StageActions candidate={candidate} />
              </div>
            </div>
          )}

          {candidate.interviewRounds.length > 0 && (
            <div className="mt-4">
              <SectionHeading>Interview Rounds</SectionHeading>
              <div className="flex flex-col gap-2">
                {candidate.interviewRounds.map((r) => (
                  <div key={r.id} className="rounded-card border border-border bg-surface p-3 text-meta">
                    <div className="font-medium text-text-primary">
                      Round {r.roundNumber} · {formatScheduledAt(r.scheduledAt)} · {r.interviewerName}
                    </div>
                    <div className="mt-1 text-text-secondary">
                      Feedback: {r.feedbackStatus === 'pending' ? '⏳ Pending' : '✅ Submitted'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <SectionHeading>Timeline</SectionHeading>
            <div className="flex flex-col gap-2 border-l border-border pl-3">
              {candidate.activityLog
                .slice()
                .reverse()
                .map((e) => (
                  <div key={e.id} className="relative">
                    <span className="absolute -left-[15px] top-1.5 h-1.5 w-1.5 rounded-full bg-text-muted" />
                    <div className="text-meta text-text-primary">{e.label}</div>
                    <div className="text-caption text-text-muted">
                      {e.actor ? `${e.actor} · ` : ''}
                      {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4">
            <SectionHeading>Notes</SectionHeading>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && note.trim()) {
                      addNote(candidate.id, note.trim())
                      setNote('')
                    }
                  }}
                  placeholder="+ Add note…"
                  className="input"
                />
              </div>
              {candidate.notes
                .slice()
                .reverse()
                .map((n) => (
                  <div key={n.id} className="rounded-card border border-border bg-surface p-2.5 text-meta">
                    <div className="text-text-primary">{n.content}</div>
                    <div className="mt-1 text-caption text-text-muted">
                      {n.author} · {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mb-2 mt-4">
            <SectionHeading>Attachments</SectionHeading>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-tag bg-surface px-2.5 py-1.5 text-caption text-text-secondary">
                <FileText className="h-3.5 w-3.5" /> Resume
              </span>
              {candidate.scorecards.map((sc) => (
                <span key={sc.id} className="flex items-center gap-1.5 rounded-tag bg-surface px-2.5 py-1.5 text-caption text-text-secondary">
                  <ClipboardList className="h-3.5 w-3.5" /> Scorecard ({sc.recommendation.replace('_', ' ')})
                </span>
              ))}
              {candidate.assessmentStatus !== 'not_sent' && (
                <span className="flex items-center gap-1.5 rounded-tag bg-surface px-2.5 py-1.5 text-caption text-text-secondary">
                  <ClipboardList className="h-3.5 w-3.5" /> Assessment ({candidate.assessmentStatus.replace('_', ' ')})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function formatScheduledAt(value?: string): string {
  if (!value) return 'TBD'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return value
  return format(parsed, "MMM d 'at' h:mm a")
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 mt-4 text-caption font-semibold uppercase tracking-wide text-text-muted first:mt-0">{children}</div>
}
