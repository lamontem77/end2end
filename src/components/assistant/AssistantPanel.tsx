import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, MessageCircle, Send, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Avatar'

const SUGGESTIONS = ['Schedule an interview with Jordan Rivera', 'Self-schedule a call with Taylor Kim', "What's the status of Casey Liu?", 'Nudge the interviewer on Jordan Rivera']

export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser())
  const messages = useStore((s) => s.chatMessages)
  const sendChatMessage = useStore((s) => s.sendChatMessage)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setDraft('')
    setSending(true)
    sendChatMessage(trimmed)
    // Mirrors the ~300ms "drafting" latency used elsewhere so the bot reply
    // doesn't pop in before the user message has visibly landed.
    setTimeout(() => setSending(false), 350)
  }

  function openCandidate(candidateId: string) {
    navigate('/tickets/board')
    setSelectedCandidate(candidateId)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={onClose} />
      <div className="fixed bottom-4 right-4 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-modal border border-border bg-surface-elevated shadow-card-hover">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-meta font-semibold text-text-primary">RecruiterOS Assistant</div>
            <div className="flex items-center gap-1 text-caption text-text-secondary">
              <MessageCircle className="h-3 w-3" /> Preview of the Slack bot
            </div>
          </div>
          <button onClick={onClose} className="rounded-button p-1 text-text-secondary hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.length === 0 && (
            <div className="mx-1 rounded-card border border-dashed border-border px-3 py-3 text-caption text-text-secondary">
              Try asking me to schedule an interview, send an assessment, nudge an interviewer, or check a candidate's status — just
              like you'd message the Slack bot. I'll draft the request and drop it in your Approvals Queue; nothing sends without
              your sign-off.
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-tag border border-border bg-surface px-2 py-1 text-caption text-text-secondary hover:border-accent hover:text-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex items-start justify-end gap-2">
                <div className="max-w-[80%] rounded-card bg-accent px-3 py-2 text-meta text-white">{m.text}</div>
                <Avatar userId={currentUser.id} size={22} />
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2">
                <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="max-w-[80%] rounded-card border border-border bg-surface px-3 py-2 text-meta text-text-primary">
                  {m.text}
                  {m.candidateId && (
                    <button onClick={() => openCandidate(m.candidateId!)} className="mt-1.5 block text-caption font-medium text-accent hover:text-accent-hover">
                      Open ticket →
                    </button>
                  )}
                </div>
              </div>
            ),
          )}

          {sending && (
            <div className="flex items-center gap-2">
              <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Bot className="h-3 w-3" />
              </div>
              <div className="flex gap-1 rounded-card border border-border bg-surface px-3 py-2.5">
                <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-text-muted" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-text-muted" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-text-muted" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border px-3 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit(draft)
            }}
            placeholder="Message the assistant…"
            className="input"
            autoFocus
          />
          <button
            onClick={() => submit(draft)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-accent text-white hover:bg-accent-hover"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}
