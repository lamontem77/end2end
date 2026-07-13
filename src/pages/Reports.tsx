import { TrendingUp } from 'lucide-react'

export function Reports() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <TrendingUp className="h-10 w-10 text-text-muted" />
      <h1 className="text-subhead font-semibold text-text-primary">Pipeline Analytics</h1>
      <p className="max-w-sm text-meta text-text-secondary">
        Reports is a v2 feature — time-to-fill, stage conversion, SLA compliance, and recruiter/RC throughput dashboards land here next.
      </p>
    </div>
  )
}
