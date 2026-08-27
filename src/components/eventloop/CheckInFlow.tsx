import { useState } from 'react'
import { X, Search, QrCode, CheckCircle2, User, Building2 } from 'lucide-react'
import type { EventAttendee } from '../../data/eventloop'
import { useEventLoopStore } from '../../store/eventloopStore'

interface Props {
  attendees: EventAttendee[]
  onClose: () => void
}

export function CheckInFlow({ attendees, onClose }: Props) {
  const checkIn = useEventLoopStore((s) => s.checkIn)
  const [query, setQuery] = useState('')
  const [scanned, setScanned] = useState<EventAttendee | null>(null)
  const [checked, setChecked] = useState(false)

  const filtered = query.length > 0
    ? attendees.filter((a) =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.email.toLowerCase().includes(query.toLowerCase()) ||
        a.company.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const handleCheckIn = (attendee: EventAttendee) => {
    setScanned(attendee)
    setChecked(false)
  }

  const confirmCheckIn = () => {
    if (!scanned) return
    checkIn(scanned.id)
    setChecked(true)
  }

  const priorityColor = { A: 'text-danger bg-danger/10', B: 'text-warning bg-warning/10', C: 'text-text-secondary bg-surface-elevated' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-modal border border-border bg-surface shadow-card-hover">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-body font-semibold text-text-primary flex items-center gap-2">
            <QrCode className="h-4 w-4 text-accent" />
            Check In Attendee
          </h2>
          <button onClick={onClose} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {!scanned ? (
            <>
              {/* QR Simulation */}
              <button
                onClick={() => {
                  const unchecked = attendees.filter((a) => a.rsvpStatus === 'Yes' && a.attendanceStatus !== 'Checked In')
                  if (unchecked.length > 0) handleCheckIn(unchecked[Math.floor(Math.random() * unchecked.length)])
                }}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-card border-2 border-dashed border-border py-6 text-body text-text-secondary hover:border-accent/40 hover:bg-surface-elevated hover:text-accent transition-colors"
              >
                <QrCode className="h-8 w-8 opacity-50" />
                <div className="text-left">
                  <div className="font-medium">Simulate QR Scan</div>
                  <div className="text-caption text-text-muted">Click to simulate scanning an attendee badge</div>
                </div>
              </button>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email, or company…"
                  className="input pl-9 bg-surface-elevated"
                />
              </div>

              {filtered.length > 0 && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-card border border-border bg-surface">
                  {filtered.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleCheckIn(a)}
                      className="flex w-full items-center gap-3 border-b border-border p-3 last:border-0 hover:bg-surface-elevated transition-colors"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${priorityColor[a.priority]}`}>
                        {a.priority}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-body font-medium text-text-primary truncate">{a.name}</div>
                        <div className="text-caption text-text-muted truncate">{a.title} · {a.company}</div>
                      </div>
                      {a.attendanceStatus === 'Checked In' && (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              {checked ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                  <div className="text-label font-semibold text-text-primary mb-1">Checked in!</div>
                  <div className="text-body text-text-secondary mb-1">{scanned.name}</div>
                  <div className="text-caption text-text-muted">{scanned.title} · {scanned.company}</div>
                  <div className="mt-2 text-caption text-success">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Simulated badge */}
                  <div className="mt-5 mx-auto w-48 rounded-card border-2 border-border bg-surface-elevated p-4 text-center">
                    <div className="text-body font-semibold text-text-primary">{scanned.name}</div>
                    <div className="text-caption text-text-secondary mt-0.5">{scanned.title}</div>
                    <div className="text-caption text-accent">{scanned.company}</div>
                    <div className="mt-3 mx-auto h-10 w-10 rounded border border-border bg-surface flex items-center justify-center">
                      <QrCode className="h-6 w-6 text-text-muted" />
                    </div>
                    <div className="mt-1 text-caption text-text-muted font-mono">{scanned.evtId}</div>
                  </div>

                  <button
                    onClick={() => { setScanned(null); setQuery(''); setChecked(false) }}
                    className="mt-4 rounded-button border border-border px-4 py-2 text-meta text-text-secondary hover:bg-surface-elevated"
                  >
                    Check in another
                  </button>
                </div>
              ) : (
                <div>
                  <div className="rounded-card border border-border bg-surface-elevated p-4 mb-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body font-semibold ${priorityColor[scanned.priority]}`}>
                      {scanned.priority}
                    </div>
                    <div>
                      <div className="text-body font-semibold text-text-primary">{scanned.name}</div>
                      <div className="text-meta text-text-secondary flex items-center gap-1.5">
                        <User className="h-3 w-3" />{scanned.title}
                        <span className="text-text-muted">·</span>
                        <Building2 className="h-3 w-3" />{scanned.company}
                      </div>
                      <div className="text-caption text-text-muted mt-0.5">{scanned.evtId}</div>
                    </div>
                  </div>

                  {scanned.attendanceStatus === 'Checked In' ? (
                    <div className="flex items-center gap-2 text-body text-success mb-4">
                      <CheckCircle2 className="h-4 w-4" />
                      Already checked in at {scanned.checkInTime}
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    <button onClick={() => { setScanned(null); setQuery('') }} className="flex-1 rounded-button border border-border py-2.5 text-body text-text-secondary hover:bg-surface-elevated">
                      Cancel
                    </button>
                    <button
                      onClick={confirmCheckIn}
                      disabled={scanned.attendanceStatus === 'Checked In'}
                      className="flex-1 rounded-button bg-success py-2.5 text-body font-medium text-white hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {scanned.attendanceStatus === 'Checked In' ? 'Already Checked In' : 'Confirm Check-In'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
