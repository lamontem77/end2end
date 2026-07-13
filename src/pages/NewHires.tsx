import { useStore } from '../store/useStore'
import { NEW_HIRE_COLUMNS, columnFor } from '../lib/newHireColumn'
import { NewHireCard } from '../components/newhires/NewHireCard'

export function NewHires() {
  const trackers = useStore((s) => s.newHireTrackers)
  const candidates = useStore((s) => s.candidates)

  const entries = Object.values(trackers)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-heading font-semibold text-text-primary">New Hire Tracker</h1>
        <p className="text-meta text-text-secondary">Candidates graduate here automatically when their offer is accepted.</p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="text-subhead font-semibold text-text-primary">No new hires yet</div>
            <p className="mt-1 text-meta text-text-secondary">
              Accept an offer on a candidate's ticket and they'll automatically graduate to this board with 4 sub-tickets.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
          {NEW_HIRE_COLUMNS.map((col) => {
            const inColumn = entries.filter((t) => columnFor(t) === col)
            return (
              <div key={col} className="flex h-full w-[280px] shrink-0 flex-col">
                <div className="mb-2 px-1">
                  <div className="text-meta font-semibold text-text-primary">{col}</div>
                  <div className="text-caption text-text-secondary">{inColumn.length} candidate{inColumn.length === 1 ? '' : 's'}</div>
                </div>
                <div className="flex-1 overflow-y-auto rounded-card p-1">
                  {inColumn.map((t) => {
                    const candidate = candidates.find((c) => c.id === t.candidateId)
                    if (!candidate) return null
                    return <NewHireCard key={t.candidateId} candidate={candidate} tracker={t} />
                  })}
                  {inColumn.length === 0 && <div className="px-2 py-6 text-center text-caption text-text-muted">No candidates</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
