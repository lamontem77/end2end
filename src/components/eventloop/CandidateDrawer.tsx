import { useState } from 'react'
import { X, ExternalLink, CheckCircle2, Clock, Zap, TrendingUp, MessageSquare, Mail, UserCheck, Star, ArrowUpRight, Users } from 'lucide-react'
import { useEventLoopStore } from '../../store/eventloopStore'

interface Props {
  attendeeId: string
  onClose: () => void
  onLogInteraction?: (attendeeId: string) => void
}

const priorityColor = {
  A: 'bg-danger/10 text-danger border-danger/30',
  B: 'bg-warning/10 text-warning border-warning/30',
  C: 'bg-surface-elevated text-text-secondary border-border',
}

const signalColor: Record<string, string> = {
  'Strong Potential': 'text-success',
  'Worth Nurturing': 'text-accent',
  'Not Enough Info': 'text-text-muted',
  'Not Relevant': 'text-text-muted',
}

const interestColor: Record<string, string> = {
  'Interested': 'bg-success/10 text-success border-success/30',
  'Open': 'bg-accent/10 text-accent border-accent/25',
  'Not Looking': 'bg-surface-elevated text-text-secondary border-border',
  'Unknown': 'bg-surface-elevated text-text-muted border-border',
}

const ROLES = [
  { value: 'fde', label: 'Forward Deployed Engineer' },
  { value: 'infra', label: 'Infrastructure Engineer' },
]


