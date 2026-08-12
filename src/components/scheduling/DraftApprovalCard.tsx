import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, Mail, CalendarCheck, FileCheck2 } from 'lucide-react'
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
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(draft.content)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')

  const Icon = ICON[draft.type] ?? Mail
  const isDualInvite = draft.type === 'schedule_invite'
  const recipientSummary = [
    ...draft.recipients,
    ...(draft.ccRecipients.length ? [`${draft.ccRecipients[0]} CC'd`] : []),
  ].join(' · ')

  const handleApprove = () => {
    approveDraft(draft.id, editing ? body : undefined)
    toast.success(isDualInvite ? 'Both invites sent' : 'Approved and sent')
  }

  // ── Collapsed row ──────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 text-meta">
        <Icon className="h-4 w-4 shrink-0 text-accent" />
        <span className="flex-1 truncate font-medium text-text-primary">{draft.title}</span>
        {recipientSummary && (
          <span className="hidden shrink-0 truncate text-caption text-text-muted sm:block max-w-[180px]">{recipientSummary}</span>
        )}
        <span className="shrink-0 text-caption text-text-muted">{formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}</span>
        <button
          onClick={() => setExpanded(true)}
          className="shrink-0 rounded-button border border-border px-2 py-1 text-caption text-text-secondary hover:bg-surface-elevated"
          title="Preview"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleApprove}
          className="shrink-0 rounded-button bg-accent px-3 py-1 text-caption font-medium text-white hover:bg-accent-hover"
        >
          Approve
        </button>
      </div>
    )
  }

  // ── Expanded card (max 280px scrollable) ───────────────────────────────────
  return (
    <div className="rounded-card border border-border bg-surface">
      {/* Header row */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <Icon className="h-4 w-4 shrink-0 text-accent" />
        <span className="flex-1 truncate font-medium text-meta text-text-primary">{draft.title}</span>
        <span className="text-caption text-text-muted">{formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}</span>
        <button
          onClick={() => { setExpanded(false); setEditing(false) }}
          className="shrink-0 rounded-button border border-border px-2 py-1 text-caption text-text-secondary hover:bg-surface-elevated"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleApprove}
          className="shrink-0 rounded-button bg-accent px-3 py-1 text-caption font-medium text-white hover:bg-accent-hover"
        >
          Approve & Send
        </button>
      </div>

      {/* Email meta */}
      <div className="border-b border-border px-3 py-2 text-caption text-text-secondary">
        <div><span className="text-text-muted w-10 inline-block">To:</span> {draft.recipients.join(', ')}</div>
        {draft.ccRecipients.length > 0 && (
          <div><span className="text-text-muted w-10 inline-block">CC:</span> {draft.ccRecipients.join(', ')}</div>
        )}
        {draft.subject && (
          <div><span className="text-text-muted w-10 inline-block">Sub:</span> {draft.subject}</div>
        )}
      </div>

      {/* Body — scrollable, max 280px */}
      <div className="overflow-y-auto px-3 py-2" style={{ maxHeight: 280 }}>
        {editing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none rounded-button border border-border bg-bg p-2 font-mono text-caption text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            rows={10}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-caption text-text-secondary">{body}</pre>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        {declining ? (
          <>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for declining…"
              className="flex-1 rounded-button border border-border bg-bg px-2 py-1 text-caption text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            <button
              onClick={() => {
                if (!reason.trim()) { toast.error('Add a reason'); return }
                declineDraft(draft.id, reason.trim())
                toast.message('Draft declined')
              }}
              className="rounded-button bg-danger px-3 py-1 text-caption font-medium text-white hover:bg-danger/85"
            >
              Confirm
            </button>
            <button onClick={() => setDeclining(false)} className="rounded-button border border-border px-2 py-1 text-caption text-text-secondary">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded-button border border-border px-2 py-1 text-caption text-text-secondary hover:bg-surface-elevated"
            >
              {editing ? 'Preview' : 'Edit'}
            </button>
            {editing && (
              <button
                onClick={() => { setBody(draft.content); setEditing(false) }}
                className="rounded-button border border-border px-2 py-1 text-caption text-text-secondary hover:bg-surface-elevated"
              >
                Reset
              </button>
            )}
            <button onClick={() => setDeclining(true)} className="ml-auto rounded-button px-2 py-1 text-caption text-text-muted hover:text-danger">
              Decline
            </button>
          </>
        )}
      </div>
    </div>
  )
}
