import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store/useStore'

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Data', 'Sales', 'Marketing', 'HR', 'Operations', 'Finance', 'Legal']
const ROUNDS = [
  { value: 1, label: 'Round 1 / Phone Screen' },
  { value: 2, label: 'Round 2' },
  { value: 3, label: 'Round 3' },
  { value: 4, label: 'Final Round' },
]
const FORMATS = [
  { value: 'virtual', label: 'Virtual — Webex' },
  { value: 'phone', label: 'Phone' },
  { value: 'in_person', label: 'In-Person' },
] as const

interface Props {
  onClose: () => void
}

export function InterviewRequestModal({ onClose }: Props) {
  const users = useStore((s) => s.users)
  const currentUserId = useStore((s) => s.currentUserId)
  const createInterviewRequest = useStore((s) => s.createInterviewRequest)

  const interviewers = users.filter((u) => ['interviewer', 'hiring_manager', 'recruiter'].includes(u.role))

  const [form, setForm] = useState({
    candidateName: '',
    candidateEmail: '',
    role: '',
    department: DEPARTMENTS[0],
    round: 1,
    interviewerUserId: interviewers[0]?.id ?? '',
    format: 'virtual' as 'virtual' | 'in_person' | 'phone',
    requestedByUserId: currentUserId,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const field = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.candidateName.trim()) { toast.error('Candidate name is required'); return }
    if (!form.role.trim()) { toast.error('Role is required'); return }
    if (!form.interviewerUserId) { toast.error('Select an interviewer'); return }
    setSubmitting(true)
    createInterviewRequest({
      ...form,
      candidateName: form.candidateName.trim(),
      candidateEmail: form.candidateEmail.trim(),
      role: form.role.trim(),
      notes: form.notes.trim(),
    })
    toast.success(`Request created — agent is drafting outreach for ${form.candidateName}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-card border border-border bg-surface shadow-card-hover">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-body font-semibold text-text-primary">New Interview Request</h2>
            <p className="mt-0.5 text-caption text-text-secondary">Agent will draft outreach for RC to approve.</p>
          </div>
          <button onClick={onClose} className="rounded-button p-1 text-text-muted hover:bg-surface-elevated hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-caption font-medium text-text-secondary">Candidate Name</label>
              <input
                ref={firstInputRef}
                type="text"
                placeholder="Ming X."
                value={form.candidateName}
                onChange={(e) => field('candidateName', e.target.value)}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-caption font-medium text-text-secondary">Email (optional)</label>
              <input
                type="email"
                placeholder="ming.x@email.com"
                value={form.candidateEmail}
                onChange={(e) => field('candidateEmail', e.target.value)}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption font-medium text-text-secondary">Role</label>
              <input
                type="text"
                placeholder="Senior Software Engineer"
                value={form.role}
                onChange={(e) => field('role', e.target.value)}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption font-medium text-text-secondary">Department</label>
              <select
                value={form.department}
                onChange={(e) => field('department', e.target.value)}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption font-medium text-text-secondary">Round</label>
              <select
                value={form.round}
                onChange={(e) => field('round', Number(e.target.value))}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {ROUNDS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption font-medium text-text-secondary">Format</label>
              <select
                value={form.format}
                onChange={(e) => field('format', e.target.value as typeof form.format)}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-caption font-medium text-text-secondary">Interviewer</label>
              <select
                value={form.interviewerUserId}
                onChange={(e) => field('interviewerUserId', e.target.value)}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {interviewers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-caption font-medium text-text-secondary">Requested by</label>
              <select
                value={form.requestedByUserId}
                onChange={(e) => field('requestedByUserId', e.target.value)}
                className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-caption font-medium text-text-secondary">Notes (optional)</label>
              <textarea
                placeholder="Any context for the RC or interviewer…"
                value={form.notes}
                onChange={(e) => field('notes', e.target.value)}
                rows={2}
                className="w-full resize-none rounded-button border border-border bg-surface-elevated px-3 py-2 text-meta text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-button bg-accent py-2 text-meta font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-button border border-border px-4 py-2 text-meta text-text-secondary hover:bg-surface-elevated"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Slack hint */}
        <div className="border-t border-border px-5 py-3">
          <p className="text-caption text-text-muted">
            Via Slack: <code className="rounded bg-surface-elevated px-1 py-0.5 font-mono text-accent">/interview {form.candidateName || 'Candidate'} · {form.role || 'Role'} · R{form.round} · {interviewers.find(u => u.id === form.interviewerUserId)?.name ?? 'Interviewer'} · {form.format === 'virtual' ? 'Webex' : form.format}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
