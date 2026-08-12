import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Menu, Hexagon, Bot } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { useStore } from '../store/useStore'
import { TicketDrawer } from './tickets/TicketDrawer'
import { AssistantPanel } from './assistant/AssistantPanel'
import { InterviewRequestModal } from './InterviewRequestModal'

export function Layout() {
  const navigate = useNavigate()
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen)
  const selectedCandidateId = useStore((s) => s.selectedCandidateId)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [newRequestOpen, setNewRequestOpen] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

      // Cmd+K → command palette (works even while typing)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }
      // Cmd+Enter → approve focused item (handled in individual components)
      if (typing) return

      // Escape — close drawer
      if (e.key === 'Escape') {
        useStore.getState().setSelectedCandidate(null)
        return
      }

      // [ → toggle sidebar
      if (e.key === '[') {
        setSidebarCollapsed((v) => !v)
        return
      }

      // N → new interview request
      if (e.key === 'n' || e.key === 'N') {
        setNewRequestOpen(true)
        return
      }

      // / → focus search (handled by command palette)
      if (e.key === '/') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      // G+letter navigation (PRD spec)
      if (e.key === 'g') {
        let gTimeout: ReturnType<typeof setTimeout>
        const handler = (e2: KeyboardEvent) => {
          clearTimeout(gTimeout)
          window.removeEventListener('keydown', handler)
          if (e2.key === 'p') navigate('/pipeline')
          if (e2.key === 'q') navigate('/queue')
          if (e2.key === 'r') navigate('/requests')
          if (e2.key === 'o') navigate('/onboarding')
          if (e2.key === 'x') navigate('/reports')
        }
        window.addEventListener('keydown', handler, { once: false })
        gTimeout = setTimeout(() => window.removeEventListener('keydown', handler), 800)
      }
    },
    [navigate, setCommandPaletteOpen],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text-primary">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        forceCollapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-button p-1 text-text-secondary hover:bg-surface-elevated"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Hexagon className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="text-body font-semibold text-text-primary">RecruiterOS</span>
        </div>
        <main className="relative flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <CommandPalette />
      {selectedCandidateId && <TicketDrawer candidateId={selectedCandidateId} />}
      {newRequestOpen && <InterviewRequestModal onClose={() => setNewRequestOpen(false)} />}

      {assistantOpen ? (
        <AssistantPanel onClose={() => setAssistantOpen(false)} />
      ) : (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-card-hover transition-colors duration-micro hover:bg-accent-hover"
          title="Ask the RecruiterOS assistant"
        >
          <Bot className="h-5 w-5" />
        </button>
      )}

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{ style: { background: '#1A1A1A', color: '#EDEDEA', border: '1px solid #303030' } }}
      />
    </div>
  )
}
