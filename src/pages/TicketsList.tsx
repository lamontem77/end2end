import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ViewSwitcher } from '../components/tickets/ViewSwitcher'
import { Avatar } from '../components/ui/Avatar'
import { slaState, formatSlaLabel } from '../lib/stageEngine'
import { STAGES } from '../types'
import type { Stage, Priority } from '../types'

const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s, i])) as Record<string, number>
const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, priority: 1, standard: 2 }
const SLA_ORDER: Record<string, number> = { breach: 0, at_risk: 0, warning: 1, ok: 2 }

const GROUPS: { key: string; label: string; stages: Stage[] }[] = [
  {
    key: 'screening',
    label: 'Screening',
    stages: ['Applied', 'Screening Scheduled', 'Phone Screen'],
  },
  {
    key: 'assessment',
    label: 'Assessment',
    stages: ['Assessment to Send', 'Assessment Pending', 'Assessment Review'],
  },
  {
    key: 'interviews',
    label: 'Interviews',
    stages: ['Round N Scheduling', 'Round N In Progress', 'Pending Feedback', 'Debrief / Decision'],
  },
  {
    key: 'offer',
    label: 'Offer',
    stages: ['Offer Prep', 'Offer Pending Approval', 'Offer Extended'],
  },
  {
    key: 'accepted',
    label: 'Accepted',
    stages: ['Offer Accepted'],
  },
]

export function TicketsList() {
  const allCandidates = useStore((s) => s.candidates)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)
  const [search, setSearch] = useState('')

  const candidates = useMemo(() => {
    const q = search.toLowerCase()
    return allCandidates
      .filter((c) => !c.tags.includes('Rejected'))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.department.toLowerCase().includes(q))
  }, [allCandidates, search])

  const total = candidates.length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-heading font-semibold text-text-primary">Pipeline</h1>
          <p className="text-meta text-text-secondary">{total} active candidate{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-8 w-44 rounded-button border border-border bg-surface pl-8 pr-3 text-meta text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <ViewSwitcher />
        </div>
      </div>

      {/* Grouped table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {GROUPS.map((group) => {
          const rows = candidates
            .filter((c) => (group.stages as string[]).includes(c.currentStage))
            .sort((a, b) => {
              const si = (STAGE_IDX[a.currentStage] ?? 99) - (STAGE_IDX[b.currentStage] ?? 99)
              if (si !== 0) return si
              const sa = slaState(a.slaDeadline, a.stageEnteredAt)
              const sb = slaState(b.slaDeadline, b.stageEnteredAt)
              const ss = (SLA_ORDER[sa] ?? 2) - (SLA_ORDER[sb] ?? 2)
              if (ss !== 0) return ss
              return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
            })

          if (rows.length === 0) return null

          return (
            <div key={group.key} className="mb-5">
              {/* Group header */}
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <span className="text-caption font-semibold uppercase tracking-wider text-text-muted">
                  {group.label}
                </span>
                <span className="rounded-full bg-surface-elevated px-1.5 py-0.5 text-caption text-text-muted">
                  {rows.length}
                </span>
              </div>

              <table className="w-full border-separate border-spacing-y-px">
                <tbody>
                  {rows.map((c) => {
                    const sla = slaState(c.slaDeadline, c.stageEnteredAt)
                    const slaColor =
                      sla === 'breach' || sla === 'at_risk'
                        ? 'text-danger font-medium'
                        : sla === 'warning'
                          ? 'text-warning'
                          : 'text-text-muted'

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidate(c.id)}
                        className="group cursor-pointer"
                      >
                        {/* Name */}
                        <td className="w-[200px] rounded-l-card bg-surface px-3 py-2.5 group-hover:bg-surface-elevated">
                          <span className="text-meta font-medium text-text-primary">{c.name}</span>
                        </td>
                        {/* Role */}
                        <td className="bg-surface px-3 py-2.5 text-meta text-text-secondary group-hover:bg-surface-elevated">
                          {c.role}
                        </td>
                        {/* Stage */}
                        <td className="w-[180px] bg-surface px-3 py-2.5 text-caption text-text-muted group-hover:bg-surface-elevated">
                          {c.currentStage}
                        </td>
                        {/* Assignee */}
                        <td className="w-10 bg-surface px-3 py-2.5 group-hover:bg-surface-elevated">
                          <Avatar userId={c.currentAssigneeId} size={20} />
                        </td>
                        {/* SLA */}
                        <td className={`w-[110px] bg-surface px-3 py-2.5 text-caption group-hover:bg-surface-elevated ${slaColor}`}>
                          {c.slaDeadline ? formatSlaLabel(c.slaDeadline) : '—'}
                        </td>
                        {/* Priority */}
                        <td className="w-[70px] rounded-r-card bg-surface px-3 py-2.5 group-hover:bg-surface-elevated">
                          {c.priority !== 'standard' && (
                            <span
                              className={`text-caption font-semibold uppercase tracking-wide ${
                                c.priority === 'urgent' ? 'text-danger' : 'text-warning'
                              }`}
                            >
                              {c.priority}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}

        {candidates.length === 0 && (
          <div className="flex h-40 items-center justify-center text-meta text-text-muted">
            No candidates match your search.
          </div>
        )}
      </div>
    </div>
  )
}
