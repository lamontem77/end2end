import type { CandidateRecord, CandidateStore } from './types.js'

// DEMO ONLY. This in-memory store exists so `npm run dev` boots and you can
// curl this server locally without a real database. It does NOT talk to the
// web app's Zustand/localStorage store, so actions taken here will not show
// up in the running frontend and vice versa.
//
// Before deploying for real: replace this with an implementation backed by
// whatever the web app's data lives in (Supabase, per the original PRD's
// tech stack — see the root README). Both the Slack bot and the web app
// must read/write the same database, or a recruiter scheduling something
// via Slack won't show up in their My Queue on the web, which defeats the
// entire point of this feature.
const candidates: CandidateRecord[] = [
  {
    id: 'c-jordan',
    name: 'Jordan Rivera',
    role: 'Software Engineer II',
    currentStage: 'Pending Feedback',
    assigneeName: 'Devon K.',
    slaLabel: '24h left',
    latestInterviewerId: 'u-devon',
    latestInterviewerName: 'Devon K.',
  },
  {
    id: 'c-taylor',
    name: 'Taylor Kim',
    role: 'Product Manager',
    currentStage: 'Screening Scheduled',
    assigneeName: 'Alex T.',
    slaLabel: '24h left',
  },
]

export const demoStore: CandidateStore = {
  async listCandidates() {
    return candidates
  },
  async requestScheduling(candidateId, mode) {
    console.log(`[demoStore] would draft ${mode} scheduling request for ${candidateId}`)
  },
  async requestAssessmentSend(candidateId) {
    console.log(`[demoStore] would draft assessment-send for ${candidateId}`)
  },
  async nudgeInterviewer(candidateId) {
    console.log(`[demoStore] would draft interviewer nudge for ${candidateId}`)
  },
}
