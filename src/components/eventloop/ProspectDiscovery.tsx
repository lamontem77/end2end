import { useState } from 'react'
import { X, Search, UserPlus, Check, Minus, ChevronRight, Sparkles, Info } from 'lucide-react'
import { discoveryResults, fdeArchetypes } from '../../data/eventloop'
import type { Prospect, ProspectSource } from '../../data/eventloop'

interface Props {
  eventId: string
  onClose: () => void
  onAdd: (prospect: Prospect) => void
}

const SOURCES: ProspectSource[] = [
  'ATS Database',
  'Previous Event',
  'Silver Medalist',
  'Employee Referral',
  'Employee Network',
  'Target Company Research',
  'LinkedIn Recruiter',
  'GitHub / Technical Community',
]

const COMPANIES = ['Palantir', 'Stripe', 'Scale AI', 'Datadog', 'Figma', 'Vercel', 'Retool', 'Anduril', 'Ramp', 'Cloudflare', 'MongoDB', 'Temporal']
const SENIORITIES = ['Mid', 'Senior', 'Staff', 'Principal']
const LOCATIONS = ['NYC', 'SF', 'Remote']

type Action = 'add' | 'maybe' | 'pass' | null

export function ProspectDiscovery({ eventId, onClose, onAdd }: Props) {
  const [phase, setPhase] = useState<'config' | 'results'>('config')
  const [searching, setSearching] = useState(false)

  const [selectedSources, setSelectedSources] = useState<ProspectSource[]>(['Target Company Research', 'LinkedIn Recruiter'])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['Palantir', 'Scale AI'])
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>(['Existing FDE', 'Solutions Engineer who codes'])
  const [selectedSeniorities, setSelectedSeniorities] = useState<string[]>(['Senior', 'Staff'])
  const [selectedLocation, setSelectedLocation] = useState('NYC')
  const [actions, setActions] = useState<Record<string, Action>>({})

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => { setSearching(false); setPhase('results') }, 1600)
  }

  const handleAction = (id: string, action: Action) => {
    setActions((prev) => ({ ...prev, [id]: action }))
    if (action === 'add') {
      const disc = discoveryResults.find((d) => d.id === id)
      if (!disc) return
      const prospect: Prospect = {
        id: `p-disc-${Date.now()}`,
        eventId,
        name: disc.name,
        company: disc.company,
        title: disc.title,
        targetRole: 'FDE',
        priority: 'A',
        seniority: disc.seniority as Prospect['seniority'],
        location: selectedLocation,
        archetype: disc.archetype,
        source: disc.source,
        relationshipType: disc.source === 'ATS Database' || disc.source === 'Silver Medalist' ? 'Warm ATS' : 'Cold',
        inviteOwner: 'Luis Avila',
        inviteChannel: disc.source === 'Employee Network' ? 'Employee Introduction' : 'Recruiter Email',
        inviteStatus: 'Not Sent',
        rsvp: null,
        note: disc.why,
      }
      onAdd(prospect)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 rounded-modal border border-border bg-surface shadow-card-hover max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <h2 className="text-body font-semibold text-text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            {phase === 'config' ? 'Find More Prospects' : 'Discovery Results'}
          </h2>
          <button onClick={onClose} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {phase === 'config' ? (
            <div className="space-y-5">
              {/* Sources */}
              <div>
                <label className="text-caption font-medium text-text-muted uppercase tracking-wide mb-2 block">Sources</label>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((s) => (
                    <button key={s} onClick={() => setSelectedSources(toggle(selectedSources, s))}
                      className={`rounded-tag border px-2.5 py-1 text-caption transition-colors ${selectedSources.includes(s) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target companies */}
              <div>
                <label className="text-caption font-medium text-text-muted uppercase tracking-wide mb-2 block">Target Companies</label>
                <div className="flex flex-wrap gap-2">
                  {COMPANIES.map((c) => (
                    <button key={c} onClick={() => setSelectedCompanies(toggle(selectedCompanies, c))}
                      className={`rounded-tag border px-2.5 py-1 text-caption transition-colors ${selectedCompanies.includes(c) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Archetypes */}
              <div>
                <label className="text-caption font-medium text-text-muted uppercase tracking-wide mb-2 block">Role Archetypes</label>
                <div className="flex flex-wrap gap-2">
                  {fdeArchetypes.map((a) => (
                    <button key={a} onClick={() => setSelectedArchetypes(toggle(selectedArchetypes, a))}
                      className={`rounded-tag border px-2.5 py-1 text-caption transition-colors ${selectedArchetypes.includes(a) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seniority + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-caption font-medium text-text-muted uppercase tracking-wide mb-2 block">Seniority</label>
                  <div className="flex flex-wrap gap-2">
                    {SENIORITIES.map((s) => (
                      <button key={s} onClick={() => setSelectedSeniorities(toggle(selectedSeniorities, s))}
                        className={`rounded-tag border px-2.5 py-1 text-caption transition-colors ${selectedSeniorities.includes(s) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-caption font-medium text-text-muted uppercase tracking-wide mb-2 block">Geography</label>
                  <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full rounded-button border border-border bg-surface-elevated px-3 py-2 text-body text-text-primary outline-none focus:border-accent">
                    {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 text-caption text-text-muted">
                <Info className="h-3 w-3" />
                AI may assist with organizing publicly available professional information. Human recruiters make all candidate decisions.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-meta text-text-secondary mb-4">
                Found {discoveryResults.length} prospects matching your criteria. Review each and choose to add, save for later, or pass.
              </p>
              {discoveryResults.map((disc) => {
                const action = actions[disc.id]
                return (
                  <div key={disc.id} className={`rounded-card border p-4 transition-colors ${
                    action === 'add' ? 'border-success/40 bg-success/5'
                    : action === 'pass' ? 'border-border bg-surface-elevated opacity-50'
                    : 'border-border bg-surface'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-body font-semibold text-text-primary">{disc.name}</span>
                          <span className="rounded-tag bg-accent/10 border border-accent/25 px-2 py-0.5 text-caption text-accent">{disc.archetype}</span>
                        </div>
                        <div className="text-meta text-text-secondary mb-2">{disc.title} · {disc.company} · {disc.seniority}</div>
                        <div className="text-meta text-text-muted">
                          <span className="font-medium text-text-secondary">Why: </span>{disc.why}
                        </div>
                        <div className="mt-1.5 text-caption text-text-muted">Source: {disc.source}</div>
                      </div>
                      {action === null || action === undefined ? (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button onClick={() => handleAction(disc.id, 'add')}
                            className="flex items-center gap-1.5 rounded-button bg-success/15 border border-success/30 px-3 py-1.5 text-caption font-medium text-success hover:bg-success/25 transition-colors">
                            <UserPlus className="h-3.5 w-3.5" /> Add
                          </button>
                          <button onClick={() => handleAction(disc.id, 'maybe')}
                            className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-caption text-text-secondary hover:bg-surface-elevated transition-colors">
                            <Minus className="h-3.5 w-3.5" /> Maybe
                          </button>
                          <button onClick={() => handleAction(disc.id, 'pass')}
                            className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-caption text-text-secondary hover:bg-surface-elevated transition-colors">
                            <X className="h-3.5 w-3.5" /> Pass
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1.5 text-caption font-medium shrink-0 ${
                          action === 'add' ? 'text-success' : action === 'maybe' ? 'text-warning' : 'text-text-muted'
                        }`}>
                          {action === 'add' ? <><Check className="h-3.5 w-3.5" /> Added</> : action === 'maybe' ? 'Saved' : 'Passed'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border px-5 py-4 shrink-0">
          {phase === 'config' ? (
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex w-full items-center justify-center gap-2 rounded-button bg-accent py-2.5 text-body font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {searching ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Discovering prospects…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Discover Prospects
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setPhase('config')}
                className="rounded-button border border-border px-4 py-2.5 text-body text-text-secondary hover:bg-surface-elevated">
                Refine Search
              </button>
              <button onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-button bg-accent py-2.5 text-body font-medium text-white hover:bg-accent-hover transition-colors">
                Done
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
