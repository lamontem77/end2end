import { useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, Download, RefreshCw, Search, Zap } from 'lucide-react'
import { format } from 'date-fns'
import type { AgentDraft, Candidate, Stage } from '../types'
import { STAGES } from '../types'
import { useStore } from '../store/useStore'
import { statusLine } from '../lib/statusLine'
import { slaState, formatSlaLabel } from '../lib/stageEngine'
import { SUB_STATUS_LABEL } from '../lib/subStatus'
import { buildCsvExport, downloadCsv } from '../lib/csvExport'

// ── Stage group & categorical palette ────────────────────────────────────────
// Five hue families: sky (screening) · amber (assessment) · purple (interviews)
// · emerald (offer) · teal (onboarding). Fixed assignment — never cycled.
// Adjacent families have ΔH ≥ 45° so CVD-variant pairs remain distinct.

type StageGroup = 'screening' | 'assessment' | 'interviews' | 'offer' | 'onboarding'

const STAGE_GROUP: Record<Stage, StageGroup> = {
  'Applied': 'screening',
  'Screening Scheduled': 'screening',
  'Phone Screen': 'screening',
  'Assessment to Send': 'assessment',
  'Assessment Pending': 'assessment',
  'Assessment Review': 'assessment',
  'Round N Scheduling': 'interviews',
  'Round N In Progress': 'interviews',
  'Pending Feedback': 'interviews',
  'Debrief / Decision': 'interviews',
  'Offer Prep': 'offer',
  'Offer Pending Approval': 'offer',
  'Offer Extended': 'offer',
  'Offer Accepted': 'onboarding',
}

