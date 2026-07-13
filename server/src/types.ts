// Minimal shape the intent parser and Slack handler need. This is a subset
// of the richer `Candidate` type in the web app (../../src/types/index.ts) —
// keep the two in sync by hand until this backend and the frontend share a
// real database and can import one definition.
export interface CandidateRecord {
  id: string
  name: string
  role: string
  currentStage: string
  assigneeName: string
  slaLabel: string
  latestInterviewerId?: string
  latestInterviewerName?: string
}

export type ScheduleMode = 'manual' | 'self_schedule'

// Contract a real backend must implement. The frontend's Zustand store
// (../../src/store/useStore.ts) has the reference implementation of what
// each of these actions does to a candidate's ticket — requestScheduling
// drafts an availability-request or self-schedule email and drops it in
// the RC's Approvals Queue, createAssessmentDraft/nudgeInterviewer do the
// same for their respective agent actions. NONE of these should ever send
// anything to a candidate directly — they only create a pending draft for
// a human to approve, same as the in-app "New Candidate" / stage-move flows.
export interface CandidateStore {
  listCandidates(): Promise<CandidateRecord[]>
  requestScheduling(candidateId: string, mode: ScheduleMode): Promise<void>
  requestAssessmentSend(candidateId: string): Promise<void>
  nudgeInterviewer(candidateId: string): Promise<void>
}
