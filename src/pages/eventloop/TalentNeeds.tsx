import { useNavigate } from 'react-router-dom'
import { AlertTriangle, TrendingUp, CheckCircle2, MapPin, Building2, Users, Sparkles, ChevronRight, Target } from 'lucide-react'
import { talentNeeds } from '../../data/eventloop'
import type { TalentNeed } from '../../data/eventloop'

const priorityConfig = {
  Critical: { color: 'text-danger', bg: 'bg-danger/10 border-danger/30', dot: 'bg-danger', icon: AlertTriangle },
  High: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30', dot: 'bg-warning', icon: TrendingUp },
  Healthy: { color: 'text-success', bg: 'bg-success/10 border-success/30', dot: 'bg-success', icon: CheckCircle2 },
}

function PipelineBar({ goal, pipeline }: { goal: number; pipeline: number }) {
  const pct = Math.min((pipeline / goal) * 100, 100)
  const color = pct >= 80 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-caption text-text-secondary mb-1.5">
        <span>Qualified pipeline</span>
        <span className="font-mono">{pipeline} / {goal}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TalentCard({ need }: { need: TalentNeed }) {
  const navigate = useNavigate()
  const cfg = priorityConfig[need.priority]
  const Icon = cfg.icon
  const gap = need.hiringGoal - need.qualifiedPipeline

  return (
    <div className="rounded-card border border-border bg-surface p-5 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-label font-semibold text-text-primary truncate">{need.role}</h3>
          </div>
          <p className="text-meta text-text-secondary line-clamp-2">{need.description}</p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-tag border px-2.5 py-1 text-caption font-medium shrink-0 ${cfg.bg} ${cfg.color}`}>
          <Icon className="h-3 w-3" />
          {need.priority}
        </span>
      </div>

      <PipelineBar goal={need.hiringGoal} pipeline={need.qualifiedPipeline} />

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-button bg-surface-elevated p-2.5">
          <div className="text-caption text-text-muted mb-0.5">Hiring goal</div>
          <div className="text-label font-semibold text-text-primary">{need.hiringGoal}</div>
        </div>
        <div className="rounded-button bg-surface-elevated p-2.5">
          <div className="text-caption text-text-muted mb-0.5">Qualified</div>
          <div className="text-label font-semibold text-success">{need.qualifiedPipeline}</div>
        </div>
        <div className="rounded-button bg-surface-elevated p-2.5">
          <div className="text-caption text-text-muted mb-0.5">Gap</div>
          <div className={`text-label font-semibold ${gap > 0 ? 'text-danger' : 'text-success'}`}>
            {gap > 0 ? `−${gap}` : '0'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-caption text-text-secondary">
          <MapPin className="h-3 w-3 text-text-muted" />
          {need.locations.join(', ')}
        </div>
        <div className="text-caption text-text-muted">·</div>
        <div className="flex items-center gap-1 text-caption text-text-secondary">
          <Target className="h-3 w-3 text-text-muted" />
          {need.level}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-1 mb-2 text-caption text-text-secondary">
          <Building2 className="h-3 w-3 text-text-muted" />
          Target companies
        </div>
        <div className="flex flex-wrap gap-1.5">
          {need.targetCompanies.slice(0, 5).map((c) => (
            <span key={c} className="rounded-tag bg-surface-elevated px-2 py-0.5 text-caption text-text-secondary border border-border">
              {c}
            </span>
          ))}
          {need.targetCompanies.length > 5 && (
            <span className="text-caption text-text-muted">+{need.targetCompanies.length - 5}</span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-1 mb-2 text-caption text-text-secondary">
          <Sparkles className="h-3 w-3 text-text-muted" />
          Key traits
        </div>
        <div className="flex flex-wrap gap-1.5">
          {need.traits.map((t) => (
            <span key={t} className="rounded-tag bg-accent/10 border border-accent/20 px-2 py-0.5 text-caption text-accent">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-1 mb-2 text-caption text-text-secondary">
          <Users className="h-3 w-3 text-text-muted" />
          Talent pools
        </div>
        <div className="flex flex-wrap gap-1.5">
          {need.talentPools.map((p) => (
            <span key={p} className="rounded-tag bg-surface-elevated border border-border px-2 py-0.5 text-caption text-text-secondary">
              {p}
            </span>
          ))}
        </div>
      </div>

      {need.priority !== 'Healthy' && (
        <button
          onClick={() => navigate(`/events/new?role=${encodeURIComponent(need.id)}`)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-button bg-accent/15 border border-accent/25 px-4 py-2.5 text-body font-medium text-accent hover:bg-accent/25 transition-colors duration-micro"
        >
          <Sparkles className="h-4 w-4" />
          Plan Recruiting Event
          <ChevronRight className="h-4 w-4 ml-auto" />
        </button>
      )}
    </div>
  )
}

export function TalentNeeds() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-label font-semibold text-text-primary">Talent Needs</h1>
          <p className="text-meta text-text-secondary mt-0.5">Current hiring priorities and pipeline health</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-tag bg-danger/10 border border-danger/30 px-2.5 py-1 text-caption text-danger">
            <AlertTriangle className="h-3 w-3" />
            2 critical gaps
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 max-w-7xl">
          {talentNeeds.map((need) => (
            <TalentCard key={need.id} need={need} />
          ))}
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface p-5 max-w-7xl">
          <h3 className="text-body font-semibold text-text-primary mb-3">Pipeline Health Summary</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Total hiring goal', value: '12', sub: 'across 3 roles' },
              { label: 'Qualified pipeline', value: '9', sub: 'of 12 needed' },
              { label: 'Gap to fill', value: '6', sub: 'in critical roles', color: 'text-danger' },
              { label: 'Events planned', value: '2', sub: 'next 45 days' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-button bg-surface-elevated p-3">
                <div className="text-caption text-text-muted mb-1">{stat.label}</div>
                <div className={`text-subhead font-semibold ${stat.color ?? 'text-text-primary'}`}>{stat.value}</div>
                <div className="text-caption text-text-secondary mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
