import { useState } from 'react'
import { BarChart3, TrendingUp, AlertCircle, Sparkles, Calendar, Users, Building2, Target, Info, ChevronRight, Send, Mail } from 'lucide-react'
import { historicalEvents, insights, nextEventRecommendation, channelRsvpRates } from '../../data/eventloop'
import { useNavigate } from 'react-router-dom'

// Simulated audience performance data keyed by relationship type
const audiencePerf = [
  { label: 'Warm ATS',        rsvp: 54, showRate: 89, yield: 34, hires: 1.2, color: 'bg-success' },
  { label: 'Silver Medalist', rsvp: 57, showRate: 86, yield: 38, hires: 1.4, color: 'bg-success' },
  { label: 'Employee Referral', rsvp: 61, showRate: 92, yield: 41, hires: 1.8, color: 'bg-accent' },
  { label: 'Previous Event',  rsvp: 58, showRate: 84, yield: 29, hires: 0.9, color: 'bg-accent/70' },
  { label: 'Employee Network', rsvp: 51, showRate: 78, yield: 22, hires: 0.7, color: 'bg-warning' },
  { label: 'Cold',            rsvp: 26, showRate: 62, yield: 14, hires: 0.3, color: 'bg-text-muted/40' },
]

const confidenceColor = { High: 'text-success', Medium: 'text-warning', Low: 'text-text-muted' }
const categoryIcon: Record<string, typeof BarChart3> = {
  Format: BarChart3,
  Host: Users,
  Outreach: Target,
  'Follow-Up': TrendingUp,
  Timing: Calendar,
  Audience: Users,
  Size: Building2,
  Target: Target,
  ROI: TrendingUp,
}

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

type FormatGroup = { label: string; color: string; bg: string; events: typeof historicalEvents }

