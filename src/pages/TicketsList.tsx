import { useStore } from '../store/useStore'
import { ViewSwitcher } from '../components/tickets/ViewSwitcher'
import { Avatar } from '../components/ui/Avatar'
import { SlaBadge } from '../components/ui/SlaBadge'
import { PriorityTag } from '../components/ui/PriorityTag'

export function TicketsList() {
  const allCandidates = useStore((s) => s.candidates)
  const candidates = allCandidates.filter((c) => !c.tags.includes('Rejected'))
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-subhead font-semibold text-text-primary sm:text-heading">Tickets</h1>
          <p className="text-meta text-text-secondary">List view</p>
        </div>
        <ViewSwitcher />
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto px-4 py-4 sm:px-6">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-1">
          <thead>
            <tr className="text-left text-caption font-medium uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Assignee</th>
              <th className="px-3 py-2">SLA</th>
              <th className="px-3 py-2">Priority</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelectedCandidate(c.id)}
                className="cursor-pointer rounded-card bg-surface text-meta text-text-primary transition-colors duration-micro hover:bg-surface-elevated"
              >
                <td className="rounded-l-card px-3 py-3 font-medium">{c.name}</td>
                <td className="px-3 py-3 text-text-secondary">{c.role}</td>
                <td className="px-3 py-3 text-text-secondary">{c.currentStage}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <Avatar userId={c.currentAssigneeId} size={18} />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <SlaBadge deadline={c.slaDeadline} stageEnteredAt={c.stageEnteredAt} />
                </td>
                <td className="rounded-r-card px-3 py-3">
                  <PriorityTag priority={c.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
