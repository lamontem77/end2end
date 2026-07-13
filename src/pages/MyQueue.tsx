import { format } from 'date-fns'
import { useStore } from '../store/useStore'
import { ViewSwitcher } from '../components/tickets/ViewSwitcher'
import { slaState, formatSlaLabel } from '../lib/stageEngine'
import { nextActionFor } from '../lib/nextAction'
import { DraftApprovalCard } from '../components/scheduling/DraftApprovalCard'

export function MyQueue() {
  const currentUser = useStore((s) => s.currentUser())
  const allCandidates = useStore((s) => s.candidates)
  const allDrafts = useStore((s) => s.agentDrafts)
  const candidates = allCandidates.filter((c) => !c.tags.includes('Rejected'))
  const drafts = allDrafts.filter((d) => d.status === 'pending')
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)

  const myDrafts = drafts.filter((d) => {
    const candidate = candidates.find((c) => c.id === d.candidateId)
    return candidate?.rcId === currentUser.id || candidate?.recruiterId === currentUser.id
  })

  const assigned = candidates.filter((c) => c.currentAssigneeId === currentUser.id && !myDrafts.some((d) => d.candidateId === c.id))
  const overdue = assigned.filter((c) => {
    const st = slaState(c.slaDeadline, c.stageEnteredAt)
    return st === 'breach' || st === 'at_risk'
  })
  const onTrack = assigned.filter((c) => !overdue.includes(c))

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-subhead font-semibold text-text-primary sm:text-heading">My Queue — {currentUser.name}</h1>
          <p className="text-meta text-text-secondary">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <ViewSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <Section title={`Needs Your Approval (${myDrafts.length})`} accent="accent">
          {myDrafts.length === 0 && <Empty text="No drafts waiting on you." />}
          <div className="flex flex-col gap-3">
            {myDrafts.map((d) => (
              <DraftApprovalCard key={d.id} draft={d} />
            ))}
          </div>
        </Section>

        <Section title={`Assigned to You (${onTrack.length})`}>
          {onTrack.length === 0 && <Empty text="Nothing else assigned to you right now." />}
          <div className="flex flex-col gap-1">
            {onTrack.map((c) => (
              <QueueRow key={c.id} candidateId={c.id} onOpen={() => setSelectedCandidate(c.id)} />
            ))}
          </div>
        </Section>

        <Section title={`Overdue (${overdue.length})`} accent="danger">
          {overdue.length === 0 && <Empty text="Nothing overdue. Nice work." />}
          <div className="flex flex-col gap-1">
            {overdue.map((c) => (
              <QueueRow key={c.id} candidateId={c.id} onOpen={() => setSelectedCandidate(c.id)} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, accent, children }: { title: string; accent?: 'accent' | 'danger'; children: React.ReactNode }) {
  const color = accent === 'accent' ? 'text-accent' : accent === 'danger' ? 'text-danger' : 'text-text-primary'
  return (
    <div className="mb-6">
      <div className={`mb-2 flex items-center gap-1.5 text-body font-semibold ${color}`}>
        {accent === 'accent' && <span>⚡</span>}
        {accent === 'danger' && <span>🔴</span>}
        {!accent && <span>📋</span>}
        {title}
      </div>
      {children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-card border border-dashed border-border px-4 py-6 text-center text-meta text-text-muted">{text}</div>
}

function QueueRow({ candidateId, onOpen }: { candidateId: string; onOpen: () => void }) {
  const candidate = useStore((s) => s.candidateById(candidateId))
  if (!candidate) return null
  const st = slaState(candidate.slaDeadline, candidate.stageEnteredAt)
  const action = nextActionFor(candidate)
  return (
    <button
      onClick={onOpen}
      className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-2.5 text-left transition-colors duration-micro hover:bg-surface-elevated"
    >
      <div>
        <div className="text-meta font-medium text-text-primary">
          {action} · <span className="text-text-secondary">{candidate.name}</span>
        </div>
        <div className="text-caption text-text-muted">{candidate.currentStage}</div>
      </div>
      <span className={`text-caption font-medium ${st === 'breach' || st === 'at_risk' ? 'text-danger' : st === 'warning' ? 'text-warning' : 'text-text-secondary'}`}>
        {formatSlaLabel(candidate.slaDeadline)}
      </span>
    </button>
  )
}
