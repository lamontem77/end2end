import { useState } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { historicalEvents } from '../../data/eventloop'

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

type FormatGroup = { label: string; color: string; bg: string; events: typeof historicalEvents }

function avg(vals: number[]) {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

function ComparisonChart({ groups, metric, label, format, maxVal }: {
  groups: FormatGroup[]
  metric: (g: FormatGroup) => number
  label: string
  format: (v: number) => string
  maxVal?: number
}) {
  const vals = groups.map((g) => metric(g))
  const max = maxVal ?? (Math.max(...vals) * 1.15 || 1)
  return (
    <div>
      <div className="text-caption text-text-muted mb-3">{label}</div>
      <div className="space-y-3">
        {groups.map((g, i) => {
          const val = vals[i]
          const pct = Math.min((val / max) * 100, 100)
          return (
            <div key={g.label} className="flex items-center gap-3">
              <span className="text-meta text-text-secondary w-40 shrink-0 text-right">{g.label}</span>
              <div className="flex-1 h-5 rounded bg-surface-elevated overflow-hidden relative">
                <div className={`h-full rounded ${g.bg} transition-all`} style={{ width: `${pct}%` }} />
                <span className={`absolute inset-y-0 left-2 flex items-center text-caption font-semibold ${g.color}`}>
                  {format(val)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HistoricalEventRow({ event, maxAttended }: { event: typeof historicalEvents[0]; maxAttended: number }) {
  const yield_ = event.targetTalent > 0 ? Math.round((event.qualified / event.targetTalent) * 100) : 0
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors">
      <td className="px-4 py-3">
        <div className="text-body font-medium text-text-primary whitespace-nowrap">{event.name}</div>
        <div className="text-caption text-text-muted">{event.date}</div>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-tag bg-surface-elevated border border-border px-2 py-0.5 text-caption text-text-secondary whitespace-nowrap">
          {event.format}
        </span>
      </td>
      <td className="px-4 py-3 text-caption text-text-secondary whitespace-nowrap">{event.seniority}</td>
      <td className="px-4 py-3 text-caption text-text-secondary">{event.hostType}</td>
      <td className="px-4 py-3">
        <div className="text-body font-medium text-text-primary">{event.attended}</div>
        <MetricBar value={event.attended} max={maxAttended} color="bg-text-secondary/40" />
      </td>
      <td className="px-4 py-3">
        <div className="text-body font-medium text-text-primary">{event.qualified}</div>
        <MetricBar value={event.qualified} max={10} color="bg-accent/50" />
      </td>
      <td className="px-4 py-3">
        <span className={`text-body font-semibold ${yield_ >= 30 ? 'text-success' : yield_ >= 20 ? 'text-accent' : 'text-text-secondary'}`}>
          {yield_}%
        </span>
      </td>
      <td className="px-4 py-3 text-caption text-success font-medium">{event.hires}</td>
    </tr>
  )
}

export function Insights() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const maxAttended = Math.max(...historicalEvents.map((e) => e.attended))

  const dinners = historicalEvents.filter((e) => e.format === 'Curated Dinner' || (e.format === 'Networking' && e.audienceSize < 30))
  const broadEvents = historicalEvents.filter((e) => e.format === 'Open House' || e.audienceSize > 50)
  const founderHosted = historicalEvents.filter((e) => e.hostType.toLowerCase().includes('founder'))
  const recruitingOnly = historicalEvents.filter((e) => e.hostType === 'Recruiting Only')

  const dinnersYield = dinners.length
    ? Math.round(dinners.reduce((sum, e) => sum + (e.targetTalent > 0 ? (e.qualified / e.targetTalent) * 100 : 0), 0) / dinners.length)
    : 0
  const broadYield = broadEvents.length
    ? Math.round(broadEvents.reduce((sum, e) => sum + (e.targetTalent > 0 ? (e.qualified / e.targetTalent) * 100 : 0), 0) / broadEvents.length)
    : 0
  const founderShow = founderHosted.length
    ? Math.round(founderHosted.reduce((s, e) => s + (e.rsvp > 0 ? e.attended / e.rsvp : 0), 0) / founderHosted.length * 100)
    : 0
  const recruiterShow = recruitingOnly.length
    ? Math.round(recruitingOnly.reduce((s, e) => s + (e.rsvp > 0 ? e.attended / e.rsvp : 0), 0) / recruitingOnly.length * 100)
    : 0

  const groups: FormatGroup[] = [
    { label: 'Curated Dinner', color: 'text-accent', bg: 'bg-accent/40', events: historicalEvents.filter((e) => e.format === 'Curated Dinner') },
    { label: 'Roundtable / Workshop', color: 'text-success', bg: 'bg-success/40', events: historicalEvents.filter((e) => e.format === 'Roundtable' || e.format === 'Workshop') },
    { label: 'Panel / Networking', color: 'text-warning', bg: 'bg-warning/30', events: historicalEvents.filter((e) => e.format === 'Panel' || e.format === 'Networking') },
    { label: 'Open House', color: 'text-text-secondary', bg: 'bg-text-muted/20', events: historicalEvents.filter((e) => e.format === 'Open House') },
  ].filter((g) => g.events.length > 0)

  const yieldMetric = (g: FormatGroup) => avg(g.events.map((e) => (e.targetTalent > 0 ? (e.qualified / e.targetTalent) * 100 : 0)))
  const showMetric = (g: FormatGroup) => avg(g.events.map((e) => (e.rsvp > 0 ? (e.attended / e.rsvp) * 100 : 0)))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <div>
          <h1 className="text-label font-semibold text-text-primary">Insights</h1>
          <p className="text-meta text-text-secondary mt-0.5">What the data says about your recruiting events</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-button bg-surface-elevated border border-border px-3 py-1.5 text-caption text-text-muted">
          <AlertCircle className="h-3.5 w-3.5" />
          8 historical events · Demo data
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-5">

          {/* Two key metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="text-caption text-text-muted mb-4">Qualified yield by event type</div>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-subhead font-semibold text-accent">{dinnersYield}%</span>
                  <span className="text-meta text-text-muted">curated dinners</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-subhead font-semibold text-text-secondary">{broadYield}%</span>
                  <span className="text-meta text-text-muted">open / large events</span>
                </div>
              </div>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="text-caption text-text-muted mb-4">Show rate by host type</div>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-subhead font-semibold text-accent">{founderShow}%</span>
                  <span className="text-meta text-text-muted">founder-hosted</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-subhead font-semibold text-text-secondary">{recruiterShow}%</span>
                  <span className="text-meta text-text-muted">recruiting-only</span>
                </div>
              </div>
            </div>
          </div>

          {/* Format comparison */}
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-body font-semibold text-text-primary">Format Comparison</h2>
              <span className="text-caption text-text-muted">avg across {historicalEvents.length} events</span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ComparisonChart groups={groups} metric={yieldMetric} label="Qualified Yield" format={(v) => `${Math.round(v)}%`} maxVal={60} />
              <ComparisonChart groups={groups} metric={showMetric} label="Show Rate" format={(v) => `${Math.round(v)}%`} maxVal={100} />
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-caption text-text-muted">
              <AlertCircle className="h-3 w-3" />
              Observed associations — small sample, not causal
            </div>
          </div>

          {/* Historical events (collapsible) */}
          <div className="rounded-card border border-border bg-surface overflow-hidden">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-surface-elevated transition-colors"
            >
              <h2 className="text-body font-semibold text-text-primary">Historical Events</h2>
              <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
            </button>
            {historyOpen && (
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated">
                      {['Event', 'Format', 'Level', 'Host', 'Attended', 'Qualified', 'Yield', 'Hires'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-caption font-medium text-text-muted whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historicalEvents.map((ev) => (
                      <HistoricalEventRow key={ev.id} event={ev} maxAttended={maxAttended} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
