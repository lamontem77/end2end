import { useState, useMemo } from 'react'
import { Search, ChevronDown, Users } from 'lucide-react'
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
const attendanceStyle: Record<string, string> = {
  'Checked In': 'bg-success/10 text-success border-success/25',
  'No Show': 'bg-danger/10 text-danger border-danger/25',
  'Not Registered': 'bg-surface-elevated text-text-muted border-border',
}
const interestStyle: Record<string, string> = {
  'Interested': 'text-success font-medium',
  'Open': 'text-accent',
  'Not Looking': 'text-text-muted',
  'Unknown': 'text-text-muted',
}

export function Candidates() {
  const attendees = useEventLoopStore((s) => s.attendees)
  const interactions = useEventLoopStore((s) => s.interactions)
  const [query, setQuery] = useState('')
  const [filterInterest, setFilterInterest] = useState('')
  const [filterAttendance, setFilterAttendance] = useState('')
  const [filterSignal, setFilterSignal] = useState('')
  const [sort, setSort] = useState<'priority' | 'signal' | 'name'>('priority')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [logDefault, setLogDefault] = useState<string | undefined>()

  const filtered = useMemo(() => {
    let list = attendees.filter((a) => {
      if (query) {
        const q = query.toLowerCase()
        if (!a.name.toLowerCase().includes(q) && !a.company.toLowerCase().includes(q) && !a.title.toLowerCase().includes(q)) return false
      }
      if (filterInterest && a.recruitingInterest !== filterInterest) return false
      if (filterAttendance && a.attendanceStatus !== filterAttendance) return false
      if (filterSignal && a.talentSignal !== filterSignal) return false
      return true
    })
    return [...list].sort((a, b) => {
      if (sort === 'priority') return a.priority.localeCompare(b.priority)
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'signal') {
        const order: Record<string, number> = { 'Strong Potential': 0, 'Worth Nurturing': 1, 'Not Enough Info': 2, 'Not Relevant': 3 }
        return (order[a.talentSignal] ?? 3) - (order[b.talentSignal] ?? 3)
      }
      return 0
    })
  }, [attendees, query, filterInterest, filterAttendance, filterSignal, sort])

  const total = attendees.length
  const interested = attendees.filter((a) => a.recruitingInterest === 'Interested' || a.recruitingInterest === 'Open').length
  const inPipeline = attendees.filter((a) => a.pipelineStage).length
  const checkedIn = attendees.filter((a) => a.attendanceStatus === 'Checked In').length

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <div>
          <h1 className="text-label font-semibold text-text-primary">Candidates</h1>
          <p className="text-meta text-text-secondary mt-0.5">
            {total} total · {checkedIn} attended · {interested} interested · {inPipeline} in pipeline
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-3 shrink-0 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company…"
            className="input pl-9 py-1.5 text-meta w-52"
          />
        </div>

        <select value={filterAttendance} onChange={(e) => setFilterAttendance(e.target.value)}
          className="rounded-button border border-border bg-surface-elevated px-2 py-1.5 text-caption text-text-secondary outline-none">
          <option value="">All Attendance</option>
          <option>Checked In</option>
          <option>No Show</option>
          <option>Not Registered</option>
        </select>

        <select value={filterInterest} onChange={(e) => setFilterInterest(e.target.value)}
          className="rounded-button border border-border bg-surface-elevated px-2 py-1.5 text-caption text-text-secondary outline-none">
          <option value="">All Interest</option>
          <option>Interested</option>
          <option>Open</option>
          <option>Not Looking</option>
          <option>Unknown</option>
        </select>

        <select value={filterSignal} onChange={(e) => setFilterSignal(e.target.value)}
          className="rounded-button border border-border bg-surface-elevated px-2 py-1.5 text-caption text-text-secondary outline-none">
          <option value="">All Signals</option>
          <option>Strong Potential</option>
          <option>Worth Nurturing</option>
          <option>Not Enough Info</option>
          <option>Not Relevant</option>
        </select>

        <div className="relative ml-auto">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-button border border-border bg-surface-elevated pl-3 pr-8 py-1.5 text-caption text-text-secondary outline-none appearance-none">
            <option value="priority">Sort: Priority</option>
            <option value="signal">Sort: Signal</option>
            <option value="name">Sort: Name</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
        </div>

        <span className="text-caption text-text-muted">{filtered.length}</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-surface-elevated">
              {['Candidate', 'Attendance', 'Interest', 'Signal', 'Source', 'Pipeline'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-caption font-medium text-text-muted first:pl-6 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const myInts = interactions.filter((i) => i.attendeeId === a.id)
              return (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  {/* Candidate */}
                  <td className="px-4 py-3 pl-6">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-caption font-semibold ${priorityColor[a.priority]}`}>
                        {a.priority}
                      </span>
                      <div>
                        <div className="text-body font-medium text-text-primary whitespace-nowrap">{a.name}</div>
                        <div className="text-caption text-text-muted whitespace-nowrap">{a.title} · {a.company}</div>
                      </div>
                    </div>
                  </td>

                  {/* Attendance */}
                  <td className="px-4 py-3">
                    <span className={`rounded-tag border px-2 py-0.5 text-caption whitespace-nowrap ${attendanceStyle[a.attendanceStatus] ?? 'bg-surface-elevated text-text-muted border-border'}`}>
                      {a.attendanceStatus}
                    </span>
                  </td>

                  {/* Interest */}
                  <td className="px-4 py-3">
                    <span className={`text-caption whitespace-nowrap ${interestStyle[a.recruitingInterest]}`}>
                      {a.recruitingInterest}
                    </span>
                  </td>

                  {/* Signal */}
                  <td className="px-4 py-3">
                    <span className={`text-caption whitespace-nowrap ${signalColor[a.talentSignal]}`}>
                      {a.talentSignal}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3">
                    {a.eventSource ? (
                      <span className={`rounded-tag border px-2 py-0.5 text-caption whitespace-nowrap ${a.eventSource === 'Sourced' ? 'bg-success/10 text-success border-success/25' : 'bg-accent/10 text-accent border-accent/25'}`}>
                        {a.eventSource}
                      </span>
                    ) : (
                      <span className="text-caption text-text-muted">—</span>
                    )}
                    {myInts.length > 0 && (
                      <div className="text-caption text-text-muted mt-0.5 whitespace-nowrap">
                        {myInts.length} interaction{myInts.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </td>

                  {/* Pipeline */}
                  <td className="px-4 py-3">
                    {a.pipelineStage ? (
                      <span className="rounded-tag bg-accent/10 border border-accent/20 px-2 py-0.5 text-caption text-accent whitespace-nowrap">
                        {a.pipelineStage}
                      </span>
                    ) : (
                      <span className="text-caption text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Users className="h-8 w-8 mx-auto mb-3 text-text-muted opacity-40" />
                  <div className="text-meta text-text-muted">No candidates match your filters</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <CandidateDrawer
          attendeeId={selectedId}
          onClose={() => setSelectedId(null)}
          onLogInteraction={(id) => { setSelectedId(null); setLogDefault(id); setLogOpen(true) }}
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
