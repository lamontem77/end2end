import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Menu, Hexagon, Bot } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { useStore } from '../store/useStore'
import { TicketDrawer } from './tickets/TicketDrawer'
import { AssistantPanel } from './assistant/AssistantPanel'

export function Layout() {
  const navigate = useNavigate()
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen)
  const selectedCandidateId = useStore((s) => s.selectedCandidateId)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  useEffect(() => {
    let gPressed = false
    let gTimeout: ReturnType<typeof setTimeout>

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }
      if (typing) return

      if (gPressed) {
        gPressed = false
        clearTimeout(gTimeout)
        if (e.key === 't') navigate('/tickets/board')
        if (e.key === 'q') navigate('/tickets/queue')
        if (e.key === 'h') navigate('/new-hires')
        if (e.key === 's') navigate('/scheduling')
        return
      }
      if (e.key === 'g') {
        gPressed = true
        gTimeout = setTimeout(() => (gPressed = false), 800)
        return
      }
      if (e.key === 'Escape') {
        useStore.getState().setSelectedCandidate(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, setCommandPaletteOpen])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text-primary">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button onClick={() => setMobileNavOpen(true)} className="rounded-button p-1 text-text-secondary hover:bg-surface-elevated">
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

      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: '#242424', color: '#F0F0F0', border: '1px solid #2E2E2E' } }} />
    </div>
  )
}
