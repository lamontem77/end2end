import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Target, TrendingUp, Plus, ChevronRight, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { allEvents } from '../../data/eventloop'
import type { RecruitingEvent } from '../../data/eventloop'

const statusConfig = {
  live: { label: 'Live Now', color: 'text-success', bg: 'bg-success/10 border-success/30', dot: 'bg-success animate-pulse-live' },
  planned: { label: 'Planned', color: 'text-accent', bg: 'bg-accent/10 border-accent/25', dot: 'bg-accent' },
  completed: { label: 'Completed', color: 'text-text-secondary', bg: 'bg-surface-elevated border-border', dot: 'bg-text-muted' },
  draft: { label: 'Draft', color: 'text-text-muted', bg: 'bg-surface-elevated border-border', dot: 'bg-text-muted' },
}

function EventCard({ event }: { event: RecruitingEvent }) {
  const navigate = useNavigate()
  const cfg = statusConfig[event.status]
  const isLive = event.status === 'live'
  const hasActuals = event.actualAttended > 0

  return (
    <button
      onClick={() => navigate(`/events/${event.id}`)}
      className="w-full text-left rounded-card border border-border bg-surface p-5 hover:border-accent/40 hover:bg-surface-elevated transition-colors duration-micro group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-label font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{event.name}</h3>
            {isLive && <span className="h-2 w-2 rounded-full bg-success animate-pulse-live shrink-0" />}
          </div>
          <p className="text-meta text-text-secondary line-clamp-1">{event.objective}</p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-tag border px-2.5 py-1 text-caption font-medium shrink-0 ${cfg.bg} ${cfg.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta text-text-secondary mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-text-muted" />
          {event.date}
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-text-muted" />
          {event.location}
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-text-muted" />
          {event.targetRole}
        </div>
      </div>

      {hasActuals ? (
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Invited', value: event.actualInvited },
            { label: 'RSVP', value: event.actualRsvp },
            { label: 'Attended', value: event.actualAttended },
            { label: 'Qualified', value: event.actualQualified, highlight: true },
            { label: 'Process', value: event.actualProcessEntries, highlight: true },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-subhead font-semibold ${stat.highlight ? 'text-accent' : 'text-text-primary'}`}>{stat.value}</div>
              <div className="text-caption text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Forecast invited', value: event.forecastInvited },
            { label: 'Forecast RSVP', value: event.forecastRsvp },
            { label: 'Forecast attend', value: event.forecastAttended },
            { label: 'Forecast qual.', value: event.forecastQualified, highlight: true },
            { label: 'Forecast proc.', value: event.forecastProcessEntries, highlight: true },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-subhead font-semibold ${stat.highlight ? 'text-accent/70' : 'text-text-secondary'}`}>{stat.value}</div>
              <div className="text-caption text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-caption text-text-muted">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.format}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {event.targetLevel}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
      </div>
    </button>
  )
}

export function Events() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-label font-semibold text-text-primary">Events</h1>
          <p className="text-meta text-text-secondary mt-0.5">Plan, run, and measure recruiting events</p>
        </div>
        <button
          onClick={() => navigate('/events/new')}
          className="flex items-center gap-2 rounded-button bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent-hover transition-colors duration-micro"
        >
          <Plus className="h-4 w-4" />
          Plan Event
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 max-w-5xl">
          {[
            { label: 'Active events', value: '1', icon: Zap, color: 'text-success' },
            { label: 'Planned', value: '1', icon: Clock, color: 'text-accent' },
            { label: 'Completed (90d)', value: '3', icon: CheckCircle2, color: 'text-text-secondary' },
            { label: 'Hires generated', value: '3', icon: TrendingUp, color: 'text-text-primary' },
          ].map((s) => (
            <div key={s.label} className="rounded-card border border-border bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-caption text-text-secondary">{s.label}</span>
              </div>
              <div className={`text-subhead font-semibold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Live events */}
        {allEvents.filter((e) => e.status === 'live').length > 0 && (
          <div className="mb-6 max-w-5xl">
            <h2 className="text-body font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-live" />
              Happening Now
            </h2>
            <div className="grid gap-4">
              {allEvents.filter((e) => e.status === 'live').map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {allEvents.filter((e) => e.status === 'planned' || e.status === 'draft').length > 0 && (
          <div className="mb-6 max-w-5xl">
            <h2 className="text-body font-semibold text-text-secondary mb-3">Upcoming</h2>
            <div className="grid gap-4">
              {allEvents.filter((e) => e.status === 'planned' || e.status === 'draft').map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {/* Completed */}
        {allEvents.filter((e) => e.status === 'completed').length > 0 && (
          <div className="max-w-5xl">
            <h2 className="text-body font-semibold text-text-secondary mb-3">Completed</h2>
            <div className="grid gap-4">
              {allEvents.filter((e) => e.status === 'completed').map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
