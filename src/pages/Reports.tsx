import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react'
import { format } from 'date-fns'
import type { Candidate, Stage } from '../types'
import { STAGES } from '../types'
import { useStore } from '../store/useStore'
import { statusLine, type StatusLineResult } from '../lib/statusLine'
import { slaState, formatSlaLabel } from '../lib/stageEngine'
import { buildCsvExport, downloadCsv } from '../lib/csvExport'

// ── Stage group palette ───────────────────────────────────────────────────────
// Five hue families with ΔH ≥ 45° between adjacent pairs — CVD-safe.
// Fixed assignment; never cycled.
type StageGroup = 'screening' | 'assessment' | 'interviews' | 'offer' | 'onboarding'

const STAGE_GROUP: Record<Stage, StageGroup> = {
  'Applied':                'screening',
  'Screening Scheduled':    'screening',
  'Phone Screen':           'screening',
  'Assessment to Send':     'assessment',
  'Assessment Pending':     'assessment',
  'Assessment Review':      'assessment',
  'Round N Scheduling':     'interviews',
  'Round N In Progress':    'interviews',
  'Pending Feedback':       'interviews',
  'Debrief / Decision':     'interviews',
  'Offer Prep':             'offer',
  'Offer Pending Approval': 'offer',
  'Offer Extended':         'offer',
  'Offer Accepted':         'onboarding',
}

