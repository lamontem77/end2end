import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, Search, Filter } from 'lucide-react'
import { useStore } from '../store/useStore'
import { slaState } from '../lib/stageEngine'
import { statusLine } from '../lib/statusLine'
import { DraftApprovalCard } from '../components/scheduling/DraftApprovalCard'
import { Avatar } from '../components/ui/Avatar'
import type { Candidate } from '../types'

type ViewTab = 'all' | 'approvals' | 'scheduling' | 'assessment' | 'at_risk'

const SCHEDULING_STAGES = new Set([
  'Screening Scheduled', 'Phone Screen',
  'Round N Scheduling', 'Round N In Progress',
  'Pending Feedback', 'Debrief / Decision',
])

const ASSESSMENT_STAGES = new Set([
  'Assessment to Send', 'Assessment Pending', 'Assessment Review',
])

export function MyQueue() {
  const currentUser = useStore((s) => s.currentUser())
  const allCandidates = useStore((s) => s.candidates)
  const allDrafts = useStore((s) => s.agentDrafts)
  const users = useStore((s) => s.users)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)

  const candidates = allCandidates.filter((c) => !c.tags.includes('Rejected'))
  const pendingDrafts = allDrafts.filter((d) => d.status === 'pending')

  const [tab, setTab] = useState<ViewTab>('all')
  const [reqFilter, setReqFilter] = useState('')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Scope: candidates I own (as RC, recruiter, or current assignee)
  const mine = useMemo(
    () =>
      candidates.filter(
        (c) =>
          c.currentAssigneeId === currentUser.id ||
          c.rcId === currentUser.id ||
          c.recruiterId === currentUser.id,
      ),
    [candidates, currentUser.id],
  )

  const myDrafts = pendingDrafts.filter((d) => {
    const c = candidates.find((x) => x.id === d.candidateId)
    return c?.rcId === currentUser.id || c?.recruiterId === currentUser.id || c?.currentAssigneeId === currentUser.id
  })

  const overdue = mine.filter((c) => {
    const s = slaState(c.slaDeadline, c.stageEnteredAt)
    return s === 'breach' || s === 'at_risk'
  })

  const scheduling = mine.filter((c) => SCHEDULING_STAGES.has(c.currentStage))
  const assessment = mine.filter((c) => ASSESSMENT_STAGES.has(c.currentStage))
  const rest = mine.filter(
    (c) => !overdue.includes(c) && !scheduling.includes(c) && !assessment.includes(c),
  )

  const TABS: { key: ViewTab; label: string; count: number; accent?: boolean }[] = [
    { key: 'all',        label: 'All',        count: mine.length + myDrafts.length },
    { key: 'approvals',  label: 'Approvals',  count: myDrafts.length,    accent: myDrafts.length > 0 },
    { key: 'scheduling', label: 'Scheduling', count: scheduling.length },
    { key: 'assessment', label: 'Assessment', count: assessment.length },
    { key: 'at_risk',    label: 'At Risk',    count: overdue.length,     accent: overdue.length > 0 },
  ]

  const allReqs = useMemo(
    () => Array.from(new Set(mine.map((c) => c.role))).sort(),
    [mine],
  )

  function filter(list: Candidate[]) {
    return list.filter((c) => {
      if (reqFilter && c.role !== reqFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
        )
      }
      return true
    })
  }

  function toggle(key: string) {
    setCollapsed((p) => ({ ...p, [key]: !p[key] }))
  }

  const showApprovals = tab === 'all' || tab === 'approvals'
  const showAtRisk    = tab === 'all' || tab === 'at_risk'
  const showSched     = tab === 'all' || tab === 'scheduling'
  const showAssess    = tab === 'all' || tab === 'assessment'
  const showRest      = tab === 'all'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-semibold text-text-primary">Queue — {currentUser.name}</h1>
          <p className="text-meta text-text-secondary">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border px-6 pt-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-t-button px-3 py-2 text-meta font-medium transition-colors duration-micro ${
              tab === t.key
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`rounded-tag px-1.5 py-0.5 text-caption font-mono ${
                  t.accent
                    ? 'bg-accent/15 text-accent'
                    : tab === t.key
                      ? 'bg-accent/10 text-accent'
                      : 'bg-surface-elevated text-text-muted'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg px-6 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, role…"
            className="h-7 w-44 rounded-button border border-border bg-surface pl-7 pr-2 text-caption text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-3">
        {showApprovals && myDrafts.length > 0 && (
          <Section
            title="Needs Your Approval"
            count={myDrafts.length}
            accent="accent"
            collapsed={!!collapsed['drafts']}
            onToggle={() => toggle('drafts')}
          >
            {myDrafts.map((d) => <DraftApprovalCard key={d.id} draft={d} />)}
          </Section>
        )}

        {showAtRisk && (
          <Section
            title="Overdue / At Risk"
            count={filter(overdue).length}
            accent="danger"
            collapsed={!!collapsed['overdue']}
            onToggle={() => toggle('overdue')}
          >
            {filter(overdue).length === 0
              ? <Empty text={overdue.length === 0 ? 'Nothing overdue.' : 'No matches.'} />
              : filter(overdue).map((c) => (
                <QueueRow key={c.id} candidateId={c.id} users={users} onOpen={() => setSelectedCandidate(c.id)} />
              ))}
          </Section>
        )}

        {showSched && (
          <Section
            title="Scheduling"
            count={filter(scheduling).length}
            collapsed={!!collapsed['scheduling']}
            onToggle={() => toggle('scheduling')}
          >
            {filter(scheduling).length === 0
              ? <Empty text="No scheduling items." />
              : filter(scheduling).map((c) => (
                <QueueRow key={c.id} candidateId={c.id} users={users} onOpen={() => setSelectedCandidate(c.id)} />
              ))}
          </Section>
        )}

        {showAssess && (
          <Section
            title="Assessment"
            count={filter(assessment).length}
            collapsed={!!collapsed['assessment']}
            onToggle={() => toggle('assessment')}
          >
            {filter(assessment).length === 0
              ? <Empty text="No assessment items." />
              : filter(assessment).map((c) => (
                <QueueRow key={c.id} candidateId={c.id} users={users} onOpen={() => setSelectedCandidate(c.id)} />
              ))}
          </Section>
        )}

        {showRest && rest.length > 0 && (
          <Section
            title="Other Assigned"
            count={filter(rest).length}
            collapsed={!!collapsed['rest']}
            onToggle={() => toggle('rest')}
          >
            {filter(rest).map((c) => (
              <QueueRow key={c.id} candidateId={c.id} users={users} onOpen={() => setSelectedCandidate(c.id)} />
            ))}
          </Section>
        )}

        {mine.length === 0 && myDrafts.length === 0 && (
          <div className="flex h-40 items-center justify-center text-meta text-text-muted">
            Nothing in your queue right now.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({
  title, count, accent, collapsed, onToggle, children,
}: {
  title: string
  count: number
  accent?: 'accent' | 'danger'
  collapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const labelColor =
    accent === 'accent' ? 'text-accent' : accent === 'danger' ? 'text-danger' : 'text-text-secondary'
  const badgeColor =
    accent === 'accent'
      ? 'bg-accent/10 text-accent'
      : accent === 'danger'
        ? 'bg-danger/10 text-danger'
        : 'bg-surface-elevated text-text-muted'

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="mb-1.5 flex w-full items-center gap-1.5 py-0.5 text-left"
      >
        {collapsed
          ? <ChevronRight className={`h-3.5 w-3.5 ${labelColor}`} />
          : <ChevronDown className={`h-3.5 w-3.5 ${labelColor}`} />}
        <span className={`text-meta font-semibold ${labelColor}`}>{title}</span>
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
    <div className="rounded-card border border-dashed border-border px-4 py-3 text-center text-caption text-text-muted">
      {text}
    </div>
  )
}

// ─── Queue Row ────────────────────────────────────────────────────────────────

function QueueRow({
  candidateId,
  users,
  onOpen,
}: {
  candidateId: string
  users: ReturnType<typeof useStore.getState>['users']
  onOpen: () => void
}) {
  const candidate = useStore((s) => s.candidateById(candidateId))
  if (!candidate) return null

  const st = slaState(candidate.slaDeadline, candidate.stageEnteredAt)
  const sl = statusLine(candidate, users)

  const dueColor =
    st === 'breach' || st === 'at_risk'
      ? 'text-danger'
      : st === 'warning'
        ? 'text-warning'
        : sl.stalled
          ? 'text-warning'
          : 'text-text-muted'

  const leftBorder =
    st === 'breach' || st === 'at_risk'
      ? 'border-l-2 border-l-danger'
      : sl.stalled
        ? 'border-l-2 border-l-warning'
        : ''

  return (
    <button
      onClick={onOpen}
      className={`flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2 text-left transition-colors duration-micro hover:bg-surface-elevated ${leftBorder}`}
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
