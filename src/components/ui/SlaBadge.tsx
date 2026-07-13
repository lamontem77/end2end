import { formatSlaLabel, slaState } from '../../lib/stageEngine'

const DOT: Record<string, string> = {
  ok: 'bg-text-muted',
  warning: 'bg-warning',
  breach: 'bg-danger',
  at_risk: 'bg-danger',
}
const TEXT: Record<string, string> = {
  ok: 'text-text-secondary',
  warning: 'text-warning',
  breach: 'text-danger',
  at_risk: 'text-danger',
}

export function SlaBadge({ deadline, stageEnteredAt }: { deadline: string | null; stageEnteredAt: string }) {
  if (!deadline) return <span className="text-caption text-text-muted">No SLA</span>
  const state = slaState(deadline, stageEnteredAt)
  return (
    <span className={`inline-flex items-center gap-1 text-caption font-medium ${TEXT[state]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[state]}`} />
      SLA: {formatSlaLabel(deadline)}
    </span>
  )
}
