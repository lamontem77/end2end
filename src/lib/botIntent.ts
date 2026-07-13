import type { Candidate } from '../types'

// Intent parser for the chat/Slack assistant. This stands in for a real
// Claude call the same way src/lib/agent.ts does for draft generation —
// swap `parseIntent`'s body for a Claude tool-use call once a backend +
// API key exist, keeping the same ParsedIntent shape so callers don't change.

export type ParsedIntent =
  | { type: 'schedule'; candidate: Candidate; mode: 'manual' | 'self_schedule' }
  | { type: 'send_assessment'; candidate: Candidate }
  | { type: 'nudge_interviewer'; candidate: Candidate }
  | { type: 'status'; candidate: Candidate }
  | { type: 'ambiguous'; matches: Candidate[]; raw: string }
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

function findCandidateMatches(raw: string, candidates: Candidate[]): Candidate[] {
  const needle = normalize(raw)
  if (!needle) return []
  // Exact full-name match wins outright.
  const exact = candidates.filter((c) => normalize(c.name) === needle)
  if (exact.length) return exact
  // Otherwise any candidate whose name appears in the text, or whose name
  // contains the extracted phrase (handles "jordan" matching "Jordan Rivera").
  return candidates.filter((c) => {
    const name = normalize(c.name)
    return needle.includes(name) || name.includes(needle) || name.split(' ').some((part) => needle.includes(part) && part.length > 2)
  })
}

// Pulls the candidate-name-shaped tail off a request, e.g.
// "schedule an interview with Jordan Rivera" -> "Jordan Rivera"
// "what's the status of Taylor Kim" -> "Taylor Kim"
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

export function parseIntent(rawText: string, candidates: Candidate[]): ParsedIntent {
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
