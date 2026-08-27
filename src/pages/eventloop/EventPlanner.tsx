import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Target, Sparkles, Users, TrendingUp, CheckCircle2,
  BarChart3, AlertCircle, Building2, MapPin, Zap, Info, PenLine,
} from 'lucide-react'
import { talentNeeds, eventFormatOptions, nextEventRecommendation } from '../../data/eventloop'

const OBJECTIVES = [
  { id: 'source', label: 'Source new talent', icon: Sparkles },
  { id: 'nurture', label: 'Nurture relationships', icon: Users },
  { id: 'brand', label: 'Employer brand', icon: TrendingUp },
  { id: 'convert', label: 'Convert existing prospects', icon: Target },
  { id: 'close', label: 'Close candidates', icon: CheckCircle2 },
]

const STEPS = ['Talent Need', 'Objective', 'Format', 'Forecast', 'Confirm']

const RECOMMENDATIONS = [
  {
    id: 'rec-dinner',
    name: 'AI Builders Dinner — FDE',
    format: 'Curated Dinner · 20–25 people',
    why: 'Curated dinners have the highest qualified-pipeline yield in your historical data. Founder presence drives high RSVP from Staff+ candidates.',
    targetRole: 'Field Deployment Engineer',
    targetLevel: 'Senior / Staff',
    inviteVolume: 54,
    day: 'Thursday',
    time: '7:00 PM',
    forecast: { rsvp: 29, attended: 23, qualified: 5, entries: '2–3' },
    tag: 'Top pick',
    tagColor: 'bg-accent/15 text-accent border-accent/25',
  },
  {
    id: 'rec-roundtable',
    name: nextEventRecommendation.name,
    format: `${nextEventRecommendation.format} · ${nextEventRecommendation.capacity} people`,
    why: nextEventRecommendation.reason,
    targetRole: nextEventRecommendation.targetRole,
    targetLevel: nextEventRecommendation.targetLevel,
    inviteVolume: nextEventRecommendation.inviteVolume,
    day: nextEventRecommendation.suggestedDay,
    time: nextEventRecommendation.suggestedTime,
    forecast: {
      rsvp: nextEventRecommendation.forecast.rsvp,
      attended: nextEventRecommendation.forecast.attended,
      qualified: nextEventRecommendation.forecast.qualified,
      entries: `${nextEventRecommendation.forecast.processEntries.min}–${nextEventRecommendation.forecast.processEntries.max}`,
    },
    tag: 'Alternative',
    tagColor: 'bg-surface-elevated text-text-secondary border-border',
  },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-button text-caption font-medium transition-colors ${
            i === current ? 'bg-accent/15 text-accent'
            : i < current ? 'text-success' : 'text-text-muted'
          }`}>
            {i < current ? <CheckCircle2 className="h-3.5 w-3.5" /> : (
              <span className="flex h-4 w-4 items-center justify-center rounded-full border text-caption" style={{ borderColor: i === current ? 'currentColor' : undefined }}>
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < total - 1 && <ChevronRight className="h-3.5 w-3.5 text-text-muted" />}
        </div>
      ))}
    </div>
  )
}

function ConversionRow({ from, to, rate }: { from: string; to: string; rate: string }) {
  return (
    <div className="flex items-center gap-2 text-meta text-text-secondary">
      <span className="w-28 text-right">{from}</span>
      <span className="text-text-muted">→</span>
      <span className="w-28">{to}</span>
      <div className="flex-1 mx-2 h-1 bg-surface-elevated rounded-full overflow-hidden">
        <div className="h-full bg-accent/50 rounded-full" style={{ width: rate }} />
      </div>
      <span className="w-10 text-right text-text-primary font-mono text-caption">{rate}</span>
    </div>
  )
}

type Mode = 'choose' | 'from-rec' | 'scratch'

export function EventPlanner() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const roleParam = params.get('role') ?? ''

  const defaultNeed = talentNeeds.find((n) => n.id === roleParam) ?? talentNeeds[0]
  const [mode, setMode] = useState<Mode>('choose')
  const [selectedRec, setSelectedRec] = useState(RECOMMENDATIONS[0])

  // Scratch wizard state
  const [step, setStep] = useState(0)
  const [selectedNeed, setSelectedNeed] = useState(defaultNeed)
  const [objective, setObjective] = useState('source')
  const [selectedFormat, setSelectedFormat] = useState(eventFormatOptions[0])
  const [inviteTarget, setInviteTarget] = useState(54)

  const convRate = { rsvp: 0.54, attend: 0.79, target: 0.83, qualify: 0.26 }
  const rsvp = Math.round(inviteTarget * convRate.rsvp)
  const attended = Math.round(rsvp * convRate.attend)
  const targetTalent = Math.round(attended * convRate.target)
  const qualified = Math.round(targetTalent * convRate.qualify)
  const process = Math.round(qualified * 0.4)

  const handleBack = () => {
    if (mode === 'choose') navigate('/events')
    else if (mode === 'from-rec') setMode('choose')
    else if (step === 0) setMode('choose')
    else setStep(step - 1)
  }

  // ─── Landing: Choose ─────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-6 py-4 shrink-0">
          <button onClick={() => navigate('/events')} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-label font-semibold text-text-primary">Plan a Recruiting Event</h1>
            <p className="text-meta text-text-secondary">Start from a recommendation or build from scratch</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">

            <div>
              <p className="text-caption text-text-muted mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Recommended based on your historical data
              </p>
              <div className="space-y-3">
                {RECOMMENDATIONS.map((rec) => (
                  <div key={rec.id} className="rounded-card border border-border bg-surface p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-body font-semibold text-text-primary">{rec.name}</h3>
                          <span className={`rounded-tag border px-2 py-0.5 text-caption ${rec.tagColor}`}>{rec.tag}</span>
                        </div>
                        <div className="text-caption text-text-muted">{rec.format} · {rec.day} {rec.time}</div>
                      </div>
                    </div>
                    <p className="text-meta text-text-secondary mb-4 leading-relaxed">{rec.why}</p>
                    <div className="flex items-center gap-6 mb-4 text-caption text-text-secondary">
                      <div><span className="text-text-muted">Role</span> · {rec.targetRole}</div>
                      <div><span className="text-text-muted">Level</span> · {rec.targetLevel}</div>
                      <div><span className="text-text-muted">Invites</span> · {rec.inviteVolume}</div>
                    </div>
                    <div className="flex items-center gap-6 border-t border-border pt-4 mb-4">
                      {[
                        { label: 'RSVP', v: rec.forecast.rsvp },
                        { label: 'Attend', v: rec.forecast.attended },
                        { label: 'Qualified', v: rec.forecast.qualified, accent: true },
                        { label: 'Process', v: rec.forecast.entries, accent: true },
                      ].map(({ label, v, accent }) => (
                        <div key={label}>
                          <div className={`text-subhead font-semibold ${accent ? 'text-accent' : 'text-text-primary'}`}>{v}</div>
                          <div className="text-caption text-text-muted">{label}</div>
                        </div>
                      ))}
                      <span className="text-caption text-text-muted ml-auto">Illustrative · demo data</span>
                    </div>
                    <button
                      onClick={() => { setSelectedRec(rec); setMode('from-rec') }}
                      className="flex w-full items-center justify-center gap-2 rounded-button bg-accent py-2.5 text-body font-medium text-white hover:bg-accent-hover transition-colors"
                    >
                      Use this plan
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-caption text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={() => setMode('scratch')}
              className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-5 hover:border-accent/40 hover:bg-surface-elevated transition-colors text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-surface-elevated text-text-secondary">
                <PenLine className="h-5 w-5" />
              </div>
              <div>
                <div className="text-body font-semibold text-text-primary mb-0.5">Start from scratch</div>
                <div className="text-meta text-text-secondary">Choose talent need, objective, format, and set your own targets</div>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted ml-auto" />
            </button>

          </div>
        </div>
      </div>
    )
  }

  // ─── From Recommendation: single review page ──────────────────────────────────
  if (mode === 'from-rec') {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-6 py-4 shrink-0">
          <button onClick={handleBack} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-label font-semibold text-text-primary">{selectedRec.name}</h1>
            <p className="text-meta text-text-secondary">Review and confirm</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">

            <div className="rounded-card border border-border bg-surface p-5 space-y-3">
              {[
                { label: 'Format', value: selectedRec.format },
                { label: 'Target role', value: selectedRec.targetRole },
                { label: 'Target level', value: selectedRec.targetLevel },
                { label: 'Suggested day', value: `${selectedRec.day} · ${selectedRec.time}` },
                { label: 'Invite volume', value: selectedRec.inviteVolume.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-meta text-text-secondary">{label}</span>
                  <span className="text-meta text-text-primary font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-card border border-border bg-surface p-5">
              <h3 className="text-body font-semibold text-text-primary mb-4">Illustrative Forecast</h3>
              <div className="flex items-center gap-8">
                {[
                  { label: 'RSVP', v: selectedRec.forecast.rsvp },
                  { label: 'Attend', v: selectedRec.forecast.attended },
                  { label: 'Qualified', v: selectedRec.forecast.qualified, accent: true },
                  { label: 'Process', v: selectedRec.forecast.entries, accent: true },
                ].map(({ label, v, accent }) => (
                  <div key={label}>
                    <div className={`text-subhead font-semibold ${accent ? 'text-success' : 'text-text-primary'}`}>{v}</div>
                    <div className="text-caption text-text-muted">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1 text-caption text-text-muted">
                <AlertCircle className="h-3 w-3" />
                Illustrative forecast based on demo historical data
              </div>
            </div>

            <button
              onClick={() => navigate('/events/evt-001')}
              className="w-full rounded-button bg-accent py-3 text-body font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Create Event →
            </button>

          </div>
        </div>
      </div>
    )
  }

  // ─── Scratch wizard ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-4 border-b border-border px-6 py-4 shrink-0">
        <button onClick={handleBack} className="rounded-button p-1.5 text-text-secondary hover:bg-surface-elevated">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-label font-semibold text-text-primary">Plan from Scratch</h1>
          <p className="text-meta text-text-secondary">Start with talent need, not event type</p>
        </div>
        <StepIndicator current={step} total={STEPS.length} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">

          {/* Step 0: Talent Need */}
          {step === 0 && (
            <div>
              <h2 className="text-subhead font-semibold text-text-primary mb-1">What talent do you need to attract?</h2>
              <p className="text-meta text-text-secondary mb-6">Select a hiring priority to build the event around.</p>
              <div className="grid gap-3">
                {talentNeeds.map((need) => (
                  <button
                    key={need.id}
                    onClick={() => setSelectedNeed(need)}
                    className={`w-full text-left rounded-card border p-4 transition-colors ${
                      selectedNeed.id === need.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-surface hover:border-border/60 hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-body font-semibold text-text-primary mb-0.5">{need.role}</div>
                        <div className="text-meta text-text-secondary">{need.description}</div>
                        <div className="mt-2 flex items-center gap-3 text-caption text-text-muted">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{need.locations.join(', ')}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Target className="h-3 w-3" />{need.level}</span>
                          <span>·</span>
                          <span>Gap: {need.hiringGoal - need.qualifiedPipeline}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-tag px-2 py-0.5 text-caption font-medium ${
                        need.priority === 'Critical' ? 'bg-danger/10 text-danger border border-danger/30'
                        : need.priority === 'High' ? 'bg-warning/10 text-warning border border-warning/30'
                        : 'bg-success/10 text-success border border-success/30'
                      }`}>{need.priority}</span>
                    </div>
                    {selectedNeed.id === need.id && (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-caption text-text-muted mb-2 flex items-center gap-1"><Building2 className="h-3 w-3" />Target companies</div>
                          <div className="flex flex-wrap gap-1">
                            {need.targetCompanies.map((c) => (
                              <span key={c} className="rounded-tag bg-surface-elevated border border-border px-1.5 py-0.5 text-caption text-text-secondary">{c}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-caption text-text-muted mb-2 flex items-center gap-1"><Zap className="h-3 w-3" />Key traits</div>
                          <div className="flex flex-wrap gap-1">
                            {need.traits.slice(0, 4).map((t) => (
                              <span key={t} className="rounded-tag bg-surface-elevated border border-border px-1.5 py-0.5 text-caption text-text-secondary">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Objective */}
          {step === 1 && (
            <div>
              <h2 className="text-subhead font-semibold text-text-primary mb-1">What is the event objective?</h2>
              <p className="text-meta text-text-secondary mb-6">For <strong className="text-text-primary">{selectedNeed.role}</strong> — how should this event move the pipeline?</p>
              <div className="grid gap-3">
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => setObjective(obj.id)}
                    className={`w-full text-left flex items-center gap-3 rounded-card border p-4 transition-colors ${
                      objective === obj.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-surface hover:bg-surface-elevated'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-button ${objective === obj.id ? 'bg-accent/20 text-accent' : 'bg-surface-elevated text-text-secondary'}`}>
                      <obj.icon className="h-4 w-4" />
                    </div>
                    <div className="text-body font-medium text-text-primary">{obj.label}</div>
                    {objective === obj.id && <CheckCircle2 className="h-4 w-4 text-accent ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Format */}
          {step === 2 && (
            <div>
              <h2 className="text-subhead font-semibold text-text-primary mb-1">Choose an event format</h2>
              <p className="text-meta text-text-secondary mb-5">For <strong className="text-text-primary">{selectedNeed.role}</strong></p>
              <div className="grid gap-4">
                {eventFormatOptions.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`w-full text-left rounded-card border p-5 transition-colors ${
                      selectedFormat.id === fmt.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-surface hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-body font-semibold text-text-primary">{fmt.name}</span>
                          {fmt.tag && <span className="rounded-tag bg-accent/15 border border-accent/25 px-2 py-0.5 text-caption text-accent">{fmt.tag}</span>}
                        </div>
                        <div className="text-meta text-text-secondary">{fmt.description}</div>
                      </div>
                      {selectedFormat.id === fmt.id && <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-meta text-text-secondary mb-3">{fmt.why}</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-caption text-success font-medium mb-1">Strengths</div>
                        <ul className="space-y-0.5">
                          {fmt.strengths.map((s) => (
                            <li key={s} className="text-caption text-text-secondary flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-caption text-warning font-medium mb-1">Considerations</div>
                        <ul className="space-y-0.5">
                          {fmt.downsides.map((d) => (
                            <li key={d} className="text-caption text-text-secondary flex items-start gap-1.5">
                              <AlertCircle className="h-3 w-3 text-warning mt-0.5 shrink-0" />{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-3 border-t border-border text-caption text-text-muted">
                      {[
                        { label: 'Invited', val: fmt.forecast.invited },
                        { label: 'RSVP', val: fmt.forecast.rsvp },
                        { label: 'Attend', val: fmt.forecast.attended },
                        { label: 'Qualified', val: fmt.forecast.qualified },
                        { label: 'Process', val: fmt.forecast.entries },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className="text-body font-semibold text-text-primary">{s.val}</div>
                          <div>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Forecast */}
          {step === 3 && (
            <div>
              <h2 className="text-subhead font-semibold text-text-primary mb-1">Event Forecast</h2>
              <p className="text-meta text-text-secondary mb-5">{selectedFormat.name} · {selectedNeed.role}</p>

              <div className="rounded-card border border-border bg-surface p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-body font-medium text-text-primary">Invite volume</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setInviteTarget(Math.max(10, inviteTarget - 5))} className="rounded-button border border-border px-2 py-1 text-body text-text-secondary hover:bg-surface-elevated">−</button>
                    <span className="w-12 text-center text-label font-semibold text-text-primary">{inviteTarget}</span>
                    <button onClick={() => setInviteTarget(Math.min(200, inviteTarget + 5))} className="rounded-button border border-border px-2 py-1 text-body text-text-secondary hover:bg-surface-elevated">+</button>
                  </div>
                </div>
                <input type="range" min={20} max={200} value={inviteTarget}
                  onChange={(e) => setInviteTarget(Number(e.target.value))}
                  className="w-full accent-[#6C63FF]" />
              </div>

              <div className="rounded-card border border-border bg-surface p-5 mb-4">
                <h3 className="text-body font-semibold text-text-primary mb-4">Projected Funnel</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Invitations sent', value: inviteTarget, color: 'bg-text-secondary' },
                    { label: 'Expected RSVP', value: rsvp, color: 'bg-accent' },
                    { label: 'Expected attendance', value: attended, color: 'bg-accent' },
                    { label: 'Target-talent attendees', value: targetTalent, color: 'bg-success' },
                    { label: 'Expected qualified', value: qualified, color: 'bg-success', highlight: true },
                    { label: 'Expected process entries', value: process, color: 'bg-success', highlight: true },
                  ].map((row, i, arr) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-meta text-text-secondary">{row.label}</span>
                        <span className={`text-body font-semibold ${row.highlight ? 'text-success' : 'text-text-primary'}`}>{row.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}/70`} style={{ width: `${(row.value / inviteTarget) * 100}%` }} />
                      </div>
                      {i < arr.length - 1 && (
                        <div className="text-right text-caption text-text-muted mt-1">
                          ↓ {Math.round((arr[i + 1].value / row.value) * 100)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border bg-surface p-5">
                <h3 className="text-body font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-text-muted" />
                  Assumed conversion rates
                </h3>
                <div className="space-y-2">
                  <ConversionRow from="Invite" to="RSVP" rate="54%" />
                  <ConversionRow from="RSVP" to="Attend" rate="79%" />
                  <ConversionRow from="Attend" to="Target Talent" rate="83%" />
                  <ConversionRow from="Target Talent" to="Qualified" rate="26%" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-caption text-text-muted">
                <Info className="h-3 w-3" />
                Illustrative forecast based on demo historical data
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <h2 className="text-subhead font-semibold text-text-primary mb-1">Confirm Event</h2>
              <p className="text-meta text-text-secondary mb-6">Review before creating.</p>
              <div className="rounded-card border border-border bg-surface p-5 mb-4 space-y-0">
                {[
                  { label: 'Format', value: selectedFormat.name },
                  { label: 'Target role', value: selectedNeed.role },
                  { label: 'Objective', value: OBJECTIVES.find((o) => o.id === objective)?.label ?? '' },
                  { label: 'Invite volume', value: inviteTarget.toString() },
                  { label: 'Forecast qualified', value: `${qualified} prospects` },
                  { label: 'Forecast process entries', value: `${process} candidates` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <span className="text-meta text-text-secondary">{label}</span>
                    <span className="text-meta text-text-primary font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/events/evt-001')}
                className="w-full rounded-button bg-accent py-3 text-body font-semibold text-white hover:bg-accent-hover transition-colors"
              >
                Create Event →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-button border border-border px-4 py-2 text-body text-text-secondary hover:bg-surface-elevated transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 0 ? 'Back' : 'Back'}
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 rounded-button bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
