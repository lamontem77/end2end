import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useStore } from '../store/useStore'

export function NotificationTray({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser())
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markNotificationRead)
  const markAllRead = useStore((s) => s.markAllNotificationsRead)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)

  const mine = notifications
    .filter((n) => n.userId === currentUser.id)
    .slice()
    .reverse()

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-16 left-2 z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-modal border border-border bg-surface-elevated shadow-card-hover">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-body font-semibold text-text-primary">Notifications</span>
          <button onClick={markAllRead} className="text-caption text-accent hover:text-accent-hover">
            Mark all read
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mine.length === 0 && <div className="px-4 py-8 text-center text-meta text-text-muted">You're all caught up.</div>}
          {mine.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                markRead(n.id)
                if (n.candidateId) {
                  navigate('/tickets/board')
                  setSelectedCandidate(n.candidateId)
                }
                onClose()
              }}
              className={`block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface ${!n.read ? 'bg-accent/5' : ''}`}
            >
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-meta font-medium text-text-primary">{n.title}</div>
                  <div className="truncate text-caption text-text-secondary">{n.body}</div>
                  <div className="mt-0.5 text-caption text-text-muted">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
