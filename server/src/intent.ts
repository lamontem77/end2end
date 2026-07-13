import type { CandidateRecord, ScheduleMode } from './types.js'

// Ported from ../../src/lib/botIntent.ts (the in-app assistant uses the
// same logic against the Zustand store). Keep the two in sync by hand
// until this backend and the frontend share one package. If you swap this
// for a real Claude tool-use call, keep the same ParsedIntent shape so
// index.ts doesn't need to change.

export type ParsedIntent =
  | { type: 'schedule'; candidate: CandidateRecord; mode: ScheduleMode }
  | { type: 'send_assessment'; candidate: CandidateRecord }
  | { type: 'nudge_interviewer'; candidate: CandidateRecord }
  | { type: 'status'; candidate: CandidateRecord }
  | { type: 'ambiguous'; matches: CandidateRecord[]; raw: string }
  | { type: 'not_found'; raw: string }
  | { type: 'unrecognized'; raw: string }

const SELF_SCHEDULE_HINTS = ['self schedule', 'self-schedule', 'selfschedule', 'let them pick', 'let her pick', 'let him pick']
const SCHEDULE_KEYWORDS = ['schedule', 'set up an interview', 'set up a call', 'book an interview', 'book a call', 'arrange an interview']
const ASSESSMENT_KEYWORDS = ['assessment', 'take-home', 'take home', 'hackerrank']
const NUDGE_KEYWORDS = ['nudge', 'remind', 'chase', 'ping', 'follow up with', 'follow-up with']
const STATUS_KEYWORDS = ['status', "what's the status", 'where is', "where's", 'update on', 'how is', 'how far', 'stage of']

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function findCandidateMatches(raw: string, candidates: CandidateRecord[]): CandidateRecord[] {
  const needle = normalize(raw)
  if (!needle) return []
  const exact = candidates.filter((c) => normalize(c.name) === needle)
  if (exact.length) return exact
  return candidates.filter((c) => {
    const name = normalize(c.name)
    return needle.includes(name) || name.includes(needle) || name.split(' ').some((part) => needle.includes(part) && part.length > 2)
  })
}

function extractNamePhrase(text: string): string {
  const markers = [' with ', ' for ', ' on ', ' of ', ' regarding ']
  let best = ''
  for (const marker of markers) {
    const idx = text.toLowerCase().lastIndexOf(marker)
    if (idx !== -1) {
      const candidate = text.slice(idx + marker.length).trim()
      if (candidate.length > best.length) best = candidate
    }
  }
  return best || text
}

function stripPunctuation(text: string) {
  return text.replace(/[?.!,]+$/g, '').trim()
}

export function parseIntent(rawText: string, candidates: CandidateRecord[]): ParsedIntent {
  const text = stripPunctuation(rawText)
  const lower = normalize(text)

  const isStatus = STATUS_KEYWORDS.some((k) => lower.includes(k))
  const isNudge = !isStatus && NUDGE_KEYWORDS.some((k) => lower.includes(k))
  const isAssessment = !isStatus && !isNudge && ASSESSMENT_KEYWORDS.some((k) => lower.includes(k))
  const isSchedule = !isStatus && !isNudge && !isAssessment && SCHEDULE_KEYWORDS.some((k) => lower.includes(k))
  const isSelfSchedule = SELF_SCHEDULE_HINTS.some((k) => lower.includes(k))

  if (!isStatus && !isNudge && !isAssessment && !isSchedule) {
    return { type: 'unrecognized', raw: rawText }
  }

  const namePhrase = extractNamePhrase(text)
  const matches = findCandidateMatches(namePhrase, candidates)

  if (matches.length === 0) return { type: 'not_found', raw: namePhrase }
  if (matches.length > 1) return { type: 'ambiguous', matches, raw: namePhrase }

  const candidate = matches[0]
  if (isStatus) return { type: 'status', candidate }
  if (isNudge) return { type: 'nudge_interviewer', candidate }
  if (isAssessment) return { type: 'send_assessment', candidate }
  return { type: 'schedule', candidate, mode: isSelfSchedule ? 'self_schedule' : 'manual' }
}

export async function handleMessage(text: string, store: { listCandidates(): Promise<CandidateRecord[]> } & Record<string, any>): Promise<string> {
  const candidates = await store.listCandidates()
  const intent = parseIntent(text, candidates)

  switch (intent.type) {
    case 'schedule':
      await store.requestScheduling(intent.candidate.id, intent.mode)
      return intent.mode === 'self_schedule'
        ? `Done — I've drafted a self-scheduling link for ${intent.candidate.name}. It's waiting for approval in the RC's Approvals Queue.`
        : `Done — I've drafted an availability request for ${intent.candidate.name}. It's waiting for approval in the RC's Approvals Queue.`
    case 'send_assessment':
      await store.requestAssessmentSend(intent.candidate.id)
      return `Drafted the assessment email for ${intent.candidate.name} — it's waiting for approval in the Approvals Queue.`
    case 'nudge_interviewer':
      await store.nudgeInterviewer(intent.candidate.id)
      return `Drafted a nudge for ${intent.candidate.latestInterviewerName ?? 'the interviewer'} on ${intent.candidate.name} — it's waiting for approval in the Approvals Queue.`
    case 'status':
      return `${intent.candidate.name} is at "${intent.candidate.currentStage}", owned by ${intent.candidate.assigneeName}, SLA: ${intent.candidate.slaLabel}.`
    case 'ambiguous':
      return `I found a few matches for "${intent.raw}": ${intent.matches.map((m) => m.name).join(', ')} — could you use their full name?`
    case 'not_found':
      return `I couldn't find a candidate matching "${intent.raw}". Try their full name?`
    case 'unrecognized':
      return `I can help with: scheduling interviews ("schedule an interview with Jordan Rivera"), self-schedule links, sending assessments, nudging interviewers for feedback, and status checks ("what's the status of Jordan Rivera").`
  }
}
