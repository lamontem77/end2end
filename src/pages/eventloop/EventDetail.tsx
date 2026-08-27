import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Calendar, MapPin, Target, Users, Zap, BarChart3, TrendingUp,
  CheckCircle2, AlertTriangle, Filter, Search, Clock, QrCode, MessageSquare,
  Info, ArrowDown, Building2, ChevronDown, Star,
} from 'lucide-react'
import { allEvents } from '../../data/eventloop'
import { useEventLoopStore } from '../../store/eventloopStore'
import { CheckInFlow } from '../../components/eventloop/CheckInFlow'
import { InteractionLogger } from '../../components/eventloop/InteractionLogger'
import { CandidateDrawer } from '../../components/eventloop/CandidateDrawer'

type Tab = 'overview' | 'audience' | 'live' | 'pipeline' | 'results'

const priorityColor = {
  A: 'bg-danger/10 text-danger border-danger/30',
  B: 'bg-warning/10 text-warning border-warning/30',
  C: 'bg-surface-elevated text-text-secondary border-border',
}
const signalColor: Record<string, string> = {
  'Strong Potential': 'text-success',
  'Worth Nurturing': 'text-accent',
  'Not Enough Info': 'text-text-muted',
  'Not Relevant': 'text-text-muted',
}
const interestBg: Record<string, string> = {
  'Interested': 'bg-success/10 text-success border-success/30',
  'Open': 'bg-accent/10 text-accent border-accent/25',
  'Not Looking': 'bg-surface-elevated text-text-secondary border-border',
  'Unknown': 'bg-surface-elevated text-text-muted border-border',
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ event }: { event: ReturnType<typeof allEvents[0]['id']['toString']> & object }) {
  const ev = event as typeof allEvents[0]
  const convRates = [
    { label: 'Invite → RSVP', actual: Math.round((ev.actualRsvp / ev.actualInvited) * 100), forecast: 54 },
    { label: 'RSVP → Attend', actual: Math.round((ev.actualAttended / ev.actualRsvp) * 100), forecast: 79 },
    { label: 'Attend → Target Talent', actual: Math.round((ev.actualTargetTalent / ev.actualAttended) * 100), forecast: 83 },
    { label: 'Target Talent → Qualified', actual: Math.round((ev.actualQualified / ev.actualTargetTalent) * 100), forecast: 26 },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: 'Date', value: ev.date, icon: Calendar },
          { label: 'Location', value: ev.location, icon: MapPin },
          { label: 'Target Role', value: ev.targetRole, icon: Target },
          { label: 'Level', value: ev.targetLevel, icon: Star },
          { label: 'Format', value: ev.format, icon: Users },
          { label: 'Status', value: ev.status.charAt(0).toUpperCase() + ev.status.slice(1), icon: Zap },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center gap-1.5 text-caption text-text-muted mb-1">
              <Icon className="h-3.5 w-3.5" />{label}
            </div>
            <div className="text-body font-semibold text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="text-body font-semibold text-text-primary mb-1">Event Objective</h3>
        <p className="text-meta text-text-secondary">{ev.objective}</p>
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="text-body font-semibold text-text-primary mb-4">Forecast vs. Actuals</h3>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {[
            { label: 'Invited', forecast: ev.forecastInvited, actual: ev.actualInvited },
            { label: 'RSVP', forecast: ev.forecastRsvp, actual: ev.actualRsvp },
            { label: 'Attended', forecast: ev.forecastAttended, actual: ev.actualAttended },
            { label: 'Target Talent', forecast: ev.forecastTargetTalent, actual: ev.actualTargetTalent },
            { label: 'Qualified', forecast: ev.forecastQualified, actual: ev.actualQualified, highlight: true },
            { label: 'Process', forecast: ev.forecastProcessEntries, actual: ev.actualProcessEntries, highlight: true },
          ].map(({ label, forecast, actual, highlight }) => (
            <div key={label} className="text-center rounded-button bg-surface-elevated p-3">
              <div className="text-caption text-text-muted mb-1">{label}</div>
              <div className={`text-subhead font-semibold ${highlight ? (actual >= forecast ? 'text-success' : 'text-warning') : 'text-text-primary'}`}>
                {actual > 0 ? actual : '—'}
              </div>
              <div className="text-caption text-text-muted">/ {forecast} est.</div>
            </div>
          ))}
        </div>
      </div>

      {ev.actualAttended > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="text-body font-semibold text-text-primary mb-4">Conversion Rates</h3>
          <div className="space-y-3">
            {convRates.map(({ label, actual, forecast }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-meta text-text-secondary mb-1">
                  <span>{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">est. {forecast}%</span>
                    <span className={`font-semibold ${actual >= forecast ? 'text-success' : 'text-warning'}`}>{actual || 0}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent/60" style={{ width: `${Math.min(actual, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-caption text-text-muted">
            <Info className="h-3.5 w-3.5" />
            Illustrative forecast based on demo historical data
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Audience Tab ─────────────────────────────────────────────────────────────
function AudienceTab({ eventId, onCheckIn, onLogInteraction, onSelectAttendee }: {
  eventId: string
  onCheckIn: () => void
  onLogInteraction: (id?: string) => void
  onSelectAttendee: (id: string) => void
}) {
  const allAttendees = useEventLoopStore((s) => s.attendees)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ priority: '', rsvp: '', attendance: '', interest: '', signal: '' })
  const [showFilters, setShowFilters] = useState(false)

  const attendees = allAttendees.filter((a) => {
    if (query && !a.name.toLowerCase().includes(query.toLowerCase()) && !a.company.toLowerCase().includes(query.toLowerCase())) return false
    if (filters.priority && a.priority !== filters.priority) return false
    if (filters.rsvp && a.rsvpStatus !== filters.rsvp) return false
    if (filters.attendance && a.attendanceStatus !== filters.attendance) return false
    if (filters.interest && a.recruitingInterest !== filters.interest) return false
    if (filters.signal && a.talentSignal !== filters.signal) return false
    return true
  })

  const stats = useMemo(() => {
    const all = allAttendees
    return {
      invited: all.length,
      rsvp: all.filter((a) => a.rsvpStatus === 'Yes').length,
      checkedIn: all.filter((a) => a.attendanceStatus === 'Checked In').length,
      priorityAB: all.filter((a) => (a.priority === 'A' || a.priority === 'B') && a.attendanceStatus === 'Checked In').length,
      priorityA: all.filter((a) => a.priority === 'A').length,
      priorityAChecked: all.filter((a) => a.priority === 'A' && a.attendanceStatus === 'Checked In').length,
      targetTalent: all.filter((a) => (a.targetRole === 'FDE' || a.targetRole === 'Infrastructure') && a.attendanceStatus === 'Checked In').length,
    }
  }, [allAttendees])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'Invited', value: stats.invited, sub: 'total' },
          { label: 'RSVP\'d', value: stats.rsvp, sub: `${Math.round((stats.rsvp/stats.invited)*100)}%` },
          { label: 'Checked In', value: stats.checkedIn, sub: `${Math.round((stats.checkedIn/stats.rsvp)*100)}% of RSVP`, color: 'text-success' },
          { label: 'Priority A/B In', value: stats.priorityAB, sub: 'high-value', color: 'text-accent' },
          { label: 'Target Talent', value: stats.targetTalent, sub: 'in room', color: 'text-accent' },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-border bg-surface p-3 text-center">
            <div className={`text-subhead font-semibold ${s.color ?? 'text-text-primary'}`}>{s.value}</div>
            <div className="text-caption text-text-muted">{s.label}</div>
            <div className="text-caption text-text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search attendees…" className="input pl-9 bg-surface-elevated" />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-button border px-3 py-2 text-body transition-colors ${showFilters ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}
        >
          <Filter className="h-4 w-4" />Filters
        </button>
        <button onClick={onCheckIn} className="flex items-center gap-1.5 rounded-button border border-border bg-surface-elevated px-3 py-2 text-body text-text-secondary hover:text-text-primary transition-colors">
          <QrCode className="h-4 w-4" />Check In
        </button>
        <button onClick={() => onLogInteraction()} className="flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-body text-white hover:bg-accent-hover transition-colors">
          <MessageSquare className="h-4 w-4" />Log
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5 rounded-card border border-border bg-surface p-3">
          {[
            { key: 'priority', label: 'Priority', opts: ['A', 'B', 'C'] },
            { key: 'rsvp', label: 'RSVP', opts: ['Yes', 'No', 'Pending'] },
            { key: 'attendance', label: 'Attendance', opts: ['Checked In', 'No Show', 'Expected'] },
            { key: 'interest', label: 'Interest', opts: ['Interested', 'Open', 'Not Looking', 'Unknown'] },
            { key: 'signal', label: 'Signal', opts: ['Strong Potential', 'Worth Nurturing', 'Not Enough Info', 'Not Relevant'] },
          ].map(({ key, label, opts }) => (
            <div key={key}>
              <label className="text-caption text-text-muted mb-1 block">{label}</label>
              <select
                value={(filters as Record<string, string>)[key]}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                className="w-full rounded-button border border-border bg-surface-elevated px-2 py-1.5 text-caption text-text-primary outline-none focus:border-accent"
              >
                <option value="">All</option>
                {opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-card border border-border bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-elevated">
              {['Name', 'Company', 'Title', 'Priority', 'RSVP', 'Status', 'Engagement', 'Interest', 'Signal', 'Pipeline'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-caption font-medium text-text-muted whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attendees.map((a) => (
              <tr
                key={a.id}
                onClick={() => onSelectAttendee(a.id)}
                className="border-b border-border last:border-0 hover:bg-surface-elevated cursor-pointer transition-colors"
              >
                <td className="px-3 py-2.5">
                  <span className="text-body font-medium text-text-primary whitespace-nowrap">{a.name}</span>
                </td>
                <td className="px-3 py-2.5 text-meta text-text-secondary whitespace-nowrap">{a.company}</td>
                <td className="px-3 py-2.5 text-meta text-text-secondary whitespace-nowrap max-w-[140px] truncate">{a.title}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-tag border px-2 py-0.5 text-caption font-semibold ${priorityColor[a.priority]}`}>{a.priority}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-caption font-medium ${a.rsvpStatus === 'Yes' ? 'text-success' : a.rsvpStatus === 'No' ? 'text-danger' : 'text-text-muted'}`}>
                    {a.rsvpStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`text-caption font-medium ${a.attendanceStatus === 'Checked In' ? 'text-success' : a.attendanceStatus === 'No Show' ? 'text-danger' : 'text-text-muted'}`}>
                    {a.attendanceStatus === 'Checked In' ? `✓ ${a.checkInTime ?? ''}` : a.attendanceStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-caption ${a.engagement === 'High' ? 'text-success' : a.engagement === 'Medium' ? 'text-accent' : a.engagement === 'Low' ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {a.engagement}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-tag border px-2 py-0.5 text-caption ${interestBg[a.recruitingInterest]}`}>{a.recruitingInterest}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-caption ${signalColor[a.talentSignal]}`}>{a.talentSignal}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-caption text-text-muted">{a.pipelineStage ?? '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendees.length === 0 && (
          <div className="text-center py-8 text-text-muted text-meta">No attendees match your filters</div>
        )}
      </div>
    </div>
  )
}

// ─── Live Event Tab ───────────────────────────────────────────────────────────
function LiveEventTab({ onLogInteraction, onSelectAttendee }: {
  onLogInteraction: (id?: string) => void
  onSelectAttendee: (id: string) => void
}) {
  const allAttendees = useEventLoopStore((s) => s.attendees)
  const interactions = useEventLoopStore((s) => s.interactions)

  const checkedIn = allAttendees.filter((a) => a.attendanceStatus === 'Checked In')
  const expected = allAttendees.filter((a) => a.rsvpStatus === 'Yes').length
  const priorityA = allAttendees.filter((a) => a.priority === 'A')
  const priorityAIn = priorityA.filter((a) => a.attendanceStatus === 'Checked In')
  const withInteractions = new Set(interactions.map((i) => i.attendeeId))
  const priorityAWithInteractions = priorityAIn.filter((a) => withInteractions.has(a.id))

  const needsAttention = checkedIn.filter((a) => {
    const myInts = interactions.filter((i) => i.attendeeId === a.id)
    return (a.priority === 'A' || a.priority === 'B') && myInts.length === 0
  }).slice(0, 5)

  const getRecommendation = (a: typeof allAttendees[0]) => {
    if (a.priority === 'A') return 'Introduce to KJ Shah or an engineering leader'
    return 'Connect with recruiting team for initial conversation'
  }

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Live pulse header */}
      <div className="flex items-center gap-2 rounded-card border border-success/30 bg-success/5 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse-live" />
        <span className="text-body font-semibold text-success">Event is Live</span>
        <span className="text-meta text-text-secondary ml-2">AI Builders Dinner · Kaizen NYC Office</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <div className="text-subhead font-semibold text-text-primary">{checkedIn.length} <span className="text-text-secondary text-body">/ {expected}</span></div>
          <div className="text-caption text-text-muted mt-0.5">Checked In</div>
          <div className="mt-2 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct(checkedIn.length, expected)}%` }} />
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <div className="text-subhead font-semibold text-text-primary">{priorityAIn.length} <span className="text-text-secondary text-body">/ {priorityA.length}</span></div>
          <div className="text-caption text-text-muted mt-0.5">Priority A Arrived</div>
          <div className="mt-2 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct(priorityAIn.length, priorityA.length)}%` }} />
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <div className="text-subhead font-semibold text-text-primary">{priorityAWithInteractions.length} <span className="text-text-secondary text-body">/ {priorityAIn.length}</span></div>
          <div className="text-caption text-text-muted mt-0.5">Meaningful Interactions</div>
          <div className="mt-2 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct(priorityAWithInteractions.length, priorityAIn.length)}%` }} />
          </div>
        </div>
      </div>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <div className="rounded-card border border-warning/30 bg-warning/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-body font-semibold text-warning">Needs Attention ({needsAttention.length})</h3>
          </div>
          <div className="space-y-3">
            {needsAttention.map((a) => (
              <div key={a.id} className="rounded-card border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-caption font-semibold ${priorityColor[a.priority]}`}>
                      {a.priority}
                    </span>
                    <div>
                      <div className="text-body font-semibold text-text-primary">{a.name}</div>
                      <div className="text-meta text-text-secondary">{a.title} · {a.company}</div>
                      <div className="text-caption text-text-muted mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Checked in at {a.checkInTime} · 0 Kaizen interactions
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onSelectAttendee(a.id)}
                      className="rounded-button border border-border px-2.5 py-1.5 text-caption text-text-secondary hover:bg-surface-elevated"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onLogInteraction(a.id)}
                      className="rounded-button bg-accent/15 border border-accent/25 px-2.5 py-1.5 text-caption text-accent hover:bg-accent/25"
                    >
                      Log
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 rounded-button bg-surface-elevated border border-border px-3 py-2 text-caption text-text-secondary">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <strong className="text-text-primary">Recommendation:</strong> {getRecommendation(a)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction coverage */}
      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="text-body font-semibold text-text-primary mb-3">Interaction Coverage</h3>
        <div className="space-y-2">
          {checkedIn.map((a) => {
            const myInts = interactions.filter((i) => i.attendeeId === a.id)
            const hasInt = myInts.length > 0
            return (
              <button
                key={a.id}
                onClick={() => onSelectAttendee(a.id)}
                className="flex w-full items-center gap-3 rounded-button px-3 py-2 hover:bg-surface-elevated transition-colors text-left"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-semibold ${priorityColor[a.priority]}`}>
                  {a.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-body text-text-primary truncate block">{a.name}</span>
                  <span className="text-caption text-text-muted">{a.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  {myInts.length > 0 && (
                    <span className="text-caption text-text-muted">{myInts.map((i) => i.employeeName.split(' ')[0]).join(', ')}</span>
                  )}
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full ${hasInt ? 'bg-success/15' : 'bg-surface-elevated border border-border'}`}>
                    {hasInt ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onLogInteraction()}
        className="flex w-full items-center justify-center gap-2 rounded-button bg-accent py-3 text-body font-semibold text-white hover:bg-accent-hover transition-colors"
      >
        <QrCode className="h-4 w-4" />
        Scan Badge & Log Interaction
      </button>
    </div>
  )
}

// ─── Pipeline Tab ─────────────────────────────────────────────────────────────
function PipelineTab({ event }: { event: typeof allEvents[0] }) {
  const allAttendees = useEventLoopStore((s) => s.attendees)
  const sourced = allAttendees.filter((a) => a.eventSource === 'Sourced' && a.atsStage)
  const influenced = allAttendees.filter((a) => a.eventSource === 'Influenced' && a.atsStage)

  const steps = [
    { label: 'Invited', value: event.actualInvited, sub: '54 sent' },
    { label: 'RSVP\'d', value: event.actualRsvp },
    { label: 'Attended', value: event.actualAttended },
    { label: 'Target Talent', value: event.actualTargetTalent },
    { label: 'Interested / Open', value: event.actualQualified + 3 },
    { label: 'Qualified Pipeline', value: event.actualQualified, highlight: true },
    { label: 'Entered Process', value: event.actualProcessEntries },
    { label: 'Onsite', value: event.actualOnsites },
    { label: 'Offer', value: event.actualOffers },
    { label: 'Hire', value: event.actualHires, accent: true },
  ]

  const maxVal = steps[0].value

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="text-body font-semibold text-text-primary mb-2">Full Pipeline Funnel</h3>
        <div className="flex items-center gap-1.5 mb-5 text-caption text-text-muted">
          <Info className="h-3.5 w-3.5" />
          North star: Qualified Pipeline Generated
        </div>
        <div className="flex flex-col items-center gap-0">
          {steps.map((step, i) => {
            const pct = Math.max((step.value / maxVal) * 100, 4)
            const drop = i < steps.length - 1 ? Math.round(((steps[i].value - steps[i + 1].value) / steps[i].value) * 100) : null
            return (
              <div key={step.label} className="w-full flex flex-col items-center">
                <div
                  className={`flex items-center justify-between rounded-button px-4 py-2 transition-colors ${
                    step.accent ? 'bg-success/15 border border-success/30'
                    : step.highlight ? 'bg-accent/10 border border-accent/20'
                    : 'bg-surface-elevated border border-border'
                  }`}
                  style={{ width: `${pct}%`, minWidth: 200 }}
                >
                  <span className={`text-meta font-medium ${step.accent ? 'text-success' : step.highlight ? 'text-accent' : 'text-text-secondary'}`}>
                    {step.label}
                  </span>
                  <span className={`text-body font-semibold ml-4 ${step.accent ? 'text-success' : step.highlight ? 'text-accent' : 'text-text-primary'}`}>
                    {step.value}
                  </span>
                </div>
                {drop !== null && (
                  <div className="flex items-center gap-1 text-caption text-text-muted my-1">
                    <ArrowDown className="h-3 w-3" />
                    <span>{100 - drop}% continued</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-card border border-success/20 bg-success/5 p-4">
          <h3 className="text-body font-semibold text-success mb-3">Event Sourced Pipeline</h3>
          <div className="text-caption text-text-muted mb-3">Candidates who entered recruiting because of this event</div>
          {sourced.length > 0 ? (
            <div className="space-y-2">
              {sourced.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <div className="text-body text-text-primary font-medium">{a.name}</div>
                  <span className="text-caption text-text-muted">·</span>
                  <div className="text-caption text-success">{a.atsStage}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-meta text-text-muted">None yet — log interactions and move to ATS</div>}
        </div>

        <div className="rounded-card border border-accent/20 bg-accent/5 p-4">
          <h3 className="text-body font-semibold text-accent mb-3">Event Influenced Pipeline</h3>
          <div className="text-caption text-text-muted mb-3">Candidates already known who progressed after this event</div>
          {influenced.length > 0 ? (
            <div className="space-y-2">
              {influenced.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <div className="text-body text-text-primary font-medium">{a.name}</div>
                  <span className="text-caption text-text-muted">·</span>
                  <div className="text-caption text-accent">{a.atsStage}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-meta text-text-muted">None yet</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Results Tab ──────────────────────────────────────────────────────────────
function ResultsTab({ event }: { event: typeof allEvents[0] }) {
  const metrics = [
    { label: 'Invite → RSVP Rate', value: `${Math.round((event.actualRsvp / event.actualInvited) * 100)}%`, target: '54%', good: true },
    { label: 'RSVP → Attendance Rate', value: `${Math.round((event.actualAttended / event.actualRsvp) * 100)}%`, target: '79%', good: true },
    { label: 'Target Talent Attendance Rate', value: `${Math.round((event.actualTargetTalent / event.actualAttended) * 100)}%`, target: '83%', good: true },
    { label: 'Meaningful Interaction Rate', value: '48%', target: '60%', good: false },
    { label: 'Recruiting Interest Rate', value: `${Math.round((event.actualQualified + 3) / event.actualTargetTalent * 100)}%`, target: '40%', good: true },
    { label: 'Qualified Pipeline Generated', value: event.actualQualified.toString(), target: `${event.forecastQualified} est.`, good: true, north: true },
    { label: 'Qualified Pipeline Yield', value: `${Math.round((event.actualQualified / event.actualTargetTalent) * 100)}%`, target: '26%', good: true },
    { label: 'Process Entry Rate', value: `${Math.round((event.actualProcessEntries / event.actualQualified) * 100)}%`, target: '40%', good: false },
    { label: 'Onsite Conversion', value: `${Math.round((event.actualOnsites / event.actualProcessEntries) * 100)}%`, target: '50%', good: true },
    { label: 'Offer Conversion', value: `${Math.round((event.actualOffers / event.actualOnsites) * 100)}%`, target: '60%', good: true },
    { label: 'Hire Conversion', value: `${Math.round((event.actualHires / event.actualOffers) * 100)}%`, target: '80%', good: true },
    { label: 'Cost per Qualified Prospect', value: `$${Math.round(event.cost / event.actualQualified).toLocaleString()}`, target: '$1,680', good: true },
    { label: 'Cost per Hire', value: event.actualHires > 0 ? `$${Math.round(event.cost / event.actualHires).toLocaleString()}` : '—', target: '$8,400', good: true },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-body font-semibold text-text-primary">North Star Metric</h3>
        </div>
        <div className="flex items-baseline gap-3 mt-3">
          <span className="text-heading font-semibold text-accent">{event.actualQualified}</span>
          <span className="text-label text-text-secondary">Qualified Pipeline Generated</span>
        </div>
        <p className="text-meta text-text-muted mt-1">
          Event attendees who progressed to the recruiting team's predefined qualified stage.
          {' '}{event.actualQualified > event.forecastQualified
            ? <span className="text-success">+{event.actualQualified - event.forecastQualified} above forecast</span>
            : <span className="text-warning">{event.actualQualified - event.forecastQualified} vs forecast</span>
          }
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="text-body font-semibold text-text-primary mb-4">All Metrics</h3>
        <div className="space-y-3">
          {metrics.map(({ label, value, target, good, north }) => (
            <div key={label} className={`flex items-center justify-between py-2.5 border-b border-border last:border-0 ${north ? 'bg-accent/5 -mx-3 px-3 rounded-button' : ''}`}>
              <div className="flex items-center gap-2">
                {north && <Star className="h-3.5 w-3.5 text-accent shrink-0" />}
                <span className={`text-meta ${north ? 'text-accent font-medium' : 'text-text-secondary'}`}>{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-caption text-text-muted">target {target}</span>
                <span className={`text-body font-semibold ${good ? 'text-success' : 'text-warning'}`}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="text-body font-semibold text-text-primary mb-3">Event Summary</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total cost', value: `$${event.cost.toLocaleString()}` },
            { label: 'Qualified prospects', value: event.actualQualified.toString(), color: 'text-success' },
            { label: 'Process entries', value: event.actualProcessEntries.toString() },
            { label: 'Hires', value: event.actualHires.toString(), color: 'text-success' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-button bg-surface-elevated p-3">
              <div className="text-caption text-text-muted mb-1">{label}</div>
              <div className={`text-label font-semibold ${color ?? 'text-text-primary'}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up queue */}
      <FollowUpQueue />
    </div>
  )
}

function FollowUpQueue() {
  const allAttendees = useEventLoopStore((s) => s.attendees)
  const interactions = useEventLoopStore((s) => s.interactions)
  const [statuses, setStatuses] = useState<Record<string, string>>({})

  const queue = allAttendees.filter((a) => {
    const myInts = interactions.filter((i) => i.attendeeId === a.id && i.followUp)
    return myInts.length > 0
  })

  if (queue.length === 0) return null

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h3 className="text-body font-semibold text-text-primary mb-1">Follow-Up Queue</h3>
      <p className="text-meta text-text-muted mb-4">Candidates who need post-event outreach</p>
      <div className="space-y-3">
        {queue.map((a) => {
          const myInts = interactions.filter((i) => i.attendeeId === a.id && i.followUp)
          const owner = myInts[0]?.followUpOwner ?? '—'
          const status = statuses[a.id] ?? 'Not Started'
          return (
            <div key={a.id} className="rounded-card border border-border bg-surface-elevated p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-body font-semibold text-text-primary">{a.name}</div>
                  <div className="text-meta text-text-secondary">{a.company} · {a.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={`rounded-tag border px-2 py-0.5 text-caption ${interestBg[a.recruitingInterest]}`}>{a.recruitingInterest}</span>
                    <span className={`text-caption ${signalColor[a.talentSignal]}`}>{a.talentSignal}</span>
                  </div>
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatuses({ ...statuses, [a.id]: e.target.value })}
                  className={`shrink-0 rounded-button border px-2 py-1 text-caption outline-none ${
                    status === 'Complete' ? 'border-success/30 bg-success/10 text-success'
                    : status === 'In Progress' ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-border bg-surface text-text-secondary'
                  }`}
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Complete</option>
                </select>
              </div>
              <div className="text-meta text-text-secondary bg-surface rounded-button px-3 py-2 border border-border">
                <strong className="text-text-primary">Recommended action:</strong>{' '}
                Personal follow-up from {owner} referencing {myInts.map((i) => i.employeeName.split(' ')[0]).join(' + ')} conversation
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main EventDetail ──────────────────────────────────────────────────────────

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const event = allEvents.find((e) => e.id === id)
  const [tab, setTab] = useState<Tab>('overview')
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [interactionOpen, setInteractionOpen] = useState(false)
  const [interactionDefault, setInteractionDefault] = useState<string | undefined>()
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null)
  const allAttendees = useEventLoopStore((s) => s.attendees)

  if (!event) return <div className="p-6 text-text-muted">Event not found</div>

  const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'audience', label: 'Audience', icon: Users },
    { key: 'live', label: 'Live Event', icon: Zap },
    { key: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { key: 'results', label: 'Results', icon: CheckCircle2 },
  ]

  const handleLogInteraction = (id?: string) => {
    setInteractionDefault(id)
    setInteractionOpen(true)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 pt-4 pb-0 shrink-0">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => navigate('/events')} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-label font-semibold text-text-primary">{event.name}</h1>
              {event.status === 'live' && (
                <span className="flex items-center gap-1.5 rounded-tag border border-success/30 bg-success/10 px-2 py-0.5 text-caption text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-live" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-meta text-text-secondary mt-0.5">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-text-muted" />{event.date}</span>
              <span className="text-text-muted">·</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-text-muted" />{event.location}</span>
              <span className="text-text-muted">·</span>
              <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5 text-text-muted" />{event.targetRole}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setCheckInOpen(true)} className="flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-body text-text-secondary hover:bg-surface-elevated">
              <QrCode className="h-4 w-4" />Check In
            </button>
            <button onClick={() => handleLogInteraction()} className="flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-body text-white hover:bg-accent-hover">
              <MessageSquare className="h-4 w-4" />Log Interaction
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-transparent -mb-px">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-body transition-colors ${
                tab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              } ${key === 'live' && event.status === 'live' ? 'text-success hover:text-success' : ''}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {key === 'live' && event.status === 'live' && (
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-live" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl">
          {tab === 'overview' && <OverviewTab event={event as unknown as object} />}
          {tab === 'audience' && (
            <AudienceTab
              eventId={event.id}
              onCheckIn={() => setCheckInOpen(true)}
              onLogInteraction={handleLogInteraction}
              onSelectAttendee={setSelectedAttendeeId}
            />
          )}
          {tab === 'live' && (
            <LiveEventTab
              onLogInteraction={handleLogInteraction}
              onSelectAttendee={setSelectedAttendeeId}
            />
          )}
          {tab === 'pipeline' && <PipelineTab event={event} />}
          {tab === 'results' && <ResultsTab event={event} />}
        </div>
      </div>

      {/* Modals */}
      {checkInOpen && (
        <CheckInFlow attendees={allAttendees} onClose={() => setCheckInOpen(false)} />
      )}
      {interactionOpen && (
        <InteractionLogger
          attendees={allAttendees}
          onClose={() => { setInteractionOpen(false); setInteractionDefault(undefined) }}
          defaultAttendeeId={interactionDefault}
        />
      )}
      {selectedAttendeeId && (
        <CandidateDrawer
          attendeeId={selectedAttendeeId}
          onClose={() => setSelectedAttendeeId(null)}
          onLogInteraction={(id) => { setSelectedAttendeeId(null); handleLogInteraction(id) }}
        />
      )}
    </div>
  )
}
