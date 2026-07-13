import { Droppable } from '@hello-pangea/dnd'
import type { Candidate, Stage } from '../../types'
import { CandidateCard } from './CandidateCard'
import { slaState } from '../../lib/stageEngine'

export function KanbanColumn({ stage, candidates }: { stage: Stage; candidates: Candidate[] }) {
  const breached = candidates.filter((c) => {
    const s = slaState(c.slaDeadline, c.stageEnteredAt)
    return s === 'breach' || s === 'at_risk'
  }).length

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="min-w-0">
          <div className="truncate text-meta font-semibold text-text-primary">{stage}</div>
          <div className="text-caption text-text-secondary">
            {candidates.length} candidate{candidates.length === 1 ? '' : 's'}
            {breached > 0 && <span className="ml-1.5 text-danger">· {breached} breached</span>}
          </div>
        </div>
      </div>
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[80px] flex-1 overflow-y-auto rounded-card border border-dashed p-1 transition-colors duration-micro ${
              snapshot.isDraggingOver ? 'border-accent bg-accent/5' : 'border-transparent'
            }`}
          >
            {candidates.map((c, i) => (
              <CandidateCard key={c.id} candidate={c} index={i} />
            ))}
            {provided.placeholder}
            {candidates.length === 0 && !snapshot.isDraggingOver && (
              <div className="px-2 py-6 text-center text-caption text-text-muted">No candidates</div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
