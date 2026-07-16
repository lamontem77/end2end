import { Download, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { useStore } from '../store/useStore'
import { statusLine } from '../lib/statusLine'
import { buildCsvExport, downloadCsv } from '../lib/csvExport'

export function Reports() {
  const candidates = useStore((s) => s.candidates)
  const users = useStore((s) => s.users)
  const trackers = useStore((s) => s.newHireTrackers)

  const active = candidates.filter((c) => !c.tags.includes('Rejected'))
  const stalled = active.filter((c) => statusLine(c, users, trackers[c.id]).stalled)
  const byStage = active.reduce<Record<string, number>>((acc, c) => {
    acc[c.currentStage] = (acc[c.currentStage] ?? 0) + 1
    return acc
  }, {})

  function handleExport() {
    const csv = buildCsvExport(candidates, users, trackers)
    downloadCsv(csv, `pipeline-export-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="flex items-center gap-2 text-subhead font-semibold text-text-primary sm:text-heading">
            <TrendingUp className="h-6 w-6 text-accent" /> Pipeline Report
          </h1>
          <p className="text-meta text-text-secondary">Live snapshot — computed from stage, sub-status, and SLA data.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-button border border-border bg-surface px-3 py-2 text-meta font-medium text-text-primary transition-colors hover:bg-surface-elevated"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Active Candidates" value={active.length} />
          <StatCard label="Stalled (no next step)" value={stalled.length} accent="warning" />
          <StatCard label="In Round Stages" value={active.filter((c) => ['Round N Scheduling', 'Round N In Progress', 'Pending Feedback', 'Debrief / Decision'].includes(c.currentStage)).length} />
          <StatCard label="Offer / Onboarding" value={active.filter((c) => ['Offer Prep', 'Offer Pending Approval', 'Offer Extended', 'Offer Accepted'].includes(c.currentStage)).length} accent="accent" />
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-body font-semibold text-text-primary">Stage Breakdown</h2>
          <div className="rounded-card border border-border bg-surface">
            {Object.entries(byStage)
              .sort((a, b) => b[1] - a[1])
              .map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-0">
                  <span className="text-meta text-text-primary">{stage}</span>
                  <span className="text-meta font-semibold text-text-secondary">{count}</span>
                </div>
              ))}
            {Object.keys(byStage).length === 0 && (
              <div className="px-4 py-6 text-center text-meta text-text-muted">No active candidates.</div>
            )}
          </div>
        </div>

        <div className="rounded-card border border-dashed border-border px-4 py-8 text-center text-meta text-text-muted">
          Time-to-fill, stage conversion, SLA compliance, and recruiter throughput charts are coming in a future release.
          <br />
          <button onClick={handleExport} className="mt-3 inline-flex items-center gap-1.5 text-accent hover:underline">
            <Download className="h-3.5 w-3.5" /> Export full pipeline CSV
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'accent' | 'warning' }) {
  const color = accent === 'accent' ? 'text-accent' : accent === 'warning' ? 'text-warning' : 'text-text-primary'
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="text-caption text-text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
