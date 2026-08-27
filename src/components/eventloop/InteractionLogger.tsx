import { useState } from 'react'
import { X, QrCode, Mic, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react'
import { employees, sampleVoiceTranscript, sampleVoiceExtraction } from '../../data/eventloop'
import type { EventAttendee, Interaction } from '../../data/eventloop'
import { useEventLoopStore } from '../../store/eventloopStore'

interface Props {
  attendees: EventAttendee[]
  onClose: () => void
  defaultAttendeeId?: string
}

const CONV_TYPES = ['Technical', 'Recruiting', 'Founder', 'General'] as const
const ENGAGEMENT = ['Strong', 'Good', 'Light'] as const
const SIGNALS = ['Strong Potential', 'Worth Nurturing', 'Not Enough Information', 'Not Relevant'] as const
const INTEREST = ['Interested', 'Open', 'Not Looking', 'Unknown'] as const
const ROLES = ['FDE', 'Infrastructure', 'Other', 'Unknown'] as const

function uid() {
  return `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function VoiceNoteModal({ onClose, onAccept }: { onClose: () => void; onAccept: (data: typeof sampleVoiceExtraction & { note: string }) => void }) {
  const [phase, setPhase] = useState<'recording' | 'processing' | 'extracted'>('recording')
  const [edited, setEdited] = useState({ ...sampleVoiceExtraction, note: sampleVoiceTranscript })

  const simulate = () => {
    setPhase('processing')
    setTimeout(() => setPhase('extracted'), 1400)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-modal border border-border bg-surface shadow-card-hover">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-body font-semibold text-text-primary flex items-center gap-2">
            <Mic className="h-4 w-4 text-accent" />
            Voice Note
          </h3>
          <button onClick={onClose} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          {phase === 'recording' && (
            <>
              <div className="rounded-card border border-border bg-surface-elevated p-4 mb-4">
                <div className="flex items-center gap-2 mb-2 text-caption text-text-muted">
                  <span className="h-2 w-2 rounded-full bg-danger animate-pulse-live" />
                  Simulated transcript
                </div>
                <p className="text-meta text-text-secondary italic">"{sampleVoiceTranscript}"</p>
              </div>
              <button
                onClick={simulate}
                className="w-full rounded-button bg-accent py-2.5 text-body font-medium text-white hover:bg-accent-hover"
              >
                Extract with AI
              </button>
            </>
          )}
          {phase === 'processing' && (
            <div className="text-center py-8">
              <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-3" />
              <div className="text-body text-text-secondary">Extracting insights…</div>
            </div>
          )}
          {phase === 'extracted' && (
            <>
              <div className="flex items-center gap-1.5 mb-4 text-caption text-text-muted">
                <AlertCircle className="h-3.5 w-3.5" />
                AI extracted — review and edit before saving
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Company', field: 'company', options: null },
                  { label: 'Area', field: 'area', options: null },
                  { label: 'Interest', field: 'interest', options: INTEREST as unknown as string[] },
                  { label: 'Talent Signal', field: 'talentSignal', options: ['Strong Potential', 'Worth Nurturing', 'Not Enough Info', 'Not Relevant'] },
                  { label: 'Potential Role', field: 'potentialRole', options: ROLES as unknown as string[] },
                  { label: 'Follow-Up Owner', field: 'followUpOwner', options: employees.map((e) => e.name) },
                ].map(({ label, field, options }) => (
                  <div key={field} className="flex items-center justify-between gap-4">
                    <span className="text-meta text-text-secondary w-32 shrink-0">{label}</span>
                    {options ? (
                      <select
                        value={(edited as Record<string, string>)[field]}
                        onChange={(e) => setEdited({ ...edited, [field]: e.target.value })}
                        className="flex-1 rounded-button border border-border bg-surface-elevated px-3 py-1.5 text-meta text-text-primary outline-none focus:border-accent"
                      >
                        {options.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        value={(edited as Record<string, string>)[field]}
                        onChange={(e) => setEdited({ ...edited, [field]: e.target.value })}
                        className="flex-1 rounded-button border border-border bg-surface-elevated px-3 py-1.5 text-meta text-text-primary outline-none focus:border-accent"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={onClose} className="flex-1 rounded-button border border-border py-2.5 text-body text-text-secondary hover:bg-surface-elevated">
                  Discard
                </button>
                <button
                  onClick={() => onAccept(edited)}
                  className="flex-1 rounded-button bg-accent py-2.5 text-body font-medium text-white hover:bg-accent-hover"
                >
                  Accept & Save
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function InteractionLogger({ attendees, onClose, defaultAttendeeId }: Props) {
  const addInteraction = useEventLoopStore((s) => s.addInteraction)
  const [scanned, setScanned] = useState<EventAttendee | null>(
    defaultAttendeeId ? attendees.find((a) => a.id === defaultAttendeeId) ?? null : null
  )
  const [employeeId, setEmployeeId] = useState(employees[0].id)
  const [convType, setConvType] = useState<typeof CONV_TYPES[number]>('Technical')
  const [engagement, setEngagement] = useState<typeof ENGAGEMENT[number]>('Good')
  const [signal, setSignal] = useState<typeof SIGNALS[number]>('Worth Nurturing')
  const [interest, setInterest] = useState<typeof INTEREST[number]>('Unknown')
  const [role, setRole] = useState<typeof ROLES[number]>('FDE')
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState(true)
  const [followUpOwner, setFollowUpOwner] = useState(employees[1].name)
  const [saved, setSaved] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const handleScan = () => {
    const checked = attendees.filter((a) => a.attendanceStatus === 'Checked In')
    if (checked.length > 0) setScanned(checked[Math.floor(Math.random() * checked.length)])
  }

  const handleSave = () => {
    if (!scanned) return
    const interaction: Interaction = {
      id: uid(),
      attendeeId: scanned.id,
      employeeId,
      employeeName: employees.find((e) => e.id === employeeId)?.name ?? '',
      employeeRole: employees.find((e) => e.id === employeeId)?.role ?? '',
      conversationType: convType,
      engagement,
      talentSignal: signal,
      recruitingInterest: interest,
      potentialRole: role,
      note,
      followUp,
      followUpOwner,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    addInteraction(interaction)
    setSaved(true)
  }

  const handleVoiceAccept = (data: typeof sampleVoiceExtraction & { note: string }) => {
    setNote(data.note)
    setInterest(data.interest)
    setSignal(data.talentSignal === 'Strong Potential' ? 'Strong Potential' : 'Worth Nurturing')
    setRole(data.potentialRole)
    setFollowUpOwner(data.followUpOwner)
    setVoiceOpen(false)
  }

  const emp = employees.find((e) => e.id === employeeId)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg mx-4 rounded-modal border border-border bg-surface shadow-card-hover max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
            <h2 className="text-body font-semibold text-text-primary flex items-center gap-2">
              <QrCode className="h-4 w-4 text-accent" />
              Log Interaction
            </h2>
            <button onClick={onClose} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {saved ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <div className="text-label font-semibold text-text-primary mb-1">Interaction logged</div>
                <div className="text-body text-text-secondary">{scanned?.name}</div>
                <div className="text-meta text-text-muted">{emp?.name} → {convType} · {engagement}</div>
                <button
                  onClick={() => { setSaved(false); setScanned(null); setNote('') }}
                  className="mt-5 rounded-button border border-border px-4 py-2 text-body text-text-secondary hover:bg-surface-elevated"
                >
                  Log another
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Employee */}
                <div>
                  <label className="text-caption text-text-muted mb-1.5 block">You are</label>
                  <div className="relative">
                    <select
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-body text-text-primary outline-none focus:border-accent appearance-none"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Attendee scan */}
                <div>
                  <label className="text-caption text-text-muted mb-1.5 block">Candidate</label>
                  {!scanned ? (
                    <button
                      onClick={handleScan}
                      className="flex w-full items-center justify-center gap-3 rounded-card border-2 border-dashed border-border py-5 text-body text-text-secondary hover:border-accent/40 hover:bg-surface-elevated hover:text-accent transition-colors"
                    >
                      <QrCode className="h-6 w-6 opacity-60" />
                      <span>Simulate Scanning Attendee Badge</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 rounded-card border border-border bg-surface-elevated p-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${
                        scanned.priority === 'A' ? 'bg-danger/15 text-danger' : scanned.priority === 'B' ? 'bg-warning/15 text-warning' : 'bg-surface text-text-secondary'
                      }`}>
                        {scanned.priority}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body font-semibold text-text-primary">{scanned.name}</div>
                        <div className="text-caption text-text-muted">{scanned.title} · {scanned.company}</div>
                      </div>
                      <button onClick={() => setScanned(null)} className="text-text-muted hover:text-text-secondary">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {scanned && (
                  <>
                    {/* Conversation type */}
                    <div>
                      <label className="text-caption text-text-muted mb-1.5 block">Conversation type</label>
                      <div className="grid grid-cols-4 gap-2">
                        {CONV_TYPES.map((t) => (
                          <button
                            key={t}
                            onClick={() => setConvType(t)}
                            className={`rounded-button border py-2 text-caption font-medium transition-colors ${
                              convType === t ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'
                            }`}
                          >{t}</button>
                        ))}
                      </div>
                    </div>

                    {/* Engagement */}
                    <div>
                      <label className="text-caption text-text-muted mb-1.5 block">Engagement</label>
                      <div className="grid grid-cols-3 gap-2">
                        {ENGAGEMENT.map((e) => (
                          <button
                            key={e}
                            onClick={() => setEngagement(e)}
                            className={`rounded-button border py-2 text-caption font-medium transition-colors ${
                              engagement === e ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'
                            }`}
                          >{e}</button>
                        ))}
                      </div>
                    </div>

                    {/* Talent signal */}
                    <div>
                      <label className="text-caption text-text-muted mb-1.5 block">Talent signal</label>
                      <div className="grid grid-cols-2 gap-2">
                        {SIGNALS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSignal(s)}
                            className={`rounded-button border py-2 text-caption font-medium transition-colors ${
                              signal === s ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'
                            }`}
                          >{s}</button>
                        ))}
                      </div>
                    </div>

                    {/* Recruiting interest */}
                    <div>
                      <label className="text-caption text-text-muted mb-1.5 block">Recruiting interest</label>
                      <div className="grid grid-cols-4 gap-2">
                        {INTEREST.map((i) => (
                          <button
                            key={i}
                            onClick={() => setInterest(i)}
                            className={`rounded-button border py-2 text-caption font-medium transition-colors ${
                              interest === i ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'
                            }`}
                          >{i}</button>
                        ))}
                      </div>
                    </div>

                    {/* Potential role */}
                    <div>
                      <label className="text-caption text-text-muted mb-1.5 block">Potential role</label>
                      <div className="grid grid-cols-4 gap-2">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`rounded-button border py-2 text-caption font-medium transition-colors ${
                              role === r ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'
                            }`}
                          >{r}</button>
                        ))}
                      </div>
                    </div>

                    {/* Note */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-caption text-text-muted">Note</label>
                        <button
                          onClick={() => setVoiceOpen(true)}
                          className="flex items-center gap-1 text-caption text-accent hover:text-accent-hover"
                        >
                          <Mic className="h-3 w-3" />
                          Add Voice Note
                        </button>
                      </div>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="Brief notes on the conversation…"
                        className="input resize-none bg-surface-elevated"
                      />
                    </div>

                    {/* Follow up */}
                    <div>
                      <label className="text-caption text-text-muted mb-1.5 block">Follow up?</label>
                      <div className="flex gap-2 mb-2">
                        {[true, false].map((v) => (
                          <button
                            key={String(v)}
                            onClick={() => setFollowUp(v)}
                            className={`flex-1 rounded-button border py-2 text-body font-medium transition-colors ${
                              followUp === v ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'
                            }`}
                          >{v ? 'Yes' : 'No'}</button>
                        ))}
                      </div>
                      {followUp && (
                        <div className="relative">
                          <select
                            value={followUpOwner}
                            onChange={(e) => setFollowUpOwner(e.target.value)}
                            className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-body text-text-primary outline-none focus:border-accent appearance-none"
                          >
                            {employees.map((e) => <option key={e.id}>{e.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {!saved && scanned && (
            <div className="border-t border-border px-5 py-4 shrink-0">
              <button
                onClick={handleSave}
                className="w-full rounded-button bg-accent py-2.5 text-body font-semibold text-white hover:bg-accent-hover transition-colors"
              >
                Save Interaction
              </button>
            </div>
          )}
        </div>
      </div>

      {voiceOpen && (
        <VoiceNoteModal onClose={() => setVoiceOpen(false)} onAccept={handleVoiceAccept} />
      )}
    </>
  )
}
