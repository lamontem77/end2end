import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { STAGES } from '../lib/stageEngine'
import { ArrowRight, LayoutDashboard, ListChecks, UserPlus, CalendarClock, Zap } from 'lucide-react'

export function CommandPalette() {
  const open = useStore((s) => s.commandPaletteOpen)
  const setOpen = useStore((s) => s.setCommandPaletteOpen)
  const candidates = useStore((s) => s.candidates)
  const drafts = useStore((s) => s.agentDrafts)
  const approveDraft = useStore((s) => s.approveDraft)
  const moveToStage = useStore((s) => s.moveToStage)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)
  const navigate = useNavigate()

  const close = () => setOpen(false)
  const go = (path: string) => {
    navigate(path)
    close()
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed left-1/2 top-[15%] z-[200] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-modal border border-border bg-surface-elevated shadow-card-hover"
    >
      <Command.Input
        autoFocus
        placeholder="Search candidates, jump to a page, or run a command…"
        className="w-full border-b border-border bg-transparent px-4 py-3.5 text-body text-text-primary outline-none placeholder:text-text-muted"
      />
      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-meta text-text-muted">No results.</Command.Empty>

        <Command.Group heading="Navigate" className="px-2 py-1 text-caption font-medium uppercase tracking-wide text-text-muted">
          <Item onSelect={() => go('/tickets/board')} icon={<LayoutDashboard className="h-4 w-4" />}>
            Go to Tickets
          </Item>
          <Item onSelect={() => go('/tickets/queue')} icon={<ListChecks className="h-4 w-4" />}>
            Go to My Queue
          </Item>
          <Item onSelect={() => go('/new-hires')} icon={<UserPlus className="h-4 w-4" />}>
            Go to New Hires
          </Item>
          <Item onSelect={() => go('/scheduling')} icon={<CalendarClock className="h-4 w-4" />}>
            Go to Scheduling
          </Item>
          <Item onSelect={() => go('/tickets/at-risk')} icon={<Zap className="h-4 w-4" />}>
            Go to At Risk
          </Item>
        </Command.Group>

        <Command.Group heading="Actions" className="px-2 py-1 text-caption font-medium uppercase tracking-wide text-text-muted">
          <Item
            onSelect={() => {
              drafts.filter((d) => d.status === 'pending').forEach((d) => approveDraft(d.id))
              close()
            }}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Approve all pending drafts
          </Item>
        </Command.Group>

        <Command.Group heading="Candidates" className="px-2 py-1 text-caption font-medium uppercase tracking-wide text-text-muted">
          {candidates.map((c) => (
            <Command.Item
              key={c.id}
              value={`${c.name} ${c.role}`}
              onSelect={() => {
                navigate('/tickets/board')
                setSelectedCandidate(c.id)
                close()
              }}
              className="flex cursor-pointer items-center justify-between rounded-button px-3 py-2 text-body text-text-primary data-[selected=true]:bg-accent/15"
            >
              <span>
                Open {c.name} <span className="text-text-secondary">— {c.role}</span>
              </span>
              <span className="text-caption text-text-muted">{c.currentStage}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Move candidate" className="px-2 py-1 text-caption font-medium uppercase tracking-wide text-text-muted">
          {candidates.slice(0, 5).map((c) =>
            STAGES.filter((s) => s !== c.currentStage)
              .slice(0, 1)
              .map((s) => (
                <Command.Item
                  key={`${c.id}-${s}`}
                  value={`Move ${c.name} to ${s}`}
                  onSelect={() => {
                    moveToStage(c.id, s, 'You')
                    close()
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-button px-3 py-2 text-body text-text-primary data-[selected=true]:bg-accent/15"
                >
                  Move {c.name} to {s}
                </Command.Item>
              )),
          )}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

function Item({ children, onSelect, icon }: { children: React.ReactNode; onSelect: () => void; icon: React.ReactNode }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-button px-3 py-2 text-body text-text-primary data-[selected=true]:bg-accent/15"
    >
      <span className="text-text-secondary">{icon}</span>
      {children}
    </Command.Item>
  )
}
