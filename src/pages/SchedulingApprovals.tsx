import { useStore } from '../store/useStore'
import { SchedulingTabs } from '../components/scheduling/SchedulingTabs'
import { DraftApprovalCard } from '../components/scheduling/DraftApprovalCard'

export function SchedulingApprovals() {
  const allDrafts = useStore((s) => s.agentDrafts)
  const drafts = allDrafts.filter((d) => d.status === 'pending')

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-heading font-semibold text-text-primary">Scheduling</h1>
        <p className="mb-3 text-meta text-text-secondary">Everything the agent has prepared — one click to send.</p>
        <SchedulingTabs />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-3 text-meta font-semibold text-text-primary">Approvals Needed ({drafts.length})</div>
        {drafts.length === 0 && (
          <div className="rounded-card border border-dashed border-border px-4 py-10 text-center text-meta text-text-muted">
            No drafts waiting. The agent will drop new ones here as tickets move stages.
          </div>
        )}
        <div className="flex flex-col gap-3">
          {drafts.map((d) => (
            <DraftApprovalCard key={d.id} draft={d} />
          ))}
        </div>
      </div>
    </div>
  )
}
