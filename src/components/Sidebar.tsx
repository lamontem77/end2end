import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Hexagon, LayoutDashboard, ListChecks, UserPlus, CalendarClock, Zap, TrendingUp, ChevronsLeft, ChevronsRight, Bell } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Avatar } from './ui/Avatar'
import { slaState } from '../lib/stageEngine'
import { NotificationTray } from './NotificationTray'

const NAV = [
  { to: '/tickets', icon: LayoutDashboard, label: 'Tickets', badge: 'none' as const },
  { to: '/tickets/queue', icon: ListChecks, label: 'My Queue', badge: 'queue' as const },
  { to: '/new-hires', icon: UserPlus, label: 'New Hires', badge: 'newHires' as const },
  { to: '/scheduling', icon: CalendarClock, label: 'Scheduling', badge: 'none' as const },
  { to: '/tickets/at-risk', icon: Zap, label: 'At Risk', badge: 'atRisk' as const },
  { to: '/reports', icon: TrendingUp, label: 'Reports', badge: 'none' as const },
]

export function Sidebar({ mobileOpen = false, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const currentUser = useStore((s) => s.currentUser())
  const candidates = useStore((s) => s.candidates)
  const drafts = useStore((s) => s.agentDrafts)
  const trackers = useStore((s) => s.newHireTrackers)
  const notifications = useStore((s) => s.notifications)

  const counts = useMemo(() => {
    const queue = drafts.filter((d) => d.status === 'pending' && d.candidateName).length
    const newHires = Object.values(trackers).filter((t) => !t.readyToStart).length
    const atRisk = candidates.filter((c) => {
      const state = slaState(c.slaDeadline, c.stageEnteredAt)
      return state === 'breach' || state === 'at_risk'
    }).length
    return { queue, newHires, atRisk }
  }, [drafts, trackers, candidates])

  const unread = notifications.filter((n) => n.userId === currentUser.id && !n.read).length

  const badgeCount = (key: 'queue' | 'newHires' | 'atRisk' | 'none') => {
    if (key === 'none') return 0
    return counts[key]
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onCloseMobile} />}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[240px] flex-col justify-between border-r border-border bg-surface transition-transform duration-panel md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          collapsed ? 'md:w-[64px]' : 'md:w-[220px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
      <div>
        <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <Hexagon className="h-6 w-6 shrink-0 text-accent" strokeWidth={2.5} />
          <span className={`text-label font-semibold tracking-tight text-text-primary ${collapsed ? 'md:hidden' : ''}`}>RecruiterOS</span>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-2">
          {NAV.map((item) => {
            const count = badgeCount(item.badge)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/tickets'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded-button px-2.5 py-2 text-body transition-colors duration-micro ${
                    isActive ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                  } ${collapsed ? 'md:justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && count > 0 && (
                  <span className="rounded-tag bg-surface-elevated px-1.5 py-0.5 text-caption font-mono text-text-secondary">{count}</span>
                )}
                {collapsed && count > 0 && <span className="absolute ml-6 mt-[-14px] h-1.5 w-1.5 rounded-full bg-accent" />}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border px-2 py-3">
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className={`mb-1 flex w-full items-center gap-2.5 rounded-button px-2.5 py-2 text-body text-text-secondary hover:bg-surface-elevated hover:text-text-primary ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="relative">
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
            {unread > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />}
          </div>
          {!collapsed && <span className="flex-1 text-left">Notifications</span>}
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-button px-2.5 py-2 transition-colors duration-micro hover:bg-surface-elevated ${isActive ? 'bg-surface-elevated' : ''} ${collapsed ? 'justify-center' : ''}`
          }
        >
          <Avatar userId={currentUser.id} size={26} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-meta font-medium text-text-primary">{currentUser.name}</div>
              <div className="flex items-center gap-1 text-caption text-success">
                <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-success" />
                Live
              </div>
            </div>
          )}
        </NavLink>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mt-2 hidden w-full items-center justify-center rounded-button py-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-secondary md:flex"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {notifOpen && <NotificationTray onClose={() => setNotifOpen(false)} />}
      </div>
    </>
  )
}
