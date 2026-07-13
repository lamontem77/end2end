import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CalendarCheck, Mail, FileCheck2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AgentDraft } from '../../types'
import { useStore } from '../../store/useStore'

const ICON: Record<string, React.ElementType> = {
  schedule_invite: CalendarCheck,
  self_schedule: CalendarCheck,
  availability_request: Mail,
  assessment_send: FileCheck2,
}

export function DraftApprovalCard({ draft }: { draft: AgentDraft }) {
  const approveDraft = useStore((s) => s.approveDraft)
  const declineDraft = useStore((s) => s.declineDraft)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(draft.content)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')

  const Icon = ICON[draft.type] ?? Mail
  const isDualInvite = draft.type === 'schedule_invite'

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-body font-semibold text-text-primary">{draft.title}</span>
        <span className="ml-auto text-caption text-text-muted">{formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}</span>
      </div>

      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-secondary">
        {draft.meta.when && <span>{draft.meta.when}</span>}
        {draft.meta.webex && <span>Webex ✓</span>}
        {draft.meta.hackerrank && <span>HackerRank ✓</span>}
        {draft.meta.feedbackForm && <span>Feedback Form ✓</span>}
        {draft.ccRecipients.length > 0 && <span>{draft.ccRecipients.join(', ')} CC'd ✓</span>}
      </div>

      {isDualInvite && draft.internalPreview && (
        <div className="mb-2 rounded-button border border-border bg-bg p-2 text-caption text-text-muted">
          <div className="mb-1 font-semibold text-text-secondary">Internal Invite Preview</div>
          <pre className="whitespace-pre-wrap font-sans">{draft.internalPreview}</pre>
        </div>
      )}

      {editing ? (
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="input mb-2 resize-none font-mono text-caption" />
      ) : (
        <div className="mb-2 rounded-button border border-border bg-bg p-2 text-caption text-text-secondary">
          <div className="mb-1 font-semibold text-text-primary">{isDualInvite ? 'External Invite Preview' : 'Email Preview'}</div>
          <pre className="whitespace-pre-wrap font-sans">{draft.content}</pre>
        </div>
      )}

      {declining ? (
        <div className="flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for declining…"
            className="input"
            autoFocus
          />
          <button
            onClick={() => {
              if (!reason.trim()) {
                toast.error('Add a reason so it can be re-drafted correctly.')
                return
              }
              declineDraft(draft.id, reason.trim())
              toast.message('Draft declined and returned to queue')
            }}
            className="shrink-0 rounded-button bg-danger px-3 py-1.5 text-meta font-medium text-white hover:bg-danger/85"
          >
            Confirm Decline
          </button>
          <button onClick={() => setDeclining(false)} className="shrink-0 rounded-button border border-border px-3 py-1.5 text-meta text-text-secondary">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => {
              approveDraft(draft.id, editing ? body : undefined)
              toast.success(isDualInvite ? 'Both invites sent' : 'Approved and sent')
            }}
            className="rounded-button bg-accent px-3 py-1.5 text-meta font-medium text-white hover:bg-accent-hover"
          >
            {isDualInvite ? 'Approve All' : 'Approve & Send'}
          </button>
          <button onClick={() => setEditing((v) => !v)} className="rounded-button border border-border px-3 py-1.5 text-meta text-text-primary hover:bg-surface-elevated">
            {editing ? 'Preview' : 'Edit'}
          </button>
          <button onClick={() => setDeclining(true)} className="ml-auto rounded-button px-3 py-1.5 text-meta text-text-muted hover:text-danger">
            Decline
          </button>
        </div>
      )}
    </div>
  )
}
