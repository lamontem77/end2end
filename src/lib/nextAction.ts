import type { Candidate } from '../types'

export function nextActionFor(candidate: Candidate): string | null {
  switch (candidate.currentStage) {
    case 'Applied':
      return 'Advance to Screening'
    case 'Screening Scheduled':
      return 'Send availability request'
    case 'Phone Screen':
      return 'Submit phone screen scorecard'
    case 'Assessment to Send':
      return 'Send assessment'
    case 'Assessment Pending':
      return 'Awaiting candidate submission'
    case 'Assessment Review':
      return 'Review assessment results'
    case 'Round N Scheduling':
      return 'Send availability request'
    case 'Round N In Progress':
      return 'Interview in progress'
    case 'Pending Feedback':
      return 'Submit scorecard'
    case 'Debrief / Decision':
      return 'Make hiring decision'
    case 'Offer Prep':
      return 'Approve offer letter draft'
    case 'Offer Pending Approval':
      return 'Approve offer terms'
    case 'Offer Extended':
      return 'Awaiting candidate signature'
    case 'Offer Accepted':
      return 'Graduate to New Hire Tracker'
    default:
      return null
  }
}
