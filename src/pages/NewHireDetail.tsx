import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store/useStore'
import { ConfirmModal } from '../components/ui/ConfirmModal'

const STATUS_LABEL: Record<string, string> = {
  not_started: '🔲 Not Started',
  pending: '⏳ Pending Results',
  in_progress: '⏳ In Progress',
  clear: '✅ Clear',
  complete: '✅ Complete',
  flagged: '⚠️ Flagged — Pending HR Review',
  failed: '❌ Failed',
}

export function NewHireDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const candidate = useStore((s) => (id ? s.candidateById(id) : undefined))
  const tracker = useStore((s) => (id ? s.newHireTrackers[id] : undefined))
  const initiateBGC = useStore((s) => s.initiateBGC)
  const updateBGCResult = useStore((s) => s.updateBGCResult)
  const initiateDrugTest = useStore((s) => s.initiateDrugTest)
  const updateDrugTestResult = useStore((s) => s.updateDrugTestResult)
  const markTechSetup = useStore((s) => s.markTechSetup)
  const [confirmAction, setConfirmAction] = useState<'bgc' | 'dt' | null>(null)

  if (!candidate || !tracker || !id) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
        <p>New hire not found.</p>
        <button onClick={() => navigate('/new-hires')} className="text-accent hover:text-accent-hover">
          Back to New Hire Tracker
        </button>
      </div>
    )
  }

  const blockedByHardGate = tracker.backgroundCheck.status !== 'clear' || tracker.drugTest.status !== 'clear'

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border px-6 py-4">
        <button onClick={() => navigate('/new-hires')} className="mb-2 flex items-center gap-1.5 text-caption text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> New Hire Tracker
        </button>
        <h1 className="text-heading font-semibold text-text-primary">New Hire Checklist — {candidate.name}</h1>
        <p className="text-meta text-text-secondary">
          {candidate.role} · Start Date {format(new Date(tracker.startDate), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
        {tracker.readyToStart && (
          <div className="mb-4 flex items-center gap-2 rounded-card border border-success/30 bg-success/10 px-4 py-3 text-body font-medium text-success">
            <PartyPopper className="h-5 w-5" /> Ready to Start — all four sub-tickets closed.
          </div>
        )}

        <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
          <ChecklistRow title="📄 OFFER LETTER" status={STATUS_LABEL[tracker.offerLetter.status]}>
            <div className="text-meta text-text-secondary">
              {tracker.offerLetter.completedAt && <>Signed {format(new Date(tracker.offerLetter.completedAt), 'MMM d, yyyy')}</>}
            </div>
          </ChecklistRow>

          <ChecklistRow title="🔍 BACKGROUND CHECK" status={STATUS_LABEL[tracker.backgroundCheck.status]}>
            <div className="text-meta text-text-secondary">Vendor: Checkr</div>
            {tracker.backgroundCheck.status === 'not_started' && (
              <button onClick={() => setConfirmAction('bgc')} className="mt-2 rounded-button bg-accent px-3 py-1.5 text-meta font-medium text-white hover:bg-accent-hover">
                Initiate BGC
              </button>
            )}
            {tracker.backgroundCheck.status === 'pending' && (
              <div className="mt-2 flex gap-2">
                <ResultButton label="Clear" onClick={() => updateBGCResult(id, 'clear')} />
                <ResultButton label="Flagged" tone="warning" onClick={() => updateBGCResult(id, 'flagged')} />
                <ResultButton label="Failed" tone="danger" onClick={() => updateBGCResult(id, 'failed')} />
              </div>
            )}
          </ChecklistRow>

          <ChecklistRow title="🧪 DRUG TEST" status={STATUS_LABEL[tracker.drugTest.status]}>
            <div className="text-meta text-text-secondary">Lab: Quest Diagnostics</div>
            {tracker.drugTest.status === 'not_started' && (
              <button onClick={() => setConfirmAction('dt')} className="mt-2 rounded-button bg-accent px-3 py-1.5 text-meta font-medium text-white hover:bg-accent-hover">
                Order Drug Test
              </button>
            )}
            {tracker.drugTest.status === 'pending' && (
              <div className="mt-2 flex gap-2">
                <ResultButton label="Negative" onClick={() => updateDrugTestResult(id, 'negative')} />
                <ResultButton label="Inconclusive" tone="warning" onClick={() => updateDrugTestResult(id, 'inconclusive')} />
                <ResultButton label="Positive" tone="danger" onClick={() => updateDrugTestResult(id, 'positive')} />
              </div>
            )}
          </ChecklistRow>

          <ChecklistRow title="💻 TECH SETUP" status={STATUS_LABEL[tracker.techSetup.status]}>
            <div className="text-meta text-text-secondary">Assigned to: Sam O. (IT) · Soft gate — overridable</div>
            {tracker.techSetup.status === 'not_started' && (
              <button onClick={() => markTechSetup(id, 'in_progress')} className="mt-2 rounded-button border border-border px-3 py-1.5 text-meta text-text-primary hover:bg-surface-elevated">
                Mark In Progress
              </button>
            )}
            {tracker.techSetup.status !== 'complete' && tracker.techSetup.status !== 'not_started' && (
              <button
                onClick={() => {
                  markTechSetup(id, 'complete')
                  toast.success('Tech Setup complete')
                }}
                className="mt-2 rounded-button bg-success/15 px-3 py-1.5 text-meta font-medium text-success hover:bg-success/25"
              >
                Mark Complete
              </button>
            )}
          </ChecklistRow>
        </div>

        {blockedByHardGate && !tracker.readyToStart && (
          <div className="mt-4 rounded-card border border-warning/30 bg-warning/10 px-4 py-3 text-meta text-warning">
            ⚠️ BGC and/or Drug Test pending. {candidate.name.split(' ')[0]} cannot be marked Ready to Start until both return Clear or HR approves an exception.
          </div>
        )}
      </div>

      {confirmAction === 'bgc' && (
        <ConfirmModal
          title="Initiate background check?"
          description={`This submits a Checkr background check request for ${candidate.name}.`}
          confirmLabel="Confirm"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            initiateBGC(id)
            setConfirmAction(null)
            toast.success('Background check initiated')
          }}
        />
      )}
      {confirmAction === 'dt' && (
        <ConfirmModal
          title="Order drug test?"
          description={`This submits a Quest Diagnostics drug test order for ${candidate.name}.`}
          confirmLabel="Confirm"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            initiateDrugTest(id)
            setConfirmAction(null)
            toast.success('Drug test ordered')
          }}
        />
      )}
    </div>
  )
}

function ChecklistRow({ title, status, children }: { title: string; status: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-meta font-semibold tracking-wide text-text-primary">{title}</span>
        <span className="text-meta text-text-secondary">{status}</span>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function ResultButton({ label, onClick, tone }: { label: string; onClick: () => void; tone?: 'warning' | 'danger' }) {
  const cls = tone === 'warning' ? 'bg-warning/15 text-warning hover:bg-warning/25' : tone === 'danger' ? 'bg-danger/15 text-danger hover:bg-danger/25' : 'bg-success/15 text-success hover:bg-success/25'
  return (
    <button onClick={onClick} className={`rounded-button px-3 py-1.5 text-meta font-medium ${cls}`}>
      {label}
    </button>
  )
}
