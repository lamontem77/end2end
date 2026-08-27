import { useState, useMemo } from 'react'
import { Search, Filter, ChevronDown, ArrowRight, Users } from 'lucide-react'
import { useEventLoopStore } from '../../store/eventloopStore'
import { CandidateDrawer } from '../../components/eventloop/CandidateDrawer'
import { InteractionLogger } from '../../components/eventloop/InteractionLogger'

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

export function Candidates() {
  const attendees = useEventLoopStore((s) => s.attendees)
  const interactions = useEventLoopStore((s) => s.interactions)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ priority: '', interest: '', signal: '', pipeline: '', source: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [logDefault, setLogDefault] = useState<string | undefined>()
  const [sort, setSort] = useState<'name' | 'priority' | 'signal' | 'interest'>('priority')

  const filtered = useMemo(() => {
    let list = attendees.filter((a) => {
      if (query) {
        const q = query.toLowerCase()
        if (!a.name.toLowerCase().includes(q) && !a.company.toLowerCase().includes(q) && !a.title.toLowerCase().includes(q)) return false
      }
      if (filters.priority && a.priority !== filters.priority) return false
      if (filters.interest && a.recruitingInterest !== filters.interest) return false
      if (filters.signal && a.talentSignal !== filters.signal) return false
      if (filters.pipeline && (filters.pipeline === 'In Pipeline' ? !a.pipelineStage : a.pipelineStage)) return false
      if (filters.source) {
        if (filters.source === 'Sourced' && a.eventSource !== 'Sourced') return false
        if (filters.source === 'Influenced' && a.eventSource !== 'Influenced') return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'priority') return a.priority.localeCompare(b.priority)
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'signal') {
        const order = { 'Strong Potential': 0, 'Worth Nurturing': 1, 'Not Enough Info': 2, 'Not Relevant': 3 }
        return (order[a.talentSignal] ?? 3) - (order[b.talentSignal] ?? 3)
      }
      if (sort === 'interest') {
        const order = { 'Interested': 0, 'Open': 1, 'Not Looking': 2, 'Unknown': 3 }
        return (order[a.recruitingInterest] ?? 3) - (order[b.recruitingInterest] ?? 3)
      }
      return 0
    })
    return list
  }, [attendees, query, filters, sort])

  const stats = useMemo(() => ({
    total: attendees.length,
    interested: attendees.filter((a) => a.recruitingInterest === 'Interested' || a.recruitingInterest === 'Open').length,
    strong: attendees.filter((a) => a.talentSignal === 'Strong Potential').length,
    inPipeline: attendees.filter((a) => a.pipelineStage).length,
    sourced: attendees.filter((a) => a.eventSource === 'Sourced').length,
    influenced: attendees.filter((a) => a.eventSource === 'Influenced').length,
  }), [attendees])

  const handleLogInteraction = (id?: string) => {
    setLogDefault(id)
    setLogOpen(true)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <div>
          <h1 className="text-label font-semibold text-text-primary">Candidates</h1>
          <p className="text-meta text-text-secondary mt-0.5">All event attendees and their recruiting signals</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-5 md:grid-cols-6">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Interested/Open', value: stats.interested, color: 'text-success' },
            { label: 'Strong Signal', value: stats.strong, color: 'text-success' },
            { label: 'In Pipeline', value: stats.inPipeline, color: 'text-accent' },
            { label: 'Event Sourced', value: stats.sourced, color: 'text-accent' },
            { label: 'Event Influenced', value: stats.influenced, color: 'text-accent' },
          ].map((s) => (
            <div key={s.label} className="rounded-card border border-border bg-surface p-3 text-center">
              <div className={`text-subhead font-semibold ${s.color ?? 'text-text-primary'}`}>{s.value}</div>
              <div className="text-caption text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, company, title…" className="input pl-9 bg-surface-elevated" />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-button border px-3 py-2 text-body transition-colors ${showFilters ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}
          >
            <Filter className="h-4 w-4" />Filters
          </button>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-button border border-border bg-surface-elevated pl-3 pr-8 py-2 text-body text-text-secondary outline-none focus:border-accent appearance-none"
            >
              <option value="priority">Sort: Priority</option>
              <option value="signal">Sort: Signal</option>
              <option value="interest">Sort: Interest</option>
              <option value="name">Sort: Name</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5 rounded-card border border-border bg-surface p-3 mb-3">
            {[
              { key: 'priority', label: 'Priority', opts: ['A', 'B', 'C'] },
              { key: 'interest', label: 'Interest', opts: ['Interested', 'Open', 'Not Looking', 'Unknown'] },
              { key: 'signal', label: 'Signal', opts: ['Strong Potential', 'Worth Nurturing', 'Not Enough Info', 'Not Relevant'] },
              { key: 'pipeline', label: 'Pipeline', opts: ['In Pipeline', 'Not in Pipeline'] },
              { key: 'source', label: 'Source', opts: ['Sourced', 'Influenced'] },
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

        <div className="text-caption text-text-muted mb-3">{filtered.length} candidates</div>

        {/* Cards */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => {
            const myInts = interactions.filter((i) => i.attendeeId === a.id)
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className="w-full text-left rounded-card border border-border bg-surface p-4 hover:border-accent/40 hover:bg-surface-elevated transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-caption font-semibold ${priorityColor[a.priority]}`}>
                      {a.priority}
                    </div>
                    <div className="min-w-0">
                      <div className="text-body font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{a.name}</div>
                      <div className="text-caption text-text-muted truncate">{a.title}</div>
                    </div>
                  </div>
                  {a.eventSource && (
                    <span className={`shrink-0 rounded-tag border px-1.5 py-0.5 text-caption ${a.eventSource === 'Sourced' ? 'bg-success/10 text-success border-success/30' : 'bg-accent/10 text-accent border-accent/25'}`}>
                      {a.eventSource}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-caption text-text-secondary mb-3">
                  <Users className="h-3 w-3 text-text-muted" />
                  {a.company}
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`rounded-tag border px-2 py-0.5 text-caption ${interestBg[a.recruitingInterest]}`}>
                    {a.recruitingInterest}
                  </span>
                  <span className={`text-caption font-medium ${signalColor[a.talentSignal]}`}>
                    {a.talentSignal}
                  </span>
                </div>

                {/* Journey */}
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  {a.journey.slice(0, 4).map((step, i) => (
                    <div key={step} className="flex items-center gap-1">
                      <span className="text-caption text-text-muted">{step}</span>
                      {i < Math.min(a.journey.length, 4) - 1 && <ArrowRight className="h-2.5 w-2.5 text-text-muted" />}
                    </div>
                  ))}
                  {a.journey.length > 4 && <span className="text-caption text-text-muted">+{a.journey.length - 4}</span>}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <div className="text-caption text-text-muted">
                    {myInts.length > 0
                      ? `${myInts.length} interaction${myInts.length > 1 ? 's' : ''} · ${myInts.map((i) => i.employeeName.split(' ')[0]).join(', ')}`
                      : 'No interactions yet'}
                  </div>
                  {a.pipelineStage && (
                    <span className="rounded-tag bg-accent/10 border border-accent/20 px-2 py-0.5 text-caption text-accent">
                      {a.pipelineStage}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <div className="text-body">No candidates match your filters</div>
          </div>
        )}
      </div>

      {selectedId && (
        <CandidateDrawer
          attendeeId={selectedId}
          onClose={() => setSelectedId(null)}
          onLogInteraction={(id) => { setSelectedId(null); handleLogInteraction(id) }}
        />
      )}
      {logOpen && (
        <InteractionLogger
          attendees={attendees}
          defaultAttendeeId={logDefault}
          onClose={() => { setLogOpen(false); setLogDefault(undefined) }}
        />
      )}
    </div>
  )
}
