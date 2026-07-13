import { useMemo, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { STAGES } from '../lib/stageEngine'
import type { Stage } from '../types'
import { KanbanColumn } from '../components/tickets/KanbanColumn'
import { ViewSwitcher } from '../components/tickets/ViewSwitcher'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { AddCandidateModal } from '../components/tickets/AddCandidateModal'
import { slaState } from '../lib/stageEngine'

export function TicketsBoard() {
  const candidates = useStore((s) => s.candidates)
  const users = useStore((s) => s.users)
  const moveToStage = useStore((s) => s.moveToStage)

  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [slaFilter, setSlaFilter] = useState('all')
  const [pendingMove, setPendingMove] = useState<{ candidateId: string; toStage: Stage } | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const roles = useMemo(() => [...new Set(candidates.map((c) => c.role))], [candidates])

  const filtered = candidates.filter((c) => {
    if (c.tags.includes('Rejected')) return false
    if (assigneeFilter !== 'all' && c.currentAssigneeId !== assigneeFilter) return false
    if (roleFilter !== 'all' && c.role !== roleFilter) return false
    if (slaFilter !== 'all') {
      const st = slaState(c.slaDeadline, c.stageEnteredAt)
      if (slaFilter === 'breach' && st !== 'breach' && st !== 'at_risk') return false
      if (slaFilter === 'warning' && st !== 'warning') return false
      if (slaFilter === 'ok' && st !== 'ok') return false
    }
    return true
  })

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const toStage = result.destination.droppableId as Stage
    if (toStage === result.source.droppableId) return
    setPendingMove({ candidateId: result.draggableId, toStage })
  }

  const pendingCandidate = pendingMove ? candidates.find((c) => c.id === pendingMove.candidateId) : null

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-subhead font-semibold text-text-primary sm:text-heading">Tickets</h1>
          <p className="text-meta text-text-secondary">Every candidate, every stage, always visible.</p>
        </div>
        <ViewSwitcher />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-button border border-border bg-surface px-2.5 py-1.5 text-meta text-text-primary"
        >
          <option value="all">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-button border border-border bg-surface px-2.5 py-1.5 text-meta text-text-primary"
        >
          <option value="all">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={slaFilter}
          onChange={(e) => setSlaFilter(e.target.value)}
          className="rounded-button border border-border bg-surface px-2.5 py-1.5 text-meta text-text-primary"
        >
          <option value="all">All SLA Status</option>
          <option value="ok">On Track</option>
          <option value="warning">Warning</option>
          <option value="breach">Breached</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-button bg-accent px-3 py-1.5 text-meta font-medium text-white transition-colors duration-micro hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" /> New Candidate
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
          {STAGES.map((stage) => (
            <KanbanColumn key={stage} stage={stage} candidates={filtered.filter((c) => c.currentStage === stage)} />
          ))}
        </div>
      </DragDropContext>

      {pendingMove && pendingCandidate && (
        <ConfirmModal
          title={`Move ${pendingCandidate.name} to "${pendingMove.toStage}"?`}
          description={
            <>
              This will auto-assign the ticket and start the stage's SLA clock.
              {STAGES.indexOf(pendingMove.toStage) < STAGES.indexOf(pendingCandidate.currentStage) && (
                <span className="mt-2 block text-warning">Note: this moves the candidate backward in the pipeline.</span>
              )}
            </>
          }
          onCancel={() => setPendingMove(null)}
          onConfirm={() => {
            moveToStage(pendingMove.candidateId, pendingMove.toStage, 'You')
            setPendingMove(null)
          }}
        />
      )}

      {addOpen && <AddCandidateModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}