function avg(vals: number[]) {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

function FormatComparisonChart({ groups, metric, label, format, maxVal }: {
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
      <div className="text-caption text-text-muted font-medium mb-3 uppercase tracking-wide">{label}</div>
      <div className="space-y-3">
        {groups.map((g, i) => {
          const val = vals[i]
          const pct = Math.min((val / max) * 100, 100)
          return (
            <div key={g.label} className="flex items-center gap-3">
              <span className="text-meta text-text-secondary w-36 shrink-0 text-right">{g.label}</span>
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
      <td className="px-3 py-3">
        <div className="text-body font-medium text-text-primary whitespace-nowrap">{event.name}</div>
        <div className="text-caption text-text-muted">{event.date}</div>
      </td>
      <td className="px-3 py-3">
        <span className="rounded-tag bg-surface-elevated border border-border px-2 py-0.5 text-caption text-text-secondary whitespace-nowrap">
          {event.format}
        </span>
      </td>
      <td className="px-3 py-3 text-caption text-text-secondary whitespace-nowrap">{event.seniority}</td>
      <td className="px-3 py-3 text-caption text-text-secondary whitespace-nowrap">{event.dayOfWeek} {event.timeSlot}</td>
      <td className="px-3 py-3 text-caption text-text-secondary">{event.hostType}</td>
      <td className="px-3 py-3">
        <div className="text-body font-medium text-text-primary">{event.attended}</div>
        <MetricBar value={event.attended} max={maxAttended} color="bg-text-secondary/50" />
      </td>
      <td className="px-3 py-3">
        <div className="text-body font-medium text-text-primary">{event.qualified}</div>
        <MetricBar value={event.qualified} max={10} color="bg-accent/60" />
      </td>
      <td className="px-3 py-3">
        <span className={`text-body font-semibold ${yield_ >= 30 ? 'text-success' : yield_ >= 20 ? 'text-accent' : 'text-text-secondary'}`}>
          {yield_}%
        </span>
      </td>
      <td className="px-3 py-3 text-caption text-success font-medium">{event.hires}</td>
      <td className="px-3 py-3 text-caption text-text-secondary">${event.cost.toLocaleString()}</td>
    </tr>
  )
}

export function Insights() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const maxAttended = Math.max(...historicalEvents.map((e) => e.attended))

  const categories = [...new Set(insights.map((i) => i.category))]
  const filtered = activeCategory ? insights.filter((i) => i.category === activeCategory) : insights

  const avgYield = (events: typeof historicalEvents) =>
    Math.round(events.reduce((sum, e) => sum + (e.targetTalent > 0 ? (e.qualified / e.targetTalent) * 100 : 0), 0) / events.length)

  const dinners = historicalEvents.filter((e) => e.format === 'Curated Dinner' || e.format === 'Networking' && e.audienceSize < 30)
  const broadEvents = historicalEvents.filter((e) => e.format === 'Open House' || e.audienceSize > 50)
  const founderHosted = historicalEvents.filter((e) => e.hostType.toLowerCase().includes('founder'))
  const recruitingOnly = historicalEvents.filter((e) => e.hostType === 'Recruiting Only')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <div>
          <h1 className="text-label font-semibold text-text-primary">Insights</h1>
          <p className="text-meta text-text-secondary mt-0.5">What the data says about your recruiting events</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-button bg-surface-elevated border border-border px-3 py-1.5 text-caption text-text-muted">
          <Info className="h-3.5 w-3.5" />
          Based on 8 historical events · Demo data
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl space-y-6">

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Avg qualified yield — Curated dinners', value: `${avgYield(dinners)}%`, delta: `vs ${avgYield(broadEvents)}% broad events`, positive: true },
              { label: 'Founder-hosted show rate', value: `${Math.round(founderHosted.reduce((s, e) => s + (e.rsvp > 0 ? e.attended / e.rsvp : 0), 0) / founderHosted.length * 100)}%`, delta: `vs ${Math.round(recruitingOnly.reduce((s, e) => s + (e.rsvp > 0 ? e.attended / e.rsvp : 0), 0) / recruitingOnly.length * 100)}% recruiting-only`, positive: true },
              { label: 'Avg cost / qualified prospect', value: '$1,400', delta: 'curated events', positive: true },
              { label: 'Total hires generated', value: historicalEvents.reduce((s, e) => s + e.hires, 0).toString(), delta: 'across 8 events', positive: true },
            ].map((s) => (
              <div key={s.label} className="rounded-card border border-border bg-surface p-4">
                <div className="text-caption text-text-muted mb-2 leading-tight">{s.label}</div>
                <div className="text-subhead font-semibold text-text-primary">{s.value}</div>
                <div className={`text-caption mt-1 ${s.positive ? 'text-success' : 'text-warning'}`}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Format comparison charts */}
          {(() => {
            const groups: FormatGroup[] = [
              {
                label: 'Curated Dinner',
                color: 'text-accent',
                bg: 'bg-accent/40',
                events: historicalEvents.filter((e) => e.format === 'Curated Dinner'),
              },
              {
                label: 'Roundtable / Workshop',
                color: 'text-success',
                bg: 'bg-success/40',
                events: historicalEvents.filter((e) => e.format === 'Roundtable' || e.format === 'Workshop'),
              },
              {
                label: 'Panel / Networking',
                color: 'text-warning',
                bg: 'bg-warning/30',
                events: historicalEvents.filter((e) => e.format === 'Panel' || e.format === 'Networking'),
              },
              {
                label: 'Open House',
                color: 'text-text-secondary',
                bg: 'bg-text-muted/20',
                events: historicalEvents.filter((e) => e.format === 'Open House'),
              },
            ].filter((g) => g.events.length > 0)

            const yieldMetric = (g: FormatGroup) =>
              avg(g.events.map((e) => (e.targetTalent > 0 ? (e.qualified / e.targetTalent) * 100 : 0)))
            const showMetric = (g: FormatGroup) =>
              avg(g.events.map((e) => (e.rsvp > 0 ? (e.attended / e.rsvp) * 100 : 0)))
            const costMetric = (g: FormatGroup) =>
              avg(g.events.map((e) => (e.qualified > 0 ? e.cost / e.qualified : 0)))

            return (
              <div className="rounded-card border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-body font-semibold text-text-primary">Format Comparison</h2>
                  <span className="text-caption text-text-muted">avg across {historicalEvents.length} historical events</span>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  <FormatComparisonChart
                    groups={groups}
                    metric={yieldMetric}
                    label="Qualified Yield (target → qualified)"
                    format={(v) => `${Math.round(v)}%`}
                    maxVal={60}
                  />
                  <FormatComparisonChart
                    groups={groups}
                    metric={showMetric}
                    label="Show Rate (RSVP → attended)"
                    format={(v) => `${Math.round(v)}%`}
                    maxVal={100}
                  />
                  <FormatComparisonChart
                    groups={groups}
                    metric={costMetric}
                    label="Cost / Qualified Prospect"
                    format={(v) => `$${Math.round(v / 100) * 100 < 100 ? Math.round(v) : (Math.round(v / 100) * 100).toLocaleString()}`}
                    maxVal={4000}
                  />
                </div>
                <div className="mt-4 flex items-center gap-1 text-caption text-text-muted">
                  <AlertCircle className="h-3 w-3" />
                  Observed associations in demo data — small sample, not causal
                </div>
              </div>
            )
          })()}

          {/* Observations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-body font-semibold text-text-primary">Observations</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`rounded-tag border px-2.5 py-1 text-caption transition-colors ${!activeCategory ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`rounded-tag border px-2.5 py-1 text-caption transition-colors ${activeCategory === cat ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((ins) => {
                const Icon = categoryIcon[ins.category] ?? BarChart3
                return (
                  <div key={ins.id} className="rounded-card border border-border bg-surface p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded-tag bg-surface-elevated border border-border px-2 py-0.5 text-caption text-text-muted">
                            {ins.category}
                          </span>
                          <span className={`text-caption font-medium ${confidenceColor[ins.confidence as keyof typeof confidenceColor]}`}>
                            {ins.confidence} confidence
                          </span>
                        </div>
                        <p className="text-body font-medium text-text-primary mb-1">{ins.observation}</p>
                        <p className="text-meta text-text-secondary mb-2">{ins.evidence}</p>
                        <div className="flex items-center gap-1 text-caption text-text-muted">
                          <AlertCircle className="h-3 w-3" />
                          {ins.label}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next event recommendation */}
          <div className="rounded-card border border-accent/25 bg-accent/5 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="text-body font-semibold text-accent">Next Event Recommendation</h2>
                </div>
                <p className="text-meta text-text-muted">{nextEventRecommendation.label}</p>
              </div>
              <button
                onClick={() => navigate('/events/new')}
                className="shrink-0 flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-body text-white hover:bg-accent-hover transition-colors"
              >
                Plan This Event
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-subhead font-semibold text-text-primary mb-0.5">{nextEventRecommendation.name}</h3>
              <p className="text-meta text-text-secondary">{nextEventRecommendation.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
              {[
                { label: 'Capacity', value: nextEventRecommendation.capacity },
                { label: 'Invite Volume', value: nextEventRecommendation.inviteVolume },
                { label: 'Day', value: nextEventRecommendation.suggestedDay },
                { label: 'Time', value: nextEventRecommendation.suggestedTime },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-button bg-surface border border-border p-3">
                  <div className="text-caption text-text-muted mb-0.5">{label}</div>
                  <div className="text-body font-semibold text-text-primary">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
              {[
                { label: 'Host', value: nextEventRecommendation.hosts.join(' + ') },
                { label: 'Target Role', value: nextEventRecommendation.targetRole },
                { label: 'Level', value: nextEventRecommendation.targetLevel },
                { label: 'Format', value: nextEventRecommendation.format },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-button bg-surface border border-border p-3">
                  <div className="text-caption text-text-muted mb-0.5">{label}</div>
                  <div className="text-body font-semibold text-text-primary">{value}</div>
                </div>
              ))}
            </div>

            {/* Audience mix */}
            <div className="rounded-card border border-border bg-surface p-4 mb-4">
              <h4 className="text-caption text-text-muted mb-3">Audience Mix</h4>
              <div className="space-y-2">
                {[
                  { label: 'Direct target talent', pct: nextEventRecommendation.audienceMix.directTarget, color: 'bg-accent' },
                  { label: 'Adjacent talent', pct: nextEventRecommendation.audienceMix.adjacent, color: 'bg-accent/50' },
                  { label: 'Community / referral', pct: nextEventRecommendation.audienceMix.community, color: 'bg-surface-elevated border border-border' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-meta text-text-secondary w-36 shrink-0">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-elevated overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-meta text-text-primary font-medium w-8 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast */}
            <div className="rounded-card border border-border bg-surface p-4">
              <h4 className="text-caption text-text-muted mb-3">Illustrative Forecast</h4>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'RSVP', value: nextEventRecommendation.forecast.rsvp },
                  { label: 'Attend', value: nextEventRecommendation.forecast.attended },
                  { label: 'Target Talent', value: nextEventRecommendation.forecast.targetTalent },
                  { label: 'Qualified', value: nextEventRecommendation.forecast.qualified, highlight: true },
                  { label: 'Process Entries', value: `${nextEventRecommendation.forecast.processEntries.min}–${nextEventRecommendation.forecast.processEntries.max}`, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="text-center">
                    <div className={`text-subhead font-semibold ${highlight ? 'text-success' : 'text-text-primary'}`}>{value}</div>
                    <div className="text-caption text-text-muted">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audience & Outreach Performance */}
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-body font-semibold text-text-primary">Audience &amp; Outreach Performance</h2>
              <span className="text-caption text-text-muted">simulated · demo data only</span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {/* By relationship type */}
              <div>
                <div className="text-caption text-text-muted font-medium mb-3 uppercase tracking-wide">RSVP Rate by Relationship Type</div>
                <div className="space-y-2.5">
                  {audiencePerf.map(({ label, rsvp, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-meta text-text-secondary text-right">{label}</span>
                      <div className="flex-1 h-5 rounded bg-surface-elevated overflow-hidden relative">
                        <div className={`h-full rounded ${color} transition-all`} style={{ width: `${rsvp}%` }} />
                        <span className="absolute inset-y-0 left-2 flex items-center text-caption font-semibold text-white mix-blend-luminosity">{rsvp}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* By channel */}
              <div>
                <div className="text-caption text-text-muted font-medium mb-3 uppercase tracking-wide">RSVP Rate by Invite Channel</div>
                <div className="space-y-2.5">
                  {channelRsvpRates.slice(0, 6).map(({ channel, rate, color }) => (
                    <div key={channel} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-meta text-text-secondary text-right leading-tight">{channel}</span>
                      <div className="flex-1 h-5 rounded bg-surface-elevated overflow-hidden relative">
                        <div className={`h-full rounded ${color} transition-all`} style={{ width: `${rate}%` }} />
                        <span className="absolute inset-y-0 left-2 flex items-center text-caption font-semibold text-white mix-blend-luminosity">{rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Outreach observations */}
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { icon: Users, label: 'Employee referrals had the highest qualified-pipeline yield across all relationship types.' },
                { icon: Send, label: 'Founder-led outreach generated the highest RSVP rate among Priority-A Staff+ prospects.' },
                { icon: Mail, label: 'Cold LinkedIn prospects had lower RSVP, but contributed the most net-new pipeline when they converted.' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-card border border-border bg-surface-elevated p-3 flex items-start gap-2">
                  <Icon className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <p className="text-meta text-text-secondary">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1 text-caption text-text-muted">
              <AlertCircle className="h-3 w-3" />
              Observed associations in demo data — small sample, not causal
            </div>
          </div>

          {/* Historical events table */}
          <div>
            <h2 className="text-body font-semibold text-text-primary mb-3">Historical Events</h2>
            <div className="rounded-card border border-border bg-surface overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-elevated">
                    {['Event', 'Format', 'Level', 'Day / Time', 'Host', 'Attended', 'Qualified', 'Yield', 'Hires', 'Cost'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-caption font-medium text-text-muted whitespace-nowrap">{h}</th>
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
          </div>
        </div>
      </div>
    </div>
  )
}
