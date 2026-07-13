import { NavLink } from 'react-router-dom'
import { useStore } from '../../store/useStore'

export function SchedulingTabs() {
  const pending = useStore((s) => s.agentDrafts.filter((d) => d.status === 'pending').length)
  return (
    <div className="flex items-center gap-0.5 rounded-button border border-border bg-surface p-0.5 w-fit">
      <NavLink
        to="/scheduling/requests"
        className={({ isActive }) =>
          `rounded-button px-3 py-1.5 text-meta font-medium transition-colors duration-micro ${isActive ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary'}`
        }
      >
        Requests
      </NavLink>
      <NavLink
        to="/scheduling/approvals"
        className={({ isActive }) =>
          `rounded-button px-3 py-1.5 text-meta font-medium transition-colors duration-micro ${isActive ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary'}`
        }
      >
        Approvals {pending > 0 && <span className="ml-1 rounded-tag bg-accent/20 px-1 text-caption">{pending}</span>}
      </NavLink>
    </div>
  )
}
