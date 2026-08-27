import { useNavigate } from 'react-router-dom'
import { AlertTriangle, TrendingUp, CheckCircle2, MapPin, Target, Sparkles, ChevronRight } from 'lucide-react'
import { talentNeeds } from '../../data/eventloop'
import type { TalentNeed } from '../../data/eventloop'

const priorityConfig = {
  Critical: { color: 'text-danger', border: 'border-danger/25', dot: 'bg-danger', icon: AlertTriangle, tag: 'bg-danger/10 text-danger border-danger/25' },
  High: { color: 'text-warning', border: 'border-warning/25', dot: 'bg-warning', icon: TrendingUp, tag: 'bg-warning/10 text-warning border-warning/25' },
  Healthy: { color: 'text-success', border: 'border-success/20', dot: 'bg-success', icon: CheckCircle2, tag: 'bg-success/10 text-success border-success/20' },
}

function TalentCard({ need }: { need: TalentNeed }) {
  const navigate = useNavigate()
  const cfg = priorityConfig[need.priority]
  const Icon = cfg.icon
  const gap = need.hiringGoal - need.qualifiedPipeline
  const pct = Math.min((need.qualifiedPipeline / need.hiringGoal) * 100, 100)
  const barColor = pct >= 80 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-danger'

  return (
    <div className="rounded-card border border-border bg-surface p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-body font-semibold text-text-primary leading-snug">{need.role}</h3>
        <span className={`flex items-center gap-1.5 rounded-tag border px-2.5 py-1 text-caption font-medium shrink-0 ${cfg.tag}`}>
          <Icon className="h-3 w-3" />
          {need.priority}
        </span>
      </div>

      {/* Pipeline */}
      <div>
        <div className="flex items-center justify-between text-caption text-text-secondary mb-2">
          <span>{need.qualifiedPipeline} qualified</span>
          <span className={gap > 0 ? 'text-danger font-medium' : 'text-success font-medium'}>
            {gap > 0 ? `Gap: −${gap}` : 'On track'}
          </span>
        </div>
        <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 text-caption text-text-muted">{need.qualifiedPipeline} of {need.hiringGoal} needed</div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-caption text-text-secondary">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-text-muted" />
          {need.locations.join(', ')}
        </span>
        <span className="text-text-muted">·</span>
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3 text-text-muted" />
          {need.level}
        </span>
      </div>

      {/* CTA */}
      {need.priority !== 'Healthy' && (
        <button
          onClick={() => navigate(`/events/new?role=${encodeURIComponent(need.id)}`)}
          className="mt-auto flex items-center justify-between gap-2 rounded-button border border-accent/25 bg-accent/10 px-4 py-2.5 text-body font-medium text-accent hover:bg-accent/20 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Plan Recruiting Event
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function TalentNeeds() {
  const critical = talentNeeds.filter((n) => n.priority === 'Critical').length
  const totalGoal = talentNeeds.reduce((s, n) => s + n.hiringGoal, 0)
  const totalPipeline = talentNeeds.reduce((s, n) => s + n.qualifiedPipeline, 0)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <div>
          <h1 className="text-label font-semibold text-text-primary">Talent Needs</h1>
          <p className="text-meta text-text-secondary mt-0.5">{totalPipeline} of {totalGoal} qualified · {critical} critical {critical === 1 ? 'gap' : 'gaps'}</p>
        </div>
        {critical > 0 && (
          <div className="flex items-center gap-1.5 rounded-tag bg-danger/10 border border-danger/25 px-2.5 py-1 text-caption text-danger">
            <AlertTriangle className="h-3 w-3" />
            {critical} critical
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 max-w-3xl lg:grid-cols-2 xl:grid-cols-3 xl:max-w-5xl">
          {talentNeeds.map((need) => (
            <TalentCard key={need.id} need={need} />
          ))}
        </div>
      </div>
    </div>
  )
}