export function CandidateDrawer({ attendeeId, onClose, onLogInteraction }: Props) {
  const attendees = useEventLoopStore((s) => s.attendees)
  const interactions = useEventLoopStore((s) => s.interactions)
  const moveToAts = useEventLoopStore((s) => s.moveToAts)
  const attendee = attendees.find((a) => a.id === attendeeId)
  const [atsRole, setAtsRole] = useState('fde')
  const [atsMoved, setAtsMoved] = useState(false)

  if (!attendee) return null

  const myInteractions = interactions.filter((i) => i.attendeeId === attendeeId)

  const handleMoveToAts = () => {
    moveToAts(attendeeId, atsRole, 'Recruiter Screen')
    setAtsMoved(true)
  }

    const journeyStepMeta: Record<string, { icon: typeof Mail; color: string }> = {
    'Invited': { icon: Mail, color: 'bg-surface-elevated border-border text-text-muted' },
    'RSVP': { icon: CheckCircle2, color: 'bg-accent/10 border-accent/30 text-accent' },
    'Attended': { icon: Users, color: 'bg-accent/15 border-accent/40 text-accent' },
    'High Engagement': { icon: Star, color: 'bg-success/10 border-success/30 text-success' },
    'Medium Engagement': { icon: Star, color: 'bg-warning/10 border-warning/30 text-warning' },
    'Follow-Up': { icon: Clock, color: 'bg-accent/10 border-accent/25 text-accent' },
    'FDE Process': { icon: ArrowUpRight, color: 'bg-success/10 border-success/30 text-success' },
    'Infra Process': { icon: ArrowUpRight, color: 'bg-success/10 border-success/30 text-success' },
    'Technical Screen': { icon: UserCheck, color: 'bg-success/15 border-success/40 text-success' },
    'Onsite': { icon: UserCheck, color: 'bg-success/20 border-success/50 text-success' },
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border-l border-border flex flex-col h-full shadow-card-hover overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-body font-semibold ${priorityColor[attendee.priority]}`}>
              {attendee.priority}
            </div>
            <div>
              <div className="text-label font-semibold text-text-primary">{attendee.name}</div>
              <div className="text-meta text-text-secondary">{attendee.title} · {attendee.company}</div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`rounded-tag border px-2 py-0.5 text-caption font-medium ${interestColor[attendee.recruitingInterest]}`}>
                  {attendee.recruitingInterest}
                </span>
                <span className={`text-caption font-medium ${signalColor[attendee.talentSignal]}`}>
                  {attendee.talentSignal}
                </span>
                {attendee.eventSource && (
                  <span className={`rounded-tag border px-2 py-0.5 text-caption font-medium ${
                    attendee.eventSource === 'Sourced'
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-accent/10 text-accent border-accent/25'
                  }`}>
                    Event {attendee.eventSource}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Journey timeline */}
          <div>
            <h3 className="text-caption text-text-muted font-medium mb-3 uppercase tracking-wide">Candidate Journey</h3>
            <div className="relative pl-4">
              {/* vertical connector line */}
              <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />
              <div className="space-y-3">
                {attendee.journey.map((step) => {
                  const meta = journeyStepMeta[step] ?? { icon: CheckCircle2, color: 'bg-surface-elevated border-border text-text-muted' }
                  const Icon = meta.icon
                  return (
                    <div key={step} className="relative flex items-center gap-3">
                      <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-body text-text-primary">{step}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-button bg-surface-elevated p-3">
              <div className="text-caption text-text-muted">RSVP</div>
              <div className={`text-body font-semibold mt-0.5 ${attendee.rsvpStatus === 'Yes' ? 'text-success' : attendee.rsvpStatus === 'No' ? 'text-danger' : 'text-text-secondary'}`}>
                {attendee.rsvpStatus}
              </div>
            </div>
            <div className="rounded-button bg-surface-elevated p-3">
              <div className="text-caption text-text-muted">Attendance</div>
              <div className={`text-body font-semibold mt-0.5 ${attendee.attendanceStatus === 'Checked In' ? 'text-success' : attendee.attendanceStatus === 'No Show' ? 'text-danger' : 'text-text-secondary'}`}>
                {attendee.attendanceStatus === 'Checked In' ? `✓ ${attendee.checkInTime ?? ''}` : attendee.attendanceStatus}
              </div>
            </div>
            <div className="rounded-button bg-surface-elevated p-3">
              <div className="text-caption text-text-muted">Interactions</div>
              <div className="text-body font-semibold mt-0.5 text-text-primary">{myInteractions.length}</div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-caption text-text-muted font-medium uppercase tracking-wide">Contact</h3>
            </div>
            <div className="space-y-1">
              <div className="text-meta text-text-secondary">{attendee.email}</div>
              <div className="text-meta text-text-secondary flex items-center gap-1">
                {attendee.relationshipStatus} relationship
                {attendee.evtId && <span className="ml-2 font-mono text-caption text-text-muted">{attendee.evtId}</span>}
              </div>
            </div>
          </div>

          {/* Interactions */}
          {myInteractions.length > 0 && (
            <div>
              <h3 className="text-caption text-text-muted font-medium mb-3 uppercase tracking-wide">Interactions ({myInteractions.length})</h3>
              <div className="space-y-3">
                {myInteractions.map((int) => (
                  <div key={int.id} className="rounded-card border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-body font-semibold text-text-primary">{int.employeeName}</div>
                        <div className="text-caption text-text-muted">{int.employeeRole}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-caption text-text-muted">{int.timestamp}</div>
                        <div className="text-caption font-medium text-accent">{int.conversationType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-caption font-medium ${
                        int.engagement === 'Strong' ? 'text-success' : int.engagement === 'Good' ? 'text-accent' : 'text-text-secondary'
                      }`}>{int.engagement} engagement</span>
                      <span className="text-text-muted">·</span>
                      <span className={`text-caption ${signalColor[int.talentSignal === 'Strong Potential' ? 'Strong Potential' : int.talentSignal === 'Worth Nurturing' ? 'Worth Nurturing' : 'Not Enough Info']}`}>
                        {int.talentSignal}
                      </span>
                    </div>
                    {int.note && <p className="text-meta text-text-secondary">{int.note}</p>}
                    {int.followUp && (
                      <div className="mt-2 flex items-center gap-1.5 text-caption text-accent">
                        <Clock className="h-3 w-3" />
                        Follow up: {int.followUpOwner}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATS */}
          <div className="rounded-card border border-border bg-surface p-4">
            <h3 className="text-caption text-text-muted font-medium mb-3 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Recruiting Process
            </h3>
            {attendee.atsStage ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-body font-medium text-text-primary">{attendee.atsStage}</span>
                </div>
                <div className="text-caption text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Synced to ATS <span className="text-text-muted ml-1">(simulated)</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-3">
                  <label className="text-caption text-text-muted mb-1.5 block">Select role</label>
                  <select
                    value={atsRole}
                    onChange={(e) => setAtsRole(e.target.value)}
                    className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-body text-text-primary outline-none focus:border-accent"
                  >
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                {atsMoved ? (
                  <div className="text-caption text-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Moved to Recruiter Screen · Synced to ATS (simulated)
                  </div>
                ) : (
                  <button
                    onClick={handleMoveToAts}
                    className="flex w-full items-center justify-center gap-2 rounded-button bg-accent/15 border border-accent/25 px-4 py-2.5 text-body font-medium text-accent hover:bg-accent/25 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Move to Recruiting Process
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 shrink-0 flex gap-3">
          <button
            onClick={() => onLogInteraction?.(attendeeId)}
            className="flex-1 flex items-center justify-center gap-2 rounded-button border border-border py-2.5 text-body text-text-secondary hover:bg-surface-elevated transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Log Interaction
          </button>
          <button className="flex items-center gap-1 rounded-button border border-border px-3 py-2.5 text-body text-text-secondary hover:bg-surface-elevated transition-colors">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
