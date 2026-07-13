import type { Priority } from '../../types'

const CONFIG: Record<Priority, { label: string; className: string }> = {
  urgent: { label: 'URGENT', className: 'bg-danger/15 text-danger' },
  priority: { label: 'PRIORITY', className: 'bg-warning/15 text-warning' },
  standard: { label: 'STANDARD', className: 'bg-tag-gray/15 text-text-secondary' },
}

export function PriorityTag({ priority }: { priority: Priority }) {
  if (priority === 'standard') return null
  const cfg = CONFIG[priority]
  return (
    <span className={`inline-flex items-center rounded-tag px-1.5 py-0.5 text-caption font-semibold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
