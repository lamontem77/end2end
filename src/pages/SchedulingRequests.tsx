import { formatDistanceToNow } from 'date-fns'
import { useStore } from '../store/useStore'
import { SchedulingTabs } from '../components/scheduling/SchedulingTabs'

export function SchedulingRequests() {
  const allCandidates = useStore((s) => s.candidates)
  const candidates = allCandidates.filter((c) => !c.tags.includes('Rejected'))
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)

  const requests = candidates.filter((c) => c.currentStage === 'Screening Scheduled' || c.currentStage === 'Round N Scheduling')

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-heading font-semibold text-text-primary">Scheduling</h1>
        <p className="mb-3 text-meta text-text-secondary">RC Scheduling Center — every request across every req, in one place.</p>
        <SchedulingTabs />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <table className="w-full border-separate border-spacing-y-1">
          <thead>
            <tr className="text-left text-caption font-medium uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Requested</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelectedCandidate(c.id)}
                className="cursor-pointer rounded-card bg-surface text-meta text-text-primary transition-colors duration-micro hover:bg-surface-elevated"
              >
                <td className="rounded-l-card px-3 py-3 font-medium">{c.name}</td>
                <td className="px-3 py-3 text-text-secondary">{c.role}</td>
                <td className="px-3 py-3 text-text-secondary">{c.currentStage === 'Screening Scheduled' ? 'Phone Screen' : `Round ${c.interviewRounds.length + 1}`}</td>
                <td className="rounded-r-card px-3 py-3 text-text-secondary">{formatDistanceToNow(new Date(c.stageEnteredAt), { addSuffix: true })}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-meta text-text-muted">
                  No open scheduling requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
