import type { ReactNode } from 'react'

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onCancel,
}: {
  title: string
  description: ReactNode
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-modal border border-border bg-surface-elevated p-6 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-subhead font-semibold text-text-primary">{title}</h3>
        <div className="mt-2 text-body text-text-secondary">{description}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-button border border-border px-4 py-2 text-body text-text-secondary hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-button px-4 py-2 text-body font-medium text-white transition-colors duration-micro ${
              danger ? 'bg-danger hover:bg-danger/85' : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
