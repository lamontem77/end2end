import type { Candidate, NewHireTracker, User } from '../types'
import { statusLine } from './statusLine'

function csvCell(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(cells: (string | null | undefined)[]): string {
  return cells.map(csvCell).join(',')
}

const HEADERS = [
  'candidate_id',
  'name',
  'role',
  'department',
  'source',
  'priority',
  'current_stage',
  'current_substatus',
  'last_completed',
  'current_position',
  'next_action',
  'next_owner',
  'next_due',
  'composed_status_line',
  'recruiter_id',
  'rc_id',
  'hiring_manager_id',
  'created_at',
  'updated_at',
]

export function buildCsvExport(candidates: Candidate[], users: User[], trackers: Record<string, NewHireTracker>): string {
  const rows = [HEADERS.join(',')]

  for (const c of candidates) {
    if (c.tags.includes('Rejected')) continue
    const tracker = trackers[c.id]
    const sl = statusLine(c, users, tracker)

    // Active round sub-status (if in a round stage)
    const activeRound = c.interviewRounds.find((r) => !r.roundCompletedAt) ?? c.interviewRounds[c.interviewRounds.length - 1]
    const subStatus = activeRound?.subStatus ?? null

    rows.push(
      csvRow([
        c.id,
        c.name,
        c.role,
        c.department,
        c.source,
        c.priority,
        c.currentStage,
        subStatus,
        sl.lastCompleted,
        sl.currentPosition,
        sl.nextAction,
        sl.nextOwnerName,
        sl.nextDue,
        sl.text,
        c.recruiterId,
        c.rcId,
        c.hiringManagerId,
        c.createdAt,
        c.updatedAt,
      ]),
    )
  }

  return rows.join('\n')
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