const GROUP_STYLE: Record<StageGroup, { pill: string; dot: string; label: string }> = {
  screening:  { pill: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',         dot: 'bg-sky-500',     label: 'Screening' },
  assessment: { pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200', dot: 'bg-amber-500',   label: 'Assessment' },
  interviews: { pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200', dot: 'bg-purple-500', label: 'Interviews' },
  offer:      { pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200', dot: 'bg-emerald-500', label: 'Offer' },
  onboarding: { pill: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',     dot: 'bg-teal-500',    label: 'Onboarding' },
}

// ── Source palette ─────────────────────────────────────────────────────────────
function sourceClass(source: string): string {
  const s = source.toLowerCase()
  if (s === 'linkedin') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
  if (s === 'referral') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  if (isAgency(source)) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function isAgency(source: string): boolean {
  const s = source.toLowerCase()
  return s.includes('agency') || s.includes('staffing') || s.includes('recruiter') || s.includes('headhunt') || s.includes('firm')
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s, i])) as Record<string, number>
const SLA_SEVERITY: Record<string, number> = { at_risk: 0, breach: 1, warning: 2, ok: 3 }

function daysInStage(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

// A candidate is flagged as "rescheduled" when a nudge event appears in their
// log OR when more than one outbound email/draft-approval fired, implying at
// least one scheduling attempt failed and a new one was sent.
function wasRescheduled(c: Candidate): boolean {
  return (
    c.activityLog.some((e) => e.type === 'candidate_nudged') ||
    c.activityLog.filter((e) => e.type === 'email_sent').length > 1
  )
}

function hasPendingDraft(candidateId: string, drafts: AgentDraft[]): boolean {
  return drafts.some((d) => d.candidateId === candidateId && d.status === 'pending')
}

// ── Sort ───────────────────────────────────────────────────────────────────────
type SortKey = 'name' | 'stage' | 'days' | 'sla'
type SortDir = 'asc' | 'desc'

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Compact round-progress pills: R1 ✓  R2 → */
function RoundPills({ candidate }: { candidate: Candidate }) {
  const rounds = candidate.interviewRounds
  if (!rounds.length) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {rounds.map((r) => {
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

/** Stat tile */
function Tile({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  const numColors: Record<string, string> = {
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    orange: 'text-orange-500 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    teal: 'text-teal-600 dark:text-teal-400',
  }
  const numColor = (accent && numColors[accent]) ?? 'text-text-primary'
  return (
    <div className="rounded-card border border-border bg-surface p-3">
      <div className="text-caption text-text-muted">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${numColor}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-text-muted">{sub}</div>}
    </div>
  )
}

/** Sortable column header */
function SortTh({
  label, col, current, dir, onSort,
}: { label: string; col: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void }) {
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

/** Non-sortable column header */
function Th({ label }: { label: string }) {
  return (
    <th className="whitespace-nowrap px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-wide text-text-muted">
      {label}
    </th>
  )
}

// ── Reports page ────────────────────────────────────────────────────────────────
export function Reports() {
  const candidates = useStore((s) => s.candidates)
  const users = useStore((s) => s.users)
  const trackers = useStore((s) => s.newHireTrackers)
  const drafts = useStore((s) => s.agentDrafts)
  const setSelected = useStore((s) => s.setSelectedCandidate)

  // Enriched rows — computed once per render, never re-derived per-filter
  const rows = useMemo(
    () =>
      candidates
        .filter((c) => !c.tags.includes('Rejected'))
        .map((c) => {
          const tracker = trackers[c.id]
          const sl = statusLine(c, users, tracker)
          const state = slaState(c.slaDeadline, c.stageEnteredAt)
          return {
            c,
            sl,
            state,
            days: daysInStage(c.stageEnteredAt),
            rescheduled: wasRescheduled(c),
            pendingDraft: hasPendingDraft(c.id, drafts),
          }
        }),
    [candidates, users, trackers, drafts],
  )

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState<StageGroup | 'all'>('all')
  const [slaFilter, setSlaFilter] = useState<'all' | 'warning' | 'breach' | 'stalled'>('all')
  const [rescheduledOnly, setRescheduledOnly] = useState(false)

  // ── Sort state ───────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>('sla')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(col: SortKey) {
    if (sortKey === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(col); setSortDir('asc') }
  }

  // ── Source lists ─────────────────────────────────────────────────────────────
  const allSources = useMemo(() => [...new Set(candidates.map((c) => c.source))].sort(), [candidates])
  const agencySources = useMemo(() => allSources.filter(isAgency), [allSources])
  const directSources = useMemo(() => allSources.filter((s) => !isAgency(s)), [allSources])

  // ── Filtered + sorted rows ───────────────────────────────────────────────────
  const visible = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = rows.filter(({ c, sl, state, rescheduled }) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.role.toLowerCase().includes(q) && !c.department.toLowerCase().includes(q)) return false
      if (sourceFilter === 'agency') {
        if (!isAgency(c.source)) return false
        if (agencyFilter !== 'all' && c.source !== agencyFilter) return false
      } else if (sourceFilter !== 'all' && c.source !== sourceFilter) return false
      if (groupFilter !== 'all' && STAGE_GROUP[c.currentStage] !== groupFilter) return false
      if (slaFilter === 'stalled' && !sl.stalled) return false
      if (slaFilter === 'breach' && state !== 'breach' && state !== 'at_risk') return false
      if (slaFilter === 'warning' && state !== 'warning') return false
      if (rescheduledOnly && !rescheduled) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return dir * a.c.name.localeCompare(b.c.name)
      if (sortKey === 'stage') return dir * ((STAGE_IDX[a.c.currentStage] ?? 0) - (STAGE_IDX[b.c.currentStage] ?? 0))
      if (sortKey === 'days') return dir * (a.days - b.days)
      if (sortKey === 'sla') {
        const ao = a.sl.stalled ? -1 : (SLA_SEVERITY[a.state] ?? 3)
        const bo = b.sl.stalled ? -1 : (SLA_SEVERITY[b.state] ?? 3)
        return dir * (ao - bo)
      }
      return 0
    })
  }, [rows, search, sourceFilter, agencyFilter, groupFilter, slaFilter, rescheduledOnly, sortKey, sortDir])

  // ── Summary stats ────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: rows.length,
      stalled: rows.filter((r) => r.sl.stalled).length,
      atRisk: rows.filter((r) => r.state === 'breach' || r.state === 'at_risk').length,
      interviews: rows.filter((r) => STAGE_GROUP[r.c.currentStage] === 'interviews').length,
      offer: rows.filter((r) => STAGE_GROUP[r.c.currentStage] === 'offer' || STAGE_GROUP[r.c.currentStage] === 'onboarding').length,
      rescheduled: rows.filter((r) => r.rescheduled).length,
    }),
    [rows],
  )

  const anyFilter = !!(search || sourceFilter !== 'all' || groupFilter !== 'all' || slaFilter !== 'all' || rescheduledOnly)

  function clearFilters() {
    setSearch('')
    setSourceFilter('all')
    setAgencyFilter('all')
    setGroupFilter('all')
    setSlaFilter('all')
    setRescheduledOnly(false)
  }

  function handleExport() {
    const csv = buildCsvExport(candidates, users, trackers)
    downloadCsv(csv, `pipeline-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-heading font-semibold text-text-primary">Pipeline Report</h1>
          <p className="text-meta text-text-secondary">Live · {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-button border border-border bg-surface px-3 py-2 text-meta font-medium text-text-primary transition-colors hover:bg-surface-elevated"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* ── Stat tiles ── */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-3 border-b border-border px-6 py-4 sm:grid-cols-6">
        <Tile label="Active" value={stats.total} />
        <Tile label="Stalled" value={stats.stalled} accent="orange" sub="no next step" />
        <Tile label="SLA at Risk" value={stats.atRisk} accent="red" sub="breach / escalated" />
        <Tile label="In Interviews" value={stats.interviews} accent="purple" />
        <Tile label="Offer / Onboard" value={stats.offer} accent="emerald" />
        <Tile label="Rescheduled" value={stats.rescheduled} accent="amber" sub="at least once" />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 border-b border-border bg-surface-elevated/40 px-6 py-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            className="h-8 w-48 rounded-button border border-border bg-surface pl-8 pr-3 text-meta text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            placeholder="Name, role, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Source */}
        <select
          className="h-8 rounded-button border border-border bg-surface px-2 text-meta text-text-primary focus:border-accent focus:outline-none"
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setAgencyFilter('all') }}
        >
          <option value="all">All sources</option>
          <optgroup label="Direct">
            {directSources.map((s) => <option key={s} value={s}>{s}</option>)}
          </optgroup>
          {agencySources.length > 0 && (
            <optgroup label="Agency">
              <option value="agency">All agencies</option>
            </optgroup>
          )}
        </select>

        {/* Agency sub-filter */}
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

        {/* Stage group */}
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

        {/* SLA */}
        <select
          className="h-8 rounded-button border border-border bg-surface px-2 text-meta text-text-primary focus:border-accent focus:outline-none"
          value={slaFilter}
          onChange={(e) => setSlaFilter(e.target.value as typeof slaFilter)}
        >
          <option value="all">All SLA</option>
          <option value="warning">Warning</option>
          <option value="breach">Breach / At Risk</option>
          <option value="stalled">Stalled</option>
        </select>

        {/* Rescheduled toggle */}
        <button
          onClick={() => setRescheduledOnly((v) => !v)}
          className={`flex h-8 items-center gap-1.5 rounded-button border px-2.5 text-meta font-medium transition-colors ${
            rescheduledOnly
              ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
              : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Rescheduled
        </button>

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
        <table className="w-full min-w-[960px] border-collapse text-meta">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface shadow-sm">
            <tr>
              <SortTh label="Candidate" col="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortTh label="Stage" col="stage" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <Th label="Status" />
              <Th label="Next Action" />
              <Th label="Owner" />
              <SortTh label="SLA" col="sla" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortTh label="Days" col="days" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <Th label="Source" />
              <Th label="" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-meta text-text-muted">
                  No candidates match the current filters.
                </td>
              </tr>
            )}
            {visible.map(({ c, sl, state, days, rescheduled, pendingDraft }) => {
              const group = STAGE_GROUP[c.currentStage]
              const gs = GROUP_STYLE[group]
              const isRoundStage = group === 'interviews'
              const activeRound = isRoundStage
                ? (c.interviewRounds.find((r) => !r.roundCompletedAt) ?? c.interviewRounds[c.interviewRounds.length - 1])
                : null

              // Row-level tint for worst state only
              const rowTint =
                state === 'at_risk' || state === 'breach'
                  ? 'bg-danger/[0.025] hover:bg-danger/[0.04]'
                  : sl.stalled
                    ? 'bg-warning/[0.025] hover:bg-warning/[0.04]'
                    : 'hover:bg-surface-elevated'

              return (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`cursor-pointer border-b border-border transition-colors ${rowTint}`}
                >

                  {/* ── Candidate name + role ── */}
                  <td className="px-3 py-3">
                    <div className="font-medium text-text-primary">{c.name}</div>
                    <div className="text-caption text-text-muted">{c.role} · {c.department}</div>
                  </td>

                  {/* ── Stage badge + round pills ── */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-tag px-2 py-0.5 text-caption font-medium ${gs.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${gs.dot}`} />
                      {c.currentStage}
                    </span>
                    <RoundPills candidate={c} />
                  </td>

                  {/* ── Status — what is happening right now ── */}
                  <td className="max-w-[220px] px-3 py-3">
                    {isRoundStage && activeRound ? (
                      <div>
                        <span
                          className={`text-caption font-medium ${
                            activeRound.subStatus === 'awaiting_feedback' || activeRound.subStatus === 'needs_scheduling' || activeRound.subStatus === 'feedback_complete'
                              ? 'text-orange-600 dark:text-orange-400'
                              : activeRound.subStatus === 'scheduled'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-text-secondary'
                          }`}
                        >
                          {SUB_STATUS_LABEL[activeRound.subStatus]}
                        </span>
                        {activeRound.subStatus === 'awaiting_feedback' && activeRound.interviewers.length > 0 && (
                          <div className="text-caption text-text-muted">
                            {activeRound.interviewers.filter((i) => i.status === 'submitted').length}/{activeRound.interviewers.length} scorecards in
                          </div>
                        )}
                        {activeRound.subStatus === 'scheduled' && activeRound.scheduledAt && (
                          <div className="text-caption text-text-muted">
                            {format(new Date(activeRound.scheduledAt), 'MMM d, h:mm a')}
                          </div>
                        )}
                        {activeRound.subStatus === 'availability_requested' && activeRound.requestSentAt && (
                          <div className="text-caption text-text-muted">
                            Sent {format(new Date(activeRound.requestSentAt), 'MMM d')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="line-clamp-2 text-caption text-text-secondary">{sl.currentPosition}</span>
                    )}
                  </td>

                  {/* ── Next Action ── */}
                  <td className="max-w-[200px] px-3 py-3">
                    {sl.nextAction ? (
                      <div className={`flex items-start gap-1 ${sl.stalled ? 'text-orange-600 dark:text-orange-400' : 'text-text-primary'}`}>
                        {sl.stalled
                          ? <AlertCircle className="mt-px h-3 w-3 shrink-0" />
                          : <Zap className="mt-px h-3 w-3 shrink-0 text-accent" />}
                        <span className="line-clamp-2 text-caption">{sl.nextAction}</span>
                      </div>
                    ) : sl.stalled ? (
                      <span className="text-caption font-medium text-orange-500">No next step</span>
                    ) : (
                      <span className="text-caption text-text-muted">—</span>
                    )}
                  </td>

                  {/* ── Owner ── */}
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="text-caption text-text-secondary">{sl.nextOwnerName ?? '—'}</span>
                  </td>

                  {/* ── SLA ── */}
                  <td className="whitespace-nowrap px-3 py-3">
                    {sl.stalled ? (
                      <span className="text-caption font-semibold text-orange-500">Stalled</span>
                    ) : state === 'breach' || state === 'at_risk' ? (
                      <span className="text-caption font-semibold text-danger">{formatSlaLabel(c.slaDeadline)}</span>
                    ) : state === 'warning' ? (
                      <span className="text-caption font-medium text-warning">{sl.nextDue ?? formatSlaLabel(c.slaDeadline)}</span>
                    ) : (
                      <span className="text-caption text-text-muted">{sl.nextDue ?? formatSlaLabel(c.slaDeadline)}</span>
                    )}
                  </td>

                  {/* ── Days in stage ── */}
                  <td className="px-3 py-3 text-center">
                    <span className={`tabular-nums text-caption ${days >= 5 ? 'font-semibold text-warning' : 'text-text-muted'}`}>
                      {days}d
                    </span>
                  </td>

                  {/* ── Source ── */}
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={`inline-flex items-center rounded-tag px-1.5 py-0.5 text-caption font-medium ${sourceClass(c.source)}`}>
                      {c.source}
                    </span>
                  </td>

                  {/* ── Flags ── */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {pendingDraft && (
                        <span title="Approval draft pending" className="rounded-full bg-accent/10 p-0.5 text-accent">
                          <Zap className="h-3 w-3" />
                        </span>
                      )}
                      {rescheduled && (
                        <span title="Rescheduled at least once" className="rounded-full bg-amber-100 p-0.5 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          <RefreshCw className="h-3 w-3" />
                        </span>
                      )}
                      {sl.stalled && !rescheduled && !pendingDraft && (
                        <span title="Stalled — no next step assigned" className="rounded-full bg-orange-100 p-0.5 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                          <AlertCircle className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border bg-surface-elevated/40 px-6 py-2.5">
        <span className="text-caption font-medium text-text-muted">Stage:</span>
        {(Object.entries(GROUP_STYLE) as [StageGroup, typeof GROUP_STYLE[StageGroup]][]).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1 text-caption text-text-muted">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        ))}
        <span className="ml-4 text-caption font-medium text-text-muted">Flags:</span>
        <span className="flex items-center gap-1 text-caption text-text-muted"><Zap className="h-3 w-3 text-accent" /> Draft pending</span>
        <span className="flex items-center gap-1 text-caption text-text-muted"><RefreshCw className="h-3 w-3 text-amber-500" /> Rescheduled</span>
        <span className="flex items-center gap-1 text-caption text-text-muted"><AlertCircle className="h-3 w-3 text-orange-500" /> Stalled</span>
        <span className="ml-4 text-caption font-medium text-text-muted">Rounds:</span>
        <span className="flex items-center gap-1 text-caption text-text-muted">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">R1 ✓</span>
          Complete
        </span>
        <span className="flex items-center gap-1 text-caption text-text-muted">
          <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 text-[10px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:ring-purple-700">R2 →</span>
          In progress
        </span>
      </div>
    </div>
  )
}