const GROUP_STYLE: Record<StageGroup, { pill: string; dot: string; label: string }> = {
  screening:  { dot: 'bg-sky-500',     pill: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',             label: 'Screening' },
  assessment: { dot: 'bg-amber-500',   pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',     label: 'Assessment' },
  interviews: { dot: 'bg-purple-500',  pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200', label: 'Interviews' },
  offer:      { dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200', label: 'Offer' },
  onboarding: { dot: 'bg-teal-500',    pill: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',         label: 'Onboarding' },
}

// ── "Waiting on" system ───────────────────────────────────────────────────────
// The primary visual signal. Every row gets exactly one category, derived
// from stage + sub-status at render time — never stored.
// Left border + colored chip both reflect the category so it reads at a glance.

type WaitingOn = 'you' | 'candidate' | 'interviewer' | 'recruiter_hm' | 'hr_it' | 'stalled'

const WAITING_STYLE: Record<WaitingOn, { label: string; border: string; pill: string; dot: string; num: string }> = {
  you:          { label: 'Needs Your Action', border: 'border-l-blue-500',    dot: 'bg-blue-500',    pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',         num: 'text-blue-600 dark:text-blue-400' },
  candidate:    { label: 'Pending Candidate', border: 'border-l-amber-500',   dot: 'bg-amber-500',   pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',     num: 'text-amber-600 dark:text-amber-400' },
  interviewer:  { label: 'Awaiting Feedback', border: 'border-l-purple-500',  dot: 'bg-purple-500',  pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200', num: 'text-purple-600 dark:text-purple-400' },
  recruiter_hm: { label: 'Recruiter / HM',   border: 'border-l-emerald-500', dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200', num: 'text-emerald-600 dark:text-emerald-400' },
  hr_it:        { label: 'HR / IT',          border: 'border-l-teal-500',    dot: 'bg-teal-500',    pill: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',         num: 'text-teal-600 dark:text-teal-400' },
  stalled:      { label: 'Stalled',          border: 'border-l-orange-500',  dot: 'bg-orange-500',  pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200', num: 'text-orange-600 dark:text-orange-400' },
}

const ROUND_STAGES = new Set<Stage>(['Round N Scheduling', 'Round N In Progress', 'Pending Feedback', 'Debrief / Decision'])
const WAITING_ORDER: Record<WaitingOn, number> = { stalled: 0, you: 1, candidate: 2, interviewer: 3, recruiter_hm: 4, hr_it: 5 }

function deriveWaitingOn(c: Candidate, sl: StatusLineResult, currentUserId: string): WaitingOn {
  if (sl.stalled) return 'stalled'

  const activeRound = ROUND_STAGES.has(c.currentStage)
    ? (c.interviewRounds.find((r) => !r.roundCompletedAt) ?? c.interviewRounds[c.interviewRounds.length - 1])
    : null

  // Candidate-blocked: they need to reply, book, complete, or sign
  if (activeRound?.subStatus === 'availability_requested') return 'candidate'
  if (activeRound?.subStatus === 'scheduled') return 'candidate'
  if (c.currentStage === 'Assessment Pending') return 'candidate'
  if (c.currentStage === 'Offer Extended') return 'candidate'

  // Feedback awaited from interviewers
  if (activeRound?.subStatus === 'awaiting_feedback') return 'interviewer'

  // Decision / approval needed from recruiter or HM
  if (activeRound?.subStatus === 'feedback_complete') return 'recruiter_hm'
  if (c.currentStage === 'Debrief / Decision') return 'recruiter_hm'
  if (c.currentStage === 'Offer Pending Approval') return 'recruiter_hm'

  // HR Ops / IT
  if (sl.nextOwnerName === 'HR Ops' || sl.nextOwnerName === 'IT') return 'hr_it'

  // If the current user is assignee / RC / recruiter → it's on them
  if (c.currentAssigneeId === currentUserId || c.rcId === currentUserId || c.recruiterId === currentUserId) return 'you'

  return 'recruiter_hm'
}

// ── Source helpers ────────────────────────────────────────────────────────────
function isAgency(source: string): boolean {
  const s = source.toLowerCase()
  return s.includes('agency') || s.includes('staffing') || s.includes('recruiter') || s.includes('headhunt') || s.includes('firm')
}

// ── Misc helpers ──────────────────────────────────────────────────────────────
const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s, i])) as Record<string, number>

function daysInStage(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

type SortKey = 'name' | 'stage' | 'days' | 'waiting'
type SortDir = 'asc' | 'desc'

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoundPills({ candidate }: { candidate: Candidate }) {
  if (!candidate.interviewRounds.length) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {candidate.interviewRounds.map((r) => {
        const done = !!r.roundCompletedAt
        return (
          <span
            key={r.id}
            title={done ? `Round ${r.roundNumber} complete` : `Round ${r.roundNumber}: ${r.subStatus.replace(/_/g, ' ')}`}
            className={`inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-semibold tracking-wide ${
              done
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:ring-purple-700'
            }`}
          >
            R{r.roundNumber}&nbsp;{done ? '✓' : '→'}
          </span>
        )
      })}
    </div>
  )
}

function SummaryCard({
  waiting, count, active, onClick,
}: { waiting: WaitingOn; count: number; active: boolean; onClick: () => void }) {
  const s = WAITING_STYLE[waiting]
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start rounded-card border px-3 py-2.5 text-left transition-all hover:shadow-sm ${
        active ? `${s.pill} border-transparent` : 'border-border bg-surface hover:bg-surface-elevated'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        <span className="text-caption text-text-muted">{s.label}</span>
      </div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${s.num}`}>{count}</div>
    </button>
  )
}

function SortTh({ label, col, current, dir, onSort }: { label: string; col: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void }) {
  const active = current === col
  return (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-wide text-text-muted hover:text-text-secondary"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {active && (dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </span>
    </th>
  )
}

function Th({ label }: { label: string }) {
  return <th className="whitespace-nowrap px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-wide text-text-muted">{label}</th>
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function Reports() {
  const candidates = useStore((s) => s.candidates)
  const users = useStore((s) => s.users)
  const trackers = useStore((s) => s.newHireTrackers)
  const drafts = useStore((s) => s.agentDrafts)
  const setSelected = useStore((s) => s.setSelectedCandidate)
  const currentUser = useStore((s) => s.currentUser())

  // Enrich once per render — filter + sort operate on this stable array
  const rows = useMemo(
    () =>
      candidates
        .filter((c) => !c.tags.includes('Rejected'))
        .map((c) => {
          const tracker = trackers[c.id]
          const sl = statusLine(c, users, tracker)
          const waitingOn = deriveWaitingOn(c, sl, currentUser.id)
          const days = daysInStage(c.stageEnteredAt)
          const sla = slaState(c.slaDeadline, c.stageEnteredAt)
          const pendingDraft = drafts.some((d) => d.candidateId === c.id && d.status === 'pending')
          return { c, sl, waitingOn, days, sla, pendingDraft }
        }),
    [candidates, users, trackers, drafts, currentUser.id],
  )

  // ── Filter state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [waitingFilter, setWaitingFilter] = useState<WaitingOn | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState<StageGroup | 'all'>('all')
  const [daysFilter, setDaysFilter] = useState<'any' | '1' | '3' | '5'>('any')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [agencyFilter, setAgencyFilter] = useState('all')

  // ── Sort state ────────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>('waiting')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(col: SortKey) {
    if (sortKey === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(col); setSortDir('asc') }
  }

  // ── Derived lists ─────────────────────────────────────────────────────────────
  const allSources = useMemo(() => [...new Set(candidates.map((c) => c.source))].sort(), [candidates])
  const agencySources = useMemo(() => allSources.filter(isAgency), [allSources])
  const directSources = useMemo(() => allSources.filter((s) => !isAgency(s)), [allSources])

  const counts = useMemo(() => {
    const acc: Partial<Record<WaitingOn, number>> = {}
    for (const r of rows) acc[r.waitingOn] = (acc[r.waitingOn] ?? 0) + 1
    return acc
  }, [rows])

  // ── Filtered + sorted rows ────────────────────────────────────────────────────
  const visible = useMemo(() => {
    const q = search.toLowerCase()
    const minDays = daysFilter === '1' ? 1 : daysFilter === '3' ? 3 : daysFilter === '5' ? 5 : 0

    const filtered = rows.filter(({ c, waitingOn, days }) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.role.toLowerCase().includes(q) && !c.department.toLowerCase().includes(q)) return false
      if (waitingFilter !== 'all' && waitingOn !== waitingFilter) return false
      if (groupFilter !== 'all' && STAGE_GROUP[c.currentStage] !== groupFilter) return false
      if (days < minDays) return false
      if (sourceFilter === 'agency') {
        if (!isAgency(c.source)) return false
        if (agencyFilter !== 'all' && c.source !== agencyFilter) return false
      } else if (sourceFilter !== 'all' && c.source !== sourceFilter) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return dir * a.c.name.localeCompare(b.c.name)
      if (sortKey === 'stage') return dir * ((STAGE_IDX[a.c.currentStage] ?? 0) - (STAGE_IDX[b.c.currentStage] ?? 0))
      if (sortKey === 'days') return dir * (a.days - b.days)
      if (sortKey === 'waiting') return dir * ((WAITING_ORDER[a.waitingOn] ?? 9) - (WAITING_ORDER[b.waitingOn] ?? 9))
      return 0
    })
  }, [rows, search, waitingFilter, groupFilter, daysFilter, sourceFilter, agencyFilter, sortKey, sortDir])

  const anyFilter = !!(search || waitingFilter !== 'all' || groupFilter !== 'all' || daysFilter !== 'any' || sourceFilter !== 'all')

  function clearFilters() {
    setSearch(''); setWaitingFilter('all'); setGroupFilter('all')
    setDaysFilter('any'); setSourceFilter('all'); setAgencyFilter('all')
  }

  function handleExport() {
    downloadCsv(buildCsvExport(candidates, users, trackers), `pipeline-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-heading font-semibold text-text-primary">Pipeline Dashboard</h1>
          <p className="text-meta text-text-secondary">
            Live · {format(new Date(), 'EEEE, MMMM d')} · {rows.length} active candidates
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-button border border-border bg-surface px-3 py-2 text-meta font-medium text-text-primary transition-colors hover:bg-surface-elevated"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* ── Summary cards — click to filter by waiting-on category ── */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-3 border-b border-border px-6 py-4 sm:grid-cols-6">
        {(Object.keys(WAITING_STYLE) as WaitingOn[]).map((w) => (
          <SummaryCard
            key={w}
            waiting={w}
            count={counts[w] ?? 0}
            active={waitingFilter === w}
            onClick={() => setWaitingFilter((prev) => (prev === w ? 'all' : w))}
          />
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 border-b border-border bg-bg px-6 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            className="h-8 w-44 rounded-button border border-border bg-surface pl-8 pr-3 text-meta text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            placeholder="Name, role, dept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="h-8 rounded-button border border-border bg-surface px-2 text-meta text-text-primary focus:border-accent focus:outline-none"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value as StageGroup | 'all')}
        >
          <option value="all">All stages</option>
          {(Object.keys(GROUP_STYLE) as StageGroup[]).map((g) => (
            <option key={g} value={g}>{GROUP_STYLE[g].label}</option>
          ))}
        </select>

        <select
          className="h-8 rounded-button border border-border bg-surface px-2 text-meta text-text-primary focus:border-accent focus:outline-none"
          value={daysFilter}
          onChange={(e) => setDaysFilter(e.target.value as typeof daysFilter)}
        >
          <option value="any">Any duration</option>
          <option value="1">1+ days</option>
          <option value="3">3+ days</option>
          <option value="5">5+ days</option>
        </select>

        <select
          className="h-8 rounded-button border border-border bg-surface px-2 text-meta text-text-primary focus:border-accent focus:outline-none"
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setAgencyFilter('all') }}
        >
          <option value="all">All sources</option>
          <optgroup label="Direct">{directSources.map((s) => <option key={s} value={s}>{s}</option>)}</optgroup>
          {agencySources.length > 0 && (
            <optgroup label="Agency"><option value="agency">All agencies</option></optgroup>
          )}
        </select>

        {sourceFilter === 'agency' && agencySources.length > 1 && (
          <select
            className="h-8 rounded-button border border-border bg-surface px-2 text-meta text-text-primary focus:border-accent focus:outline-none"
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
          >
            <option value="all">All agencies</option>
            {agencySources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {anyFilter && (
          <button onClick={clearFilters} className="h-8 rounded-button px-2 text-meta text-text-muted hover:text-text-secondary">
            Clear
          </button>
        )}

        <span className="ml-auto whitespace-nowrap text-caption text-text-muted">
          {visible.length} of {rows.length} candidates
        </span>
      </div>

      {/* ── Pipeline table ── */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[700px] border-collapse text-meta">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface shadow-sm">
            <tr>
              <SortTh label="Candidate" col="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortTh label="Stage" col="stage" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortTh label="Waiting On" col="waiting" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <Th label="Next Step" />
              <SortTh label="Days" col="days" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <Th label="Due" />
            </tr>
          </thead>

          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-meta text-text-muted">
                  No candidates match the current filters.
                </td>
              </tr>
            )}

            {visible.map(({ c, sl, waitingOn, days, sla, pendingDraft }) => {
              const gs = GROUP_STYLE[STAGE_GROUP[c.currentStage]]
              const ws = WAITING_STYLE[waitingOn]

              const rowBg =
                waitingOn === 'stalled'
                  ? 'bg-orange-50/50 dark:bg-orange-900/[0.07] hover:bg-orange-50 dark:hover:bg-orange-900/10'
                  : sla === 'breach' || sla === 'at_risk'
                    ? 'bg-red-50/40 dark:bg-red-900/[0.07] hover:bg-red-50/60 dark:hover:bg-red-900/10'
                    : 'hover:bg-surface-elevated'

              return (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`cursor-pointer border-b border-border transition-colors duration-micro ${rowBg}`}
                >

                  {/* ── Candidate (left border = waiting-on color) ── */}
                  <td className={`border-l-[3px] ${ws.border} px-3 py-2.5`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-text-primary">{c.name}</span>
                      {pendingDraft && (
                        <span title="Draft awaiting your approval" className="h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                    <div className="text-caption text-text-muted">{c.role} · {c.department}</div>
                  </td>

                  {/* ── Stage pill + round progress ── */}
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-tag px-2 py-0.5 text-caption font-medium ${gs.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${gs.dot}`} />
                      {c.currentStage}
                    </span>
                    <RoundPills candidate={c} />
                  </td>

                  {/* ── Waiting on chip — primary visual signal ── */}
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-tag px-2 py-0.5 text-caption font-medium ${ws.pill}`}>
                      {ws.label}
                    </span>
                  </td>

                  {/* ── Next step ── */}
                  <td className="max-w-[260px] px-3 py-2.5">
                    <span className={`line-clamp-2 text-caption ${sl.stalled ? 'italic text-text-muted' : 'text-text-secondary'}`}>
                      {sl.nextAction ?? (sl.stalled ? 'No next step assigned' : sl.currentPosition)}
                    </span>
                  </td>

                  {/* ── Days in stage ── */}
                  <td className="px-3 py-2.5 text-center">
                    <span className={`tabular-nums text-caption font-medium ${days >= 5 ? 'text-warning' : 'text-text-muted'}`}>
                      {days}d
                    </span>
                  </td>

                  {/* ── SLA / due date ── */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className={`text-caption ${
                      sla === 'breach' || sla === 'at_risk'
                        ? 'font-semibold text-danger'
                        : sla === 'warning'
                          ? 'font-medium text-warning'
                          : 'text-text-muted'
                    }`}>
                      {sl.nextDue ?? formatSlaLabel(c.slaDeadline)}
                    </span>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border bg-bg px-6 py-2">
        <span className="text-caption font-semibold text-text-muted">Waiting on:</span>
        {(Object.entries(WAITING_STYLE) as [WaitingOn, (typeof WAITING_STYLE)[WaitingOn]][]).map(([k, s]) => (
          <span key={k} className="flex items-center gap-1 text-caption text-text-muted">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
          </span>
        ))}
        <span className="ml-3 text-caption font-semibold text-text-muted">Stage:</span>
        {(Object.entries(GROUP_STYLE) as [StageGroup, (typeof GROUP_STYLE)[StageGroup]][]).map(([k, s]) => (
          <span key={k} className="flex items-center gap-1 text-caption text-text-muted">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
          </span>
        ))}
      </div>

    </div>
  )
}
