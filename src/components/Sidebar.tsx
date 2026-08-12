import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Hexagon, Columns3, ListChecks, Inbox, UserPlus, TrendingUp, Settings, Bell, ChevronsLeft, ChevronsRight, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Avatar } from './ui/Avatar'
import { slaState } from '../lib/stageEngine'
import { NotificationTray } from './NotificationTray'

const SCHEDULING_STAGES = new Set([
  'Screening Scheduled', 'Phone Screen', 'Round N Scheduling',
  'Round N In Progress', 'Pending Feedback', 'Debrief / Decision',
  'Assessment to Send', 'Assessment Pending', 'Assessment Review',
])

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  forceCollapsed,
}: {
  mobileOpen?: boolean
  onCloseMobile?: () => void
  forceCollapsed?: boolean
}) {
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const collapsed = forceCollapsed ?? localCollapsed
  const [notifOpen, setNotifOpen] = useState(false)
  const currentUser = useStore((s) => s.currentUser())
  const candidates = useStore((s) => s.candidates)
  const drafts = useStore((s) => s.agentDrafts)
  const trackers = useStore((s) => s.newHireTrackers)
  const notifications = useStore((s) => s.notifications)

  const counts = useMemo(() => {
    const pendingDrafts = drafts.filter((d) => d.status === 'pending').length
    const openRequests = candidates.filter(
      (c) => SCHEDULING_STAGES.has(c.currentStage) && !c.tags.includes('Rejected'),
    ).length
    const newHires = Object.values(trackers).filter((t) => !t.readyToStart).length
    const atRisk = candidates.filter((c) => {
      const s = slaState(c.slaDeadline, c.stageEnteredAt)
      return s === 'breach' || s === 'at_risk'
    }).length
    return { pendingDrafts, openRequests, newHires, atRisk }
  }, [drafts, trackers, candidates])

  const unread = notifications.filter((n) => n.userId === currentUser.id && !n.read).length

  const NAV = [
    {
      to: '/pipeline',
      icon: Columns3,
      label: 'Pipeline',
      count: 0,
      accent: false,
      title: 'G then P',
    },
    {
      to: '/queue',
      icon: ListChecks,
      label: 'My Queue',
      count: counts.pendingDrafts,
      accent: counts.pendingDrafts > 0,
      title: 'G then Q',
    },
    {
      to: '/requests',
      icon: Inbox,
      label: 'Requests',
      count: counts.openRequests + counts.pendingDrafts,
      accent: counts.pendingDrafts > 0,
      title: 'G then R',
    },
    {
      to: '/onboarding',
      icon: UserPlus,
      label: 'Onboarding',
      count: counts.newHires,
      accent: false,
      title: 'G then O',
    },
    {
      to: '/reports',
      icon: TrendingUp,
      label: 'Reports',
      count: 0,
      accent: false,
      title: 'G then X',
    },
  ]

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onCloseMobile} />}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col justify-between border-r border-border bg-surface transition-transform duration-panel md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          collapsed ? 'md:w-[64px]' : 'md:w-[220px] w-[240px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div>
          {/* Logo */}
          <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
            <Hexagon className="h-6 w-6 shrink-0 text-accent" strokeWidth={2.5} />
            {!collapsed && (
              <span className="text-label font-semibold tracking-tight text-text-primary">RecruiterOS</span>
            )}
          </div>

          {/* Nav items */}
          <nav className="mt-1 flex flex-col gap-0.5 px-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/pipeline'}
                onClick={onCloseMobile}
                title={collapsed ? `${item.label} (${item.title})` : item.title}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2.5 rounded-button px-2.5 py-2 text-body transition-colors duration-micro ${
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                  } ${collapsed ? 'md:justify-center' : ''}`
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.count > 0 && (
                  <span className={`rounded-tag px-1.5 py-0.5 text-caption font-mono ${
                    item.accent ? 'bg-accent/20 text-accent' : 'bg-surface-elevated text-text-secondary'
                  }`}>
                    {item.count}
                  </span>
                )}
                {collapsed && item.count > 0 && (
                  <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${item.accent ? 'bg-accent' : 'bg-text-secondary'}`} />
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border px-2 py-3">
          {/* Notifications */}
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={`mb-1 flex w-full items-center gap-2.5 rounded-button px-2.5 py-2 text-body text-text-secondary hover:bg-surface-elevated hover:text-text-primary ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="relative">
              <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
              {unread > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />}
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Notifications</span>
                {unread > 0 && (
                  <span className="rounded-tag bg-danger/20 px-1.5 py-0.5 text-caption font-mono text-danger">{unread}</span>
                )}
              </>
            )}
          </button>

          {/* Settings + user */}
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
            {!collapsed && <Settings className="h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={2} />}
          </NavLink>

          {/* Collapse toggle */}
          <button
            onClick={() => setLocalCollapsed((v) => !v)}
            className="mt-2 hidden w-full items-center justify-center rounded-button py-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-secondary md:flex"
            title="Toggle sidebar ([)"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        {notifOpen && <NotificationTray onClose={() => setNotifOpen(false)} />}
      </div>
    </>
  )
}
