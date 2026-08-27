import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import {
  Zap, Target, CalendarDays, Users, BarChart3, Plus,
  ChevronsLeft, ChevronsRight, Menu, X,
} from 'lucide-react'

const NAV = [
  { to: '/talent-needs', icon: Target, label: 'Talent Needs' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/candidates', icon: Users, label: 'Candidates' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
]

export function EventLoopLayout() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text-primary">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col justify-between border-r border-border bg-surface transition-transform duration-panel md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          collapsed ? 'md:w-[64px]' : 'md:w-[220px] w-[240px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div>
          {/* Logo */}
          <div className={`flex items-center gap-2.5 px-4 py-4 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button bg-accent text-white">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-body font-semibold tracking-tight text-text-primary leading-none">EventLoop</div>
                <div className="text-caption text-text-muted leading-none mt-0.5">Recruiting Intelligence</div>
              </div>
            )}
          </div>

          {/* Plan Event CTA */}
          {!collapsed && (
            <div className="px-3 mb-3">
              <button
                onClick={() => { navigate('/events/new'); setMobileOpen(false) }}
                className="flex w-full items-center justify-center gap-2 rounded-button bg-accent px-3 py-2 text-body font-medium text-white hover:bg-accent-hover transition-colors"
              >
                <Plus className="h-4 w-4" />
                Plan Event
              </button>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center px-0 mb-3">
              <button
                onClick={() => navigate('/events/new')}
                className="flex h-9 w-9 items-center justify-center rounded-button bg-accent text-white hover:bg-accent-hover transition-colors"
                title="Plan Event"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded-button px-2.5 py-2 text-body transition-colors duration-micro ${
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                  } ${collapsed ? 'md:justify-center' : ''}`
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="border-t border-border px-2 py-3">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden w-full items-center justify-center rounded-button py-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-secondary md:flex"
            title="Toggle sidebar"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-button p-1 text-text-secondary hover:bg-surface-elevated"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Zap className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="text-body font-semibold text-text-primary">EventLoop</span>
          <button
            onClick={() => navigate('/events/new')}
            className="ml-auto flex items-center gap-1.5 rounded-button bg-accent px-3 py-1.5 text-caption font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Plan Event
          </button>
        </div>

        <main className="relative flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{ style: { background: '#1A1A1A', color: '#EDEDEA', border: '1px solid #303030' } }}
      />
    </div>
  )
}
