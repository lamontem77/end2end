import { differenceInCalendarDays, format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import type { Candidate, NewHireTracker } from '../../types'
import { useStore } from '../../store/useStore'

const CHECK: Record<string, string> = {
  not_started: '🔲 Not Started',
  pending: '⏳ Pending',
  in_progress: '⏳ In Progress',
  clear: '✅ Clear',
  complete: '✅ Complete',
  flagged: '⚠️ Flagged',
  failed: '❌ Failed',
}

export function NewHireCard({ candidate, tracker }: { candidate: Candidate; tracker: NewHireTracker }) {
  const navigate = useNavigate()
  const owner = useStore((s) => s.userById(candidate.rcId))
  const daysAway = differenceInCalendarDays(new Date(tracker.startDate), new Date())
  const daysColor = daysAway <= 3 ? 'text-danger' : daysAway <= 10 ? 'text-warning' : 'text-success'

  const warnings: string[] = []
  if (tracker.techSetup.status !== 'complete' && daysAway <= 2) warnings.push('Tech Setup not yet started')
  if (tracker.backgroundCheck.status === 'flagged') warnings.push('BGC flagged — HR review required')
  if (tracker.backgroundCheck.status === 'failed') warnings.push('BGC failed — start date at risk')
  if (tracker.drugTest.status === 'failed') warnings.push('Drug test positive — HR notified')

  return (
    <button
      onClick={() => navigate(`/new-hires/${candidate.id}`)}
      className="mb-2 w-full rounded-card border border-border bg-surface p-3 text-left shadow-card transition-all duration-micro hover:-translate-y-px hover:shadow-card-hover"
    >
      <div className="text-label font-semibold text-text-primary">{candidate.name}</div>
      <div className="text-meta text-text-secondary">
        {candidate.role} · {candidate.department}
      </div>
      <div className={`mt-1 text-caption font-medium ${daysColor}`}>
        Start Date: {format(new Date(tracker.startDate), 'MMM d, yyyy')} · {daysAway >= 0 ? `${daysAway} days away` : `${Math.abs(daysAway)}d overdue`}
      </div>

      <div className="mt-3 flex flex-col gap-1 text-caption text-text-secondary">
        <div className="flex justify-between">
          <span>📄 Offer Letter:</span> <span className="text-text-primary">{CHECK[tracker.offerLetter.status] ?? tracker.offerLetter.status}</span>
        </div>
        <div className="flex justify-between">
          <span>🔍 BGC:</span> <span className="text-text-primary">{CHECK[tracker.backgroundCheck.status] ?? tracker.backgroundCheck.status}</span>
        </div>
        <div className="flex justify-between">
          <span>🧪 Drug Test:</span> <span className="text-text-primary">{CHECK[tracker.drugTest.status] ?? tracker.drugTest.status}</span>
        </div>
        <div className="flex justify-between">
          <span>💻 Tech Setup:</span> <span className="text-text-primary">{CHECK[tracker.techSetup.status] ?? tracker.techSetup.status}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-caption text-text-secondary">
        <span>Owner: {owner?.name}</span>
      </div>
      {warnings.map((w) => (
        <div key={w} className="mt-1 text-caption text-warning">
          ⚠️ {w}
        </div>
      ))}
    </button>
  )
}
