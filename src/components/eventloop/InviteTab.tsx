import { useState, useMemo } from 'react'
import { Search, Filter, UserPlus, AlertTriangle, ChevronDown, Mail, Info } from 'lucide-react'
import { channelRsvpRates } from '../../data/eventloop'
import type { Prospect } from '../../data/eventloop'
import { useEventLoopStore } from '../../store/eventloopStore'
import { ProspectDiscovery } from './ProspectDiscovery'

interface Props {
  eventId: string
}

const priorityColor = {
  A: 'bg-danger/10 text-danger border-danger/30',
  B: 'bg-warning/10 text-warning border-warning/30',
  C: 'bg-surface-elevated text-text-secondary border-border',
}

const rsvpColor: Record<string, string> = {
  Yes: 'text-success bg-success/10 border-success/30',
  No: 'text-danger bg-danger/10 border-danger/30',
  Pending: 'text-warning bg-warning/10 border-warning/30',
}

const statusColor: Record<string, string> = {
  'Not Sent': 'text-text-muted',
  Sent: 'text-accent',
  Opened: 'text-warning',
  Replied: 'text-success',
  Declined: 'text-danger',
}

const relationshipColor: Record<string, string> = {
  'Warm ATS': 'text-success',
  'Silver Medalist': 'text-accent',
  'Previous Event': 'text-accent',
  'Employee Network': 'text-warning',
  'Warm Referral': 'text-success',
  Cold: 'text-text-muted',
}

function AudienceMixBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-meta text-text-secondary text-right">{label}</span>
      <div className="flex-1 h-4 rounded bg-surface-elevated overflow-hidden">
        <div className={`h-full rounded ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 text-meta text-text-primary font-medium">{count} <span className="text-text-muted font-normal">({pct}%)</span></span>
    </div>
  )
}

function GapCard({ severity, title, detail, recommendation }: { severity: 'high' | 'medium'; title: string; detail: string; recommendation: string }) {
  return (
    <div className={`rounded-card border p-4 ${severity === 'high' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'}`}>
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${severity === 'high' ? 'text-danger' : 'text-warning'}`} />
        <div>
          <div className={`text-body font-medium ${severity === 'high' ? 'text-danger' : 'text-warning'}`}>{title}</div>
          <div className="text-meta text-text-secondary mt-0.5">{detail}</div>
        </div>
      </div>
      <div className="text-meta text-text-secondary mt-2 pl-5">
        <span className="font-medium text-text-primary">Recommendation: </span>{recommendation}
      </div>
    </div>
  )
}

export function InviteTab({ eventId }: Props) {
  const prospects = useEventLoopStore((s) => s.prospects).filter((p) => p.eventId === eventId)
  const updateProspectStatus = useEventLoopStore((s) => s.updateProspectStatus)
  const addProspect = useEventLoopStore((s) => s.addProspect)

  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [filterPriority, setFilterPriority] = useState<'A' | 'B' | 'C' | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterOwner, setFilterOwner] = useState('all')
  const [filterRsvp, setFilterRsvp] = useState('all')
  const [search, setSearch] = useState('')
  const [showChannelRates, setShowChannelRates] = useState(false)

  // Computed metrics
  const total = prospects.length
  const aCount = prospects.filter((p) => p.priority === 'A').length
  const bCount = prospects.filter((p) => p.priority === 'B').length
  const cCount = prospects.filter((p) => p.priority === 'C').length
  const sent = prospects.filter((p) => p.inviteStatus !== 'Not Sent').length
  const rsvpYes = prospects.filter((p) => p.rsvp === 'Yes').length
  const rsvpPending = prospects.filter((p) => p.rsvp === 'Pending').length

  // Audience gaps
  const gaps = useMemo(() => {
    const result: { severity: 'high' | 'medium'; title: string; detail: string; recommendation: string }[] = []

    // Company concentration
    const companies = prospects.filter((p) => p.priority === 'A').reduce<Record<string, number>>((acc, p) => {
      acc[p.company] = (acc[p.company] ?? 0) + 1
      return acc
    }, {})
    const topCompany = Object.entries(companies).sort((a, b) => b[1] - a[1])[0]
    if (topCompany && aCount > 0 && topCompany[1] / aCount > 0.35) {
      result.push({
        severity: 'medium',
        title: `${topCompany[0]} overrepresented`,
        detail: `${Math.round((topCompany[1] / aCount) * 100)}% of Priority-A prospects are from ${topCompany[0]}.`,
        recommendation: 'Expand target company research to include Palantir deployment team and Scale AI FDE org.',
      })
    }

    // Staff+ coverage
    const staffPlus = prospects.filter((p) => p.priority === 'A' && (p.seniority === 'Staff' || p.seniority === 'Principal')).length
    if (aCount > 0 && staffPlus / aCount < 0.35) {
      result.push({
        severity: 'high',
        title: 'Low Staff+ coverage in Priority A',
        detail: `Only ${Math.round((staffPlus / aCount) * 100)}% of Priority-A prospects are Staff or Principal level.`,
        recommendation: 'Add 4–6 more Staff+ FDEs from Palantir, Scale, and Vercel via technical leader outreach.',
      })
    }

    // Palantir representation
    const palantirCount = prospects.filter((p) => p.company === 'Palantir' && p.priority === 'A').length
    if (palantirCount < 3) {
      result.push({
        severity: 'high',
        title: 'Low Palantir coverage',
        detail: `Only ${palantirCount} Priority-A prospect${palantirCount === 1 ? '' : 's'} from Palantir, a top target company.`,
        recommendation: 'Expand discovery in Palantir FDE and deployment engineering teams. Use employee network or founder note.',
      })
    }

    return result.slice(0, 3)
  }, [prospects, aCount])

  const owners = [...new Set(prospects.map((p) => p.inviteOwner))]

  const filtered = prospects.filter((p) => {
    if (filterPriority !== 'all' && p.priority !== filterPriority) return false
    if (filterStatus !== 'all' && p.inviteStatus !== filterStatus) return false
    if (filterOwner !== 'all' && p.inviteOwner !== filterOwner) return false
    if (filterRsvp !== 'all') {
      if (filterRsvp === 'null' && p.rsvp !== null) return false
      if (filterRsvp !== 'null' && p.rsvp !== filterRsvp) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.company.toLowerCase().includes(q) && !p.title.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Prospects', value: total, color: 'text-text-primary' },
          { label: 'Invites Sent', value: sent, color: 'text-accent' },
          { label: 'RSVP Yes', value: rsvpYes, color: 'text-success' },
          { label: 'RSVP Pending', value: rsvpPending, color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-card border border-border bg-surface p-4">
            <div className="text-caption text-text-muted mb-1.5">{label}</div>
            <div className={`text-subhead font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Audience Strategy + Gaps */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Audience Mix */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="text-body font-semibold text-text-primary mb-4">Audience Mix</h3>
          <div className="space-y-3 mb-4">
            <AudienceMixBar label="Priority A" count={aCount} total={total} color="bg-danger/50" />
            <AudienceMixBar label="Priority B" count={bCount} total={total} color="bg-warning/50" />
            <AudienceMixBar label="Community" count={cCount} total={total} color="bg-surface-elevated border border-border" />
          </div>
          <div className="text-caption text-text-muted border-t border-border pt-3">
            <div className="font-medium text-text-secondary mb-1">Recommended mix for this event</div>
            <div className="flex gap-4">
              <span>A: 44% <span className="text-text-muted">(22)</span></span>
              <span>B: 36% <span className="text-text-muted">(18)</span></span>
              <span>C: 20% <span className="text-text-muted">(10)</span></span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-text-muted">
              <Info className="h-3 w-3" />
              Illustrative forecast based on demo historical data
            </div>
          </div>
        </div>

        {/* Audience Gaps */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="text-body font-semibold text-text-primary mb-4">Audience Gaps</h3>
          {gaps.length > 0 ? (
            <div className="space-y-3">
              {gaps.map((g, i) => <GapCard key={i} {...g} />)}
            </div>
          ) : (
            <div className="text-meta text-text-muted text-center py-4">No significant gaps detected</div>
          )}
        </div>
      </div>

      {/* Channel RSVP Rates */}
      <div className="rounded-card border border-border bg-surface overflow-hidden">
        <button
          onClick={() => setShowChannelRates((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 hover:bg-surface-elevated transition-colors"
        >
          <h3 className="text-body font-semibold text-text-primary">Invitation Strategy — Expected RSVP by Channel</h3>
          <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${showChannelRates ? 'rotate-180' : ''}`} />
        </button>
        {showChannelRates && (
          <div className="px-5 pb-5 space-y-3">
            {channelRsvpRates.map(({ channel, rate, color }) => (
              <div key={channel} className="flex items-center gap-3">
                <span className="w-52 shrink-0 text-meta text-text-secondary text-right">{channel}</span>
                <div className="flex-1 h-5 rounded bg-surface-elevated overflow-hidden relative">
                  <div className={`h-full rounded ${color} transition-all`} style={{ width: `${rate}%` }} />
                  <span className="absolute inset-y-0 left-2 flex items-center text-caption font-semibold text-white mix-blend-luminosity">
                    {rate}%
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1 text-caption text-text-muted mt-2">
              <Info className="h-3 w-3" />
              Illustrative forecast based on demo historical event data. Not causal.
            </div>
          </div>
        )}
      </div>

      {/* Prospect Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-body font-semibold text-text-primary">Prospects ({filtered.length})</h3>
          <button
            onClick={() => setDiscoveryOpen(true)}
            className="flex items-center gap-2 rounded-button bg-accent px-3 py-2 text-body font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Find More Prospects
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="input pl-8 py-1.5 text-meta w-40"
            />
          </div>
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          {(['all', 'A', 'B', 'C'] as const).map((p) => (
            <button key={p} onClick={() => setFilterPriority(p)}
              className={`rounded-tag border px-2 py-0.5 text-caption transition-colors ${filterPriority === p ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}>
              {p === 'all' ? 'All Priority' : `Priority ${p}`}
            </button>
          ))}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-button border border-border bg-surface-elevated px-2 py-1 text-caption text-text-secondary outline-none">
            <option value="all">All Status</option>
            {['Not Sent', 'Sent', 'Opened', 'Replied', 'Declined'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterRsvp} onChange={(e) => setFilterRsvp(e.target.value)}
            className="rounded-button border border-border bg-surface-elevated px-2 py-1 text-caption text-text-secondary outline-none">
            <option value="all">All RSVP</option>
            <option value="Yes">Yes</option>
            <option value="Pending">Pending</option>
            <option value="No">No</option>
            <option value="null">Not sent</option>
          </select>
          <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}
            className="rounded-button border border-border bg-surface-elevated px-2 py-1 text-caption text-text-secondary outline-none">
            <option value="all">All Owners</option>
            {owners.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-elevated">
                {['Prospect', 'Priority', 'Source', 'Relationship', 'Owner', 'Channel', 'Status', 'RSVP'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-caption font-medium text-text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProspectRow key={p.id} prospect={p} onUpdateStatus={updateProspectStatus} />
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-meta text-text-muted">No prospects match filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {discoveryOpen && (
        <ProspectDiscovery
          eventId={eventId}
          onClose={() => setDiscoveryOpen(false)}
          onAdd={(p) => { addProspect(p); setDiscoveryOpen(false) }}
        />
      )}
    </div>
  )
}

function ProspectRow({ prospect: p, onUpdateStatus }: {
  prospect: Prospect
  onUpdateStatus: (id: string, status: import('../../data/eventloop').ProspectInviteStatus, rsvp?: import('../../data/eventloop').ProspectRsvp) => void
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors">
      <td className="px-3 py-3">
        <div className="text-body font-medium text-text-primary whitespace-nowrap">{p.name}</div>
        <div className="text-caption text-text-muted whitespace-nowrap">{p.title} · {p.company}</div>
      </td>
      <td className="px-3 py-3">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-caption font-semibold ${priorityColor[p.priority]}`}>
          {p.priority}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="rounded-tag bg-surface-elevated border border-border px-2 py-0.5 text-caption text-text-secondary whitespace-nowrap">
          {p.source}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className={`text-caption font-medium whitespace-nowrap ${relationshipColor[p.relationshipType]}`}>
          {p.relationshipType}
        </span>
      </td>
      <td className="px-3 py-3 text-caption text-text-secondary whitespace-nowrap">{p.inviteOwner}</td>
      <td className="px-3 py-3">
        <span className="text-caption text-text-secondary whitespace-nowrap">{p.inviteChannel}</span>
      </td>
      <td className="px-3 py-3">
        <span className={`text-caption font-medium ${statusColor[p.inviteStatus]}`}>{p.inviteStatus}</span>
      </td>
      <td className="px-3 py-3">
        {p.rsvp ? (
          <span className={`rounded-tag border px-2 py-0.5 text-caption font-medium ${rsvpColor[p.rsvp]}`}>{p.rsvp}</span>
        ) : (
          p.inviteStatus !== 'Not Sent' ? (
            <span className="text-caption text-text-muted">Awaiting</span>
          ) : (
            <button
              onClick={() => onUpdateStatus(p.id, 'Sent')}
              className="flex items-center gap-1 rounded-button border border-border px-2 py-0.5 text-caption text-text-secondary hover:bg-surface-elevated"
            >
              <Mail className="h-3 w-3" /> Send
            </button>
          )
        )}
      </td>
    </tr>
  )
}
