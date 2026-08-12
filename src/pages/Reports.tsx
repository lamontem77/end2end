import { useMemo } from 'react'
import { Download } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { useStore } from '../store/useStore'
import { slaState, formatSlaLabel } from '../lib/stageEngine'
import { buildCsvExport, downloadCsv } from '../lib/csvExport'
import type { Stage } from '../types'

const FUNNEL: { key: string; label: string; stages: Set<Stage> }[] = [
  { key: 'screening',  label: 'Screening',  stages: new Set(['Applied', 'Screening Scheduled', 'Phone Screen']) },
  { key: 'assessment', label: 'Assessment', stages: new Set(['Assessment to Send', 'Assessment Pending', 'Assessment Review']) },
  { key: 'interviews', label: 'Interviews', stages: new Set(['Round N Scheduling', 'Round N In Progress', 'Pending Feedback', 'Debrief / Decision']) },
  { key: 'offer',      label: 'Offer',      stages: new Set(['Offer Prep', 'Offer Pending Approval', 'Offer Extended']) },
  { key: 'accepted',   label: 'Accepted',   stages: new Set(['Offer Accepted']) },
]

export function Reports() {
  const candidates = useStore((s) => s.candidates)
  const users      = useStore((s) => s.users)
  const agentDrafts = useStore((s) => s.agentDrafts)
  const trackers   = useStore((s) => s.newHireTrackers)
  const setSelected = useStore((s) => s.setSelectedCandidate)

  const active = useMemo(() => candidates.filter((c) => !c.tags.includes('Rejected')), [candidates])

  const atRisk = useMemo(
    () =>
      active.filter((c) => {
        const s = slaState(c.slaDeadline, c.stageEnteredAt)
        return s === 'breach' || s === 'at_risk'
      }),
    [active],
  )

  const pendingApprovals = useMemo(
    () => agentDrafts.filter((d) => d.status === 'pending').length,
    [agentDrafts],
  )

  const avgDays = useMemo(() => {
    if (!active.length) return 0
    const total = active.reduce(
      (sum, c) => sum + differenceInDays(new Date(), new Date(c.stageEnteredAt)),
      0,
    )
    return Math.round(total / active.length)
  }, [active])

  const funnelCounts = useMemo(
    () => FUNNEL.map((g) => ({ ...g, count: active.filter((c) => g.stages.has(c.currentStage)).length })),
    [active],
  )
  const maxCount = Math.max(...funnelCounts.map((f) => f.count), 1)

  const byRole = useMemo(() => {
    const map = new Map<string, { total: number; atRisk: number }>()
    for (const c of active) {
      const entry = map.get(c.role) ?? { total: 0, atRisk: 0 }
      entry.total++
      const s = slaState(c.slaDeadline, c.stageEnteredAt)
      if (s === 'breach' || s === 'at_risk') entry.atRisk++
      map.set(c.role, entry)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total)
  }, [active])

  function handleExport() {
    downloadCsv(
      buildCsvExport(candidates, users, trackers),
      `pipeline-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-heading font-semibold text-text-primary">Reports</h1>
          <p className="text-meta text-text-secondary">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-button border border-border bg-surface px-3 py-2 text-meta text-text-secondary hover:bg-surface-elevated"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* KPI tiles */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Active candidates" value={active.length} />
          <KpiTile label="Overdue / at risk" value={atRisk.length} variant={atRisk.length > 0 ? 'danger' : 'default'} />
          <KpiTile label="Pending approvals" value={pendingApprovals} variant={pendingApprovals > 0 ? 'accent' : 'default'} />
          <KpiTile label="Avg days in stage" value={`${avgDays}d`} />
        </div>

        {/* Two-column: Funnel + At-risk */}
        <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* Pipeline funnel */}
          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="mb-4 text-meta font-semibold text-text-primary">Pipeline Funnel</h2>
            <div className="flex flex-col gap-3">
              {funnelCounts.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-right text-caption text-text-muted">{f.label}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 overflow-hidden rounded-full bg-surface-elevated" style={{ height: 8 }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-accent/40 transition-all"
                        style={{ width: `${(f.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 text-right text-caption font-medium text-text-primary tabular-nums">
                      {f.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue & at risk */}
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-meta font-semibold text-text-primary">Overdue & At Risk</h2>
              {atRisk.length > 0 && (
                <span className="text-caption font-medium text-danger">{atRisk.length}</span>
              )}
            </div>
            {atRisk.length === 0 ? (
              <p className="text-caption text-text-muted">Nothing overdue right now.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {atRisk.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className="flex items-start justify-between gap-2 rounded-button px-2 py-1.5 text-left hover:bg-surface-elevated"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-caption font-medium text-danger">{c.name}</div>
                      <div className="truncate text-caption text-text-muted">
                        {c.role} · {c.currentStage}
                      </div>
                    </div>
                    <span className="shrink-0 text-caption font-medium text-danger">
                      {formatSlaLabel(c.slaDeadline)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Open reqs by role */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h2 className="mb-3 text-meta font-semibold text-text-primary">Open Reqs by Role</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 text-caption font-medium text-text-muted">Role</th>
                <th className="pb-2 text-right text-caption font-medium text-text-muted">Active</th>
                <th className="pb-2 text-right text-caption font-medium text-text-muted">At Risk</th>
              </tr>
            </thead>
            <tbody>
              {byRole.map(([role, { total, atRisk: risk }]) => (
                <tr key={role} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-meta text-text-primary">{role}</td>
                  <td className="py-2 text-right text-meta tabular-nums text-text-secondary">{total}</td>
                  <td
                    className={`py-2 text-right text-meta tabular-nums ${
                      risk > 0 ? 'font-medium text-danger' : 'text-text-muted'
                    }`}
                  >
                    {risk > 0 ? risk : '—'}
                  </td>
                </tr>
              ))}
              {byRole.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-caption text-text-muted">
                    No active candidates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KpiTile({
  label,
  value,
  variant = 'default',
}: {
  label: string
  value: number | string
  variant?: 'default' | 'danger' | 'accent'
}) {
  const numColor =
    variant === 'danger' ? 'text-danger' : variant === 'accent' ? 'text-accent' : 'text-text-primary'
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3">
      <div className={`text-2xl font-bold tabular-nums ${numColor}`}>{value}</div>
      <div className="mt-0.5 text-caption text-text-muted">{label}</div>
    </div>
  )
}
