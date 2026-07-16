import { AlertTriangle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ViewSwitcher } from '../components/tickets/ViewSwitcher'
import { slaState, formatSlaLabel } from '../lib/stageEngine'
import { statusLine } from '../lib/statusLine'
import { Avatar } from '../components/ui/Avatar'
import { PriorityTag } from '../components/ui/PriorityTag'

export function AtRisk() {
  const allCandidates = useStore((s) => s.candidates)
  const users = useStore((s) => s.users)
  const candidates = allCandidates.filter((c) => !c.tags.includes('Rejected'))
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)

  const risky = candidates
    .map((c) => {
      const state = slaState(c.slaDeadline, c.stageEnteredAt)
      const sl = statusLine(c, users)
      return { c, state, stalled: sl.stalled }
    })
    .filter(({ state, stalled }) => state === 'breach' || state === 'at_risk' || stalled)
    .sort((a, b) => {
      if (a.state === 'at_risk' && b.state !== 'at_risk') return -1
      if (b.state === 'at_risk' && a.state !== 'at_risk') return 1
      if (a.state === 'breach' && b.state !== 'breach') return -1
      if (b.state === 'breach' && a.state !== 'breach') return 1
      return 0
    })

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="flex items-center gap-2 text-subhead font-semibold text-text-primary sm:text-heading">
            <AlertTriangle className="h-6 w-6 text-danger" /> At Risk
          </h1>
          <p className="text-meta text-text-secondary">SLA-breached and escalated tickets only.</p>
        </div>
        <ViewSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {risky.length === 0 && (
          <div className="rounded-card border border-dashed border-border px-4 py-10 text-center text-meta text-text-muted">
            Nothing at risk right now.
          </div>
        )}
        <div className="flex flex-col gap-2">
          {risky.map(({ c, state, stalled }) => (
            <button
              key={c.id}
              onClick={() => setSelectedCandidate(c.id)}
              className={`flex items-center justify-between rounded-card border-l-[3px] border border-border bg-surface px-4 py-3 text-left transition-colors duration-micro hover:bg-surface-elevated ${
                state === 'at_risk' ? 'border-l-danger bg-danger/5' : stalled ? 'border-l-warning bg-warning/5' : 'border-l-danger'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar userId={c.currentAssigneeId} size={22} />
                <div>
                  <div className="flex items-center gap-2 text-meta font-medium text-text-primary">
                    {c.name} <PriorityTag priority={c.priority} />
                  </div>
                  <div className="text-caption text-text-muted">
                    {c.currentStage} · {c.role}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {stalled && state !== 'breach' && state !== 'at_risk' ? (
                  <div className="text-meta font-semibold text-warning">No next step</div>
                ) : (
                  <div className="text-meta font-semibold text-danger">{formatSlaLabel(c.slaDeadline)}</div>
                )}
                {state === 'at_risk' && <div className="text-caption text-danger">Escalated to TA Lead</div>}
                {stalled && <div className="text-caption text-warning">Stalled — needs attention</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
