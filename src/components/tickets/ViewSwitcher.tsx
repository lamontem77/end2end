import { NavLink } from 'react-router-dom'

const VIEWS = [
  { to: '/tickets/board', label: 'Board' },
  { to: '/tickets/list', label: 'List' },
  { to: '/tickets/queue', label: 'My Queue' },
  { to: '/tickets/at-risk', label: 'At Risk' },
]

export function ViewSwitcher() {
  return (
    <div className="flex items-center gap-0.5 rounded-button border border-border bg-surface p-0.5">
      {VIEWS.map((v) => (
        <NavLink
          key={v.to}
          to={v.to}
          className={({ isActive }) =>
            `rounded-button px-3 py-1.5 text-meta font-medium transition-colors duration-micro ${
              isActive ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
          {v.label}
        </NavLink>
      ))}
    </div>
  )
}
