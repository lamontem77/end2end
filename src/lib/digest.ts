import { differenceInCalendarDays, formatDistanceToNow } from 'date-fns'
import type { Candidate, NewHireTracker } from '../types'

export interface DigestData {
  hmName: string
  pipeline: { candidate: Candidate; note: string }[]
  newHiresSoon: { candidate: Candidate; tracker: NewHireTracker }[]
  actionNeeded: string[]
}

const CHECK: Record<string, string> = { clear: '✅ Clear', complete: '✅ Complete', pending: '⏳ Pending', in_progress: '⏳ In Progress', not_started: '🔲 Not Started', flagged: '⚠️ Flagged', failed: '❌ Failed' }

export function buildDigest(hmId: string, hmName: string, candidates: Candidate[], trackers: Record<string, NewHireTracker>): DigestData {
  const mine = candidates.filter((c) => c.hiringManagerId === hmId && !c.tags.includes('Rejected'))

  const pipeline = mine
    .filter((c) => !trackers[c.id])
    .map((c) => {
      let note: string = c.currentStage
      if (c.currentStage === 'Pending Feedback' || c.currentStage === 'Debrief / Decision') {
        note = `Pending your feedback · ${formatDistanceToNow(new Date(c.stageEnteredAt))} waiting`
      } else if (c.currentStage === 'Offer Extended') {
        note = 'Offer extended · awaiting candidate response'
      } else if (c.currentStage.includes('Scheduling')) {
        note = `${c.currentStage} in progress`
      } else if (c.interviewRounds.length > 0 && c.currentStage === 'Round N In Progress') {
        note = `Interview scheduled`
      }
      return { candidate: c, note }
    })

  const newHiresSoon = Object.entries(trackers)
    .map(([id, t]) => ({ candidate: candidates.find((c) => c.id === id)!, tracker: t }))
    .filter((e) => e.candidate?.hiringManagerId === hmId && differenceInCalendarDays(new Date(e.tracker.startDate), new Date()) <= 45)

  const actionNeeded: string[] = []
  mine.forEach((c) => {
    if (c.currentStage === 'Debrief / Decision') actionNeeded.push(`Submit hiring decision — ${c.name}`)
    if (c.currentStage === 'Offer Pending Approval') actionNeeded.push(`Approve offer terms — ${c.name}`)
  })

  return { hmName, pipeline, newHiresSoon, actionNeeded }
}

export { CHECK }
