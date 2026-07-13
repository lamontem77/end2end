import { useState } from 'react'
import { toast } from 'sonner'
import { nanoid } from '../../lib/id'
import { useStore } from '../../store/useStore'
import { slaDeadlineFor } from '../../lib/stageEngine'
import type { Candidate } from '../../types'

export function AddCandidateModal({ onClose }: { onClose: () => void }) {
  const users = useStore((s) => s.users)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('Engineering')
  const [source, setSource] = useState('LinkedIn')
  const [recruiterId, setRecruiterId] = useState(users.find((u) => u.role === 'recruiter')?.id ?? '')
  const [rcId, setRcId] = useState(users.find((u) => u.role === 'rc')?.id ?? '')
  const [hmId, setHmId] = useState(users.find((u) => u.role === 'hiring_manager')?.id ?? '')

  function submit() {
    if (!name.trim() || !role.trim() || !email.trim()) {
      toast.error('Name, email, and role are required.')
      return
    }
    const now = new Date().toISOString()
    const candidate: Candidate = {
      id: `c-${nanoid()}`,
      name,
      email,
      role,
      department,
      source,
      currentStage: 'Applied',
      currentAssigneeId: recruiterId,
      priority: 'standard',
      tags: [department],
      stageEnteredAt: now,
      slaDeadline: slaDeadlineFor('Applied'),
      notes: [],
      activityLog: [{ id: nanoid(), type: 'ticket_created', label: 'Applied', actor: 'You', timestamp: now }],
      interviewRounds: [],
      scorecards: [],
      assessmentStatus: 'not_sent',
      recruiterId,
      rcId,
      hiringManagerId: hmId,
      createdAt: now,
      updatedAt: now,
    }
    useStore.setState((s) => ({ candidates: [...s.candidates, candidate] }))
    toast.success(`${name} added to Tickets`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-modal border border-border bg-surface-elevated p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-subhead font-semibold text-text-primary">New Candidate</h3>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Jordan Rivera" />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="jordan@example.com" />
          </Field>
          <Field label="Role">
            <input value={role} onChange={(e) => setRole(e.target.value)} className="input" placeholder="Software Engineer II" />
          </Field>
          <Field label="Department">
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className="input" />
          </Field>
          <Field label="Source">
            <input value={source} onChange={(e) => setSource(e.target.value)} className="input" />
          </Field>
          <Field label="Recruiter">
            <select value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} className="input">
              {users
                .filter((u) => u.role === 'recruiter')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="RC">
            <select value={rcId} onChange={(e) => setRcId(e.target.value)} className="input">
              {users
                .filter((u) => u.role === 'rc')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Hiring Manager">
            <select value={hmId} onChange={(e) => setHmId(e.target.value)} className="input">
              {users
                .filter((u) => u.role === 'hiring_manager')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-button border border-border px-4 py-2 text-body text-text-secondary hover:bg-surface">
            Cancel
          </button>
          <button onClick={submit} className="rounded-button bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent-hover">
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-caption font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
