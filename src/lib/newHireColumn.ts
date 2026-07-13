import type { NewHireTracker } from '../types'

export const NEW_HIRE_COLUMNS = ['Offer Pending Signature', 'Pre-Checks In Progress', 'Pre-Checks Clear', 'Tech Setup', 'Ready to Start'] as const
export type NewHireColumn = (typeof NEW_HIRE_COLUMNS)[number]

export function columnFor(tracker: NewHireTracker): NewHireColumn {
  if (tracker.readyToStart) return 'Ready to Start'
  if (tracker.offerLetter.status !== 'complete') return 'Offer Pending Signature'
  const precheckClear = tracker.backgroundCheck.status === 'clear' && tracker.drugTest.status === 'clear'
  if (!precheckClear) return 'Pre-Checks In Progress'
  if (tracker.techSetup.status === 'not_started') return 'Pre-Checks Clear'
  return 'Tech Setup'
}
