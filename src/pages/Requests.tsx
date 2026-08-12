import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import { DraftApprovalCard } from '../components/scheduling/DraftApprovalCard'
import { InterviewRequestModal } from '../components/InterviewRequestModal'
import { slaState } from '../lib/stageEngine'

const SCHEDULING_STAGES = new Set([
  'Screening Scheduled',
  'Phone Screen',
  'Round N Scheduling',
  'Round N In Progress',
  'Pending Feedback',
  'Debrief / Decision',
  'Assessment to Send',
  'Assessment Pending',
  'Assessment Review',
])

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ok:       { label: 'On track',     cls: 'text-success' },
  warning:  { label: 'SLA warning',  cls: 'text-warning' },
  breach:   { label: 'Overdue',      cls: 'text-danger' },
  at_risk:  { label: 'At risk',      cls: 'text-danger' },
}

type Tab = 'requests' | 'drafts'

export function Requests() {
  const candidates = useStore((s) => s.candidates)
  const users = useStore((s) => s.users)
  const agentDrafts = useStore((s) => s.agentDrafts)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)
  const approveDraft = useStore((s) => s.approveDraft)

  const [tab, setTab] = useState<Tab>('requests')
  const [showModal, setShowModal] = useState(false)

  const requests = useMemo(
    () => candidates.filter((c) => SCHEDULING_STAGES.has(c.currentStage) && !c.tags.includes('Rejected')),
    [candidates],
  )

  const pendingDrafts = useMemo(
    () => agentDrafts.filter((d) => d.status === 'pending'),
    [agentDrafts],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-heading font-semibold text-text-primary">Coordination Requests</h1>
          <p className="mt-0.5 text-meta text-text-secondary">Every active scheduling request across all reqs — one place.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-meta font-medium text-white hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-6 pt-3">
        {([
          { key: 'requests' as Tab, label: 'All Open', count: requests.length },
          { key: 'drafts' as Tab, label: 'Agent Drafts', count: pendingDrafts.length, accent: true },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-t-button px-3 py-2 text-meta font-medium transition-colors duration-micro ${
              tab === t.key ? 'border-b-2 border-accent text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-tag px-1.5 py-0.5 text-caption font-mono ${
                t.accent && pendingDrafts.length > 0 ? 'bg-accent/20 text-accent' : 'bg-surface-elevated text-text-secondary'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* ── All Open Requests tab ── */}
        {tab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-meta text-text-muted">
                <Zap className="h-6 w-6 opacity-40" />
                <span>No open requests. Use + New Request to create one.</span>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-y-1">
                <thead>
                  <tr className="text-left text-caption font-medium uppercase tracking-wide text-text-muted">
                    <th className="px-3 py-2">Candidate</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Round / Type</th>
                    <th className="px-3 py-2">Requested by</th>
                    <th className="px-3 py-2">RC Owner</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((c) => {
                    const state = slaState(c.slaDeadline, c.stageEnteredAt)
                    const status = STATUS_LABEL[state] ?? STATUS_LABEL.ok
                    const rc = users.find((u) => u.id === c.rcId)
                    const requestedBy = users.find((u) => u.id === c.hiringManagerId)
                    const hasDraft = pendingDrafts.some((d) => d.candidateId === c.id)
                    const round = c.currentStage === 'Screening Scheduled' ? 'Phone Screen'
                      : c.currentStage.startsWith('Round') ? `Round ${c.interviewRounds.length || 1}`
                      : c.currentStage
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidate(c.id)}
                        className="cursor-pointer text-meta text-text-primary"
                      >
                        <td className="rounded-l-card bg-surface px-3 py-2.5 font-medium transition-colors duration-micro hover:bg-surface-elevated">
                          <div className="flex items-center gap-2">
                            {hasDraft && <Zap className="h-3.5 w-3.5 text-accent" />}
                            {c.name}
                          </div>
                        </td>
                        <td className="bg-surface px-3 py-2.5 text-text-secondary transition-colors duration-micro hover:bg-surface-elevated">{c.role}</td>
                        <td className="bg-surface px-3 py-2.5 text-text-secondary transition-colors duration-micro hover:bg-surface-elevated">{round}</td>
                        <td className="bg-surface px-3 py-2.5 text-text-secondary transition-colors duration-micro hover:bg-surface-elevated">{requestedBy?.name ?? '—'}</td>
                        <td className="bg-surface px-3 py-2.5 text-text-secondary transition-colors duration-micro hover:bg-surface-elevated">{rc?.name ?? '—'}</td>
                        <td className="bg-surface px-3 py-2.5 transition-colors duration-micro hover:bg-surface-elevated">
                          <span className={`text-caption font-medium ${status.cls}`}>
                            {hasDraft ? (
                              <span className="text-accent">Draft ready ⚡</span>
                            ) : (
                              status.label
                            )}
                          </span>
                        </td>
                        <td className="rounded-r-card bg-surface px-3 py-2.5 text-caption text-text-muted transition-colors duration-micro hover:bg-surface-elevated">
                          {formatDistanceToNow(new Date(c.stageEnteredAt), { addSuffix: true })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ── Agent Drafts tab ── */}
        {tab === 'drafts' && (
          <>
            {pendingDrafts.length > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-meta font-semibold text-text-primary">
                  {pendingDrafts.length} draft{pendingDrafts.length !== 1 ? 's' : ''} waiting
                </span>
                <button
                  onClick={() => pendingDrafts.forEach((d) => approveDraft(d.id))}
                  className="rounded-button border border-border px-3 py-1.5 text-caption font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                >
                  Approve All
                </button>
              </div>
            )}
            {pendingDrafts.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-meta text-text-muted">
                <Zap className="h-6 w-6 opacity-40" />
                <span>No drafts waiting. The agent will queue new ones here as requests come in.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingDrafts.map((d) => (
                  <DraftApprovalCard key={d.id} draft={d} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <InterviewRequestModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
