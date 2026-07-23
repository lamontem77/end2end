import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, Search, Filter } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ViewSwitcher } from '../components/tickets/ViewSwitcher'
import { slaState } from '../lib/stageEngine'
import { statusLine } from '../lib/statusLine'
import { DraftApprovalCard } from '../components/scheduling/DraftApprovalCard'
import { Avatar } from '../components/ui/Avatar'

export function MyQueue() {
  const currentUser = useStore((s) => s.currentUser())
  const allCandidates = useStore((s) => s.candidates)
  const allDrafts = useStore((s) => s.agentDrafts)
  const users = useStore((s) => s.users)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)

  const candidates = allCandidates.filter((c) => !c.tags.includes('Rejected'))
  const drafts = allDrafts.filter((d) => d.status === 'pending')

  const [reqFilter, setReqFilter] = useState('')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const myDrafts = drafts.filter((d) => {
    const candidate = candidates.find((c) => c.id === d.candidateId)
    return candidate?.rcId === currentUser.id || candidate?.recruiterId === currentUser.id
  })

  const assigned = candidates.filter(
    (c) => c.currentAssigneeId === currentUser.id && !myDrafts.some((d) => d.candidateId === c.id),
  )
  const overdue = assigned.filter((c) => {
    const st = slaState(c.slaDeadline, c.stageEnteredAt)
    return st === 'breach' || st === 'at_risk'
  })
  const onTrack = assigned.filter((c) => !overdue.includes(c))

  // Unique roles across all assigned candidates (for req filter)
  const allReqs = useMemo(() => {
    const roles = new Set([...assigned, ...overdue].map((c) => c.role))
    return Array.from(roles).sort()
  }, [assigned, overdue])

  function filterCandidates(list: typeof candidates) {
    return list.filter((c) => {
      if (reqFilter && c.role !== reqFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.department.toLowerCase().includes(q)
      }
      return true
    })
  }

  const filteredOverdue = filterCandidates(overdue)
  const filteredOnTrack = filterCandidates(onTrack)

  function toggle(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const totalItems = myDrafts.length + filteredOverdue.length + filteredOnTrack.length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-subhead font-semibold text-text-primary sm:text-heading">My Queue — {currentUser.name}</h1>
          <p className="text-meta text-text-secondary">{format(new Date(), 'EEEE, MMMM d')} · {totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <ViewSwitcher />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg px-4 py-2 sm:px-6">
        <div className="relative flex-1 min-w-[140px] max-w-[260px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, role…"
            className="h-7 w-full rounded-button border border-border bg-surface pl-7 pr-2 text-caption text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          <select
            value={reqFilter}
            onChange={(e) => setReqFilter(e.target.value)}
            className="h-7 rounded-button border border-border bg-surface px-2 text-caption text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All reqs</option>
            {allReqs.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {(search || reqFilter) && (
          <button
            onClick={() => { setSearch(''); setReqFilter('') }}
            className="text-caption text-text-muted hover:text-text-primary"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6">
        {/* Needs Approval */}
        <Section
          title="Needs Your Approval"
          count={myDrafts.length}
          accent="accent"
          collapsed={!!collapsed['drafts']}
          onToggle={() => toggle('drafts')}
        >
          {myDrafts.length === 0
            ? <Empty text="No drafts waiting on you." />
            : myDrafts.map((d) => <DraftApprovalCard key={d.id} draft={d} />)}
        </Section>

        {/* Overdue */}
        <Section
          title="Overdue"
          count={filteredOverdue.length}
          accent="danger"
          collapsed={!!collapsed['overdue']}
          onToggle={() => toggle('overdue')}
        >
          {filteredOverdue.length === 0
            ? <Empty text={overdue.length === 0 ? 'Nothing overdue. Nice work.' : 'No matches for current filters.'} />
            : filteredOverdue.map((c) => (
              <QueueRow key={c.id} candidateId={c.id} users={users} onOpen={() => setSelectedCandidate(c.id)} />
            ))}
        </Section>

        {/* On Track */}
        <Section
          title="Assigned to You"
          count={filteredOnTrack.length}
          collapsed={!!collapsed['ontrack']}
          onToggle={() => toggle('ontrack')}
        >
          {filteredOnTrack.length === 0
            ? <Empty text={onTrack.length === 0 ? 'Nothing else assigned to you right now.' : 'No matches for current filters.'} />
            : filteredOnTrack.map((c) => (
              <QueueRow key={c.id} candidateId={c.id} users={users} onOpen={() => setSelectedCandidate(c.id)} />
            ))}
        </Section>
      </div>
    </div>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  count: number
  accent?: 'accent' | 'danger'
  collapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}

function Section({ title, count, accent, collapsed, onToggle, children }: SectionProps) {
  const labelColor =
    accent === 'accent' ? 'text-accent' : accent === 'danger' ? 'text-danger' : 'text-text-secondary'
  const badgeColor =
    accent === 'accent'
      ? 'bg-accent/10 text-accent'
      : accent === 'danger'
        ? 'bg-danger/10 text-danger'
        : 'bg-surface-elevated text-text-muted'
  const icon = accent === 'accent' ? '⚡' : accent === 'danger' ? '●' : '●'

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="mb-1.5 flex w-full items-center gap-1.5 py-0.5 text-left"
      >
        {collapsed ? (
          <ChevronRight className={`h-3.5 w-3.5 ${labelColor}`} />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 ${labelColor}`} />
        )}
        <span className={`text-meta font-semibold ${labelColor}`}>
          {accent ? <span className="mr-1">{icon}</span> : null}
          {title}
        </span>
        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-caption font-medium ${badgeColor}`}>
          {count}
        </span>
      </button>

      {!collapsed && <div className="flex flex-col gap-1">{children}</div>}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-card border border-dashed border-border px-4 py-4 text-center text-caption text-text-muted">
      {text}
    </div>
  )
}

// ─── Queue Row ───────────────────────────────────────────────────────────────

function QueueRow({ candidateId, users, onOpen }: { candidateId: string; users: ReturnType<typeof useStore.getState>['users']; onOpen: () => void }) {
  const candidate = useStore((s) => s.candidateById(candidateId))
  if (!candidate) return null

  const st = slaState(candidate.slaDeadline, candidate.stageEnteredAt)
  const sl = statusLine(candidate, users)

  const dueColor =
    sl.stalled
      ? 'text-warning'
      : st === 'breach' || st === 'at_risk'
        ? 'text-danger'
        : st === 'warning'
          ? 'text-warning'
          : 'text-text-muted'

  const rowBg =
    st === 'breach' || st === 'at_risk'
      ? 'bg-danger/[0.03] border-l-2 border-l-danger'
      : sl.stalled
        ? 'bg-warning/[0.03] border-l-2 border-l-warning'
        : ''

  return (
    <button
      onClick={onOpen}
      className={`flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2 text-left transition-colors duration-micro hover:bg-surface-elevated ${rowBg}`}
    >
      <Avatar userId={candidate.currentAssigneeId} size={20} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-caption font-medium text-text-primary">{candidate.name}</span>
          <span className="shrink-0 text-caption text-text-muted">·</span>
          <span className="truncate text-caption text-text-muted">{candidate.role}</span>
        </div>
        <div className="truncate text-caption text-text-secondary">
          {sl.nextAction ?? sl.currentPosition}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className={`text-caption font-medium ${dueColor}`}>
          {sl.nextDue ?? (sl.stalled ? 'Stalled' : '')}
        </div>
        <div className="text-caption text-text-muted">{candidate.currentStage}</div>
      </div>
    </button>
  )
}
