import type { AgentActionType, Candidate, User } from '../types'

// Stands in for a real claude-sonnet model call (POST /v1/messages).
// Swap `buildAnonymizedDraft` for a real fetch() once a backend is wired.
// The crucial invariant: no candidate PII (name, email, phone) is in the
// context sent to the model — only candidate ID + role/department/stage
// metadata. Real names are substituted back locally in `personalizeDraft()`.
const SYSTEM_PROMPT = `You are an intelligent recruiting coordination agent.
Draft professional, warm communications for recruiting coordinators.

Rules:
- Write in a professional but warm tone, be concise.
- Pre-fill every field you have data for; flag missing fields.
- Never invent information not in context.
- Output uses {{TOKEN}} placeholders — the system substitutes real values after.
- Never output candidate PII — use only the tokens provided.`

export interface DraftContext {
  candidate: Candidate
  recruiter: User
  rc: User
  interviewer?: User
  hiringManager?: User
  extra?: Record<string, string>
}

// What actually goes to the model — no real names or contact details.
interface AnonymizedContext {
  candidateId: string
  role: string
  department: string
  stage: string
  subStatus?: string
  extra?: Record<string, string>
}

// Substituted locally after the model returns. Never leaves the browser.
interface PersonalizationTokens {
  CANDIDATE_FIRST: string
  CANDIDATE_FULL: string
  RC_NAME: string
  RC_FIRST: string
  RECRUITER_NAME: string
  RECRUITER_FIRST: string
  INTERVIEWER_NAME: string
  INTERVIEWER_FIRST: string
  HM_NAME: string
}

function first(name: string) {
  return name.split(' ')[0]
}

// Avoids "Devon K.." when a name already ends in an abbreviation period.
function withPeriod(text: string) {
  return text.endsWith('.') ? text : `${text}.`
}

function tok(key: keyof PersonalizationTokens) {
  return `{{${key}}}`
}

/** Simulates the model response — returns a template with {{TOKEN}} placeholders. */
async function buildAnonymizedDraft(
  type: AgentActionType,
  _anonCtx: AnonymizedContext,
  extra: Record<string, string>,
): Promise<{ subject: string; body: string; internalBody?: string }> {
  // Simulated latency so the approvals queue can show a "drafting…" state.
  await new Promise((r) => setTimeout(r, 300))

  const CANDIDATE_FIRST = tok('CANDIDATE_FIRST')
  const CANDIDATE_FULL = tok('CANDIDATE_FULL')
  const RC_NAME = tok('RC_NAME')
  const INTERVIEWER_NAME = tok('INTERVIEWER_NAME')
  const INTERVIEWER_FIRST = tok('INTERVIEWER_FIRST')
  const RECRUITER_NAME = tok('RECRUITER_NAME')
  const HM_NAME = tok('HM_NAME')
  const role = _anonCtx.role
  const dept = _anonCtx.department

  switch (type) {
    case 'availability_request':
      return {
        subject: `Interview scheduling — ${role} at RecruiterOS Inc.`,
        body: `Hi ${CANDIDATE_FIRST},\n\nThanks for your interest in the ${role} role! I'd love to get some time on the calendar for your ${extra.roundLabel ?? 'next interview'} (${extra.length ?? '45 min'}, ${extra.format ?? 'virtual via Webex'}).\n\nHere are three times that work well:\n  • ${extra.slot1 ?? 'Mon 10:00 AM PT'}\n  • ${extra.slot2 ?? 'Tue 2:00 PM PT'}\n  • ${extra.slot3 ?? 'Wed 11:30 AM PT'}\n\nLet me know which works, or share a few other times and I'll find a match.\n\nBest,\n${RC_NAME}`,
      }
    case 'schedule_invite':
      return {
        subject: `Interview confirmed — ${role} · ${extra.when ?? 'TBD'}`,
        body: `Hi ${CANDIDATE_FIRST},\n\nYou're all set! Your interview with ${INTERVIEWER_NAME} is confirmed for ${extra.when ?? 'TBD'}.\n\nJoin via Webex: ${extra.webex ?? 'link generated on approval'}\n${extra.assessment ? `Take-home reference: ${extra.assessment}\n` : ''}\nWhat to expect: a conversational, technical discussion about your experience with ${role.toLowerCase()} work. No need to prepare slides — just come as you are.\n\nBest,\n${RC_NAME}`,
        internalBody: `Interview scheduled: ${CANDIDATE_FULL} (${role})\nInterviewer: ${INTERVIEWER_NAME}\nRC: ${RC_NAME}  ·  Recruiter: ${RECRUITER_NAME}\nWhen: ${extra.when ?? 'TBD'}\nWebex: ${extra.webex ?? 'auto-generated'}\nHackerRank: ${extra.hackerrank ?? 'SWE II take-home'}\nFeedback form: ${extra.feedbackForm ?? 'Standard scorecard'}`,
      }
    case 'self_schedule':
      return {
        subject: `Pick a time — ${role} interview`,
        body: `Hi ${CANDIDATE_FIRST},\n\nPlease grab a time that works for you here: ${extra.schedulingLink ?? '[self-schedule link]'}\n\nThe interview will be ${extra.length ?? '45 min'}, ${extra.format ?? 'virtual via Webex'}, with ${withPeriod(INTERVIEWER_NAME)}\n\nBest,\n${RC_NAME}`,
      }
    case 'assessment_send':
      return {
        subject: `Take-home assessment — ${role}`,
        body: `Hi ${CANDIDATE_FIRST},\n\nNext step is a short take-home assessment via HackerRank: ${extra.hackerrankLink ?? '[HackerRank link]'}\n\nYou'll have ${extra.deadline ?? '5 days'} to complete it — expect to spend about ${extra.duration ?? '2-3 hours'}. Let me know if anything comes up.\n\nBest,\n${RC_NAME}`,
      }
    case 'assessment_reminder':
      return {
        subject: `Reminder — your ${role} assessment`,
        body: `Hi ${CANDIDATE_FIRST},\n\nJust a friendly nudge — your take-home assessment is still open. Let me know if you have questions or need more time.\n\nBest,\n${RC_NAME}`,
      }
    case 'offer_letter':
      return {
        subject: `Offer letter — ${dept} ${role}`,
        body: `Offer letter drafted for ${CANDIDATE_FULL}\nRole: ${role}  ·  Department: ${dept}\nStart date: ${extra.startDate ?? 'TBD'}\nCompensation: ${extra.compensation ?? '[pending recruiter input]'}\nManager: ${HM_NAME}\n\nReview and approve to send for e-signature.`,
      }
    case 'offer_send':
      return {
        subject: `Your offer from RecruiterOS Inc. — ${role}`,
        body: `Hi ${CANDIDATE_FIRST},\n\nWe're thrilled to extend you an offer for the ${role} role! Your formal offer letter is attached for e-signature.\n\nPlease review and sign at your convenience — reach out with any questions.\n\nBest,\n${RC_NAME}`,
      }
    case 'rejection_email':
      return {
        subject: `Update on your application — ${role}`,
        body: `Hi ${CANDIDATE_FIRST},\n\nThank you for taking the time to interview with us for the ${role} role. After careful consideration, we've decided to move forward with other candidates at this time.\n\nWe really enjoyed getting to know you and hope our paths cross again.\n\nBest,\n${RECRUITER_NAME}`,
      }
    case 'interview_prep':
      return {
        subject: `Prep notes — ${CANDIDATE_FULL} interview`,
        body: `Heads up ${INTERVIEWER_FIRST} — you're interviewing ${CANDIDATE_FULL} for ${role}.\n\nSource: ${_anonCtx.stage}\nFormat: ${extra.format ?? 'virtual via Webex'}\nFeedback due within 24h of the interview via the scorecard link in your queue.`,
      }
    case 'interviewer_nudge':
      return {
        subject: `Reminder — scorecard needed for ${role} candidate`,
        body: `Hi ${INTERVIEWER_FIRST}, just a nudge to submit your scorecard for the ${role} candidate (${dept}) — it's been waiting a bit and the team is ready for a decision.`,
      }
    case 'bgc_initiation':
      return {
        subject: `Background check — ${CANDIDATE_FULL}`,
        body: `Background check request pre-filled for ${CANDIDATE_FULL}. Vendor: Checkr. Confirm to submit.`,
      }
    case 'drug_test_order':
      return {
        subject: `Drug test order — ${CANDIDATE_FULL}`,
        body: `Drug test order pre-filled for ${CANDIDATE_FULL}. Lab: Quest Diagnostics. Confirm to submit.`,
      }
    case 'start_date_confirmation':
      return {
        subject: `Welcome to the team, ${CANDIDATE_FIRST}!`,
        body: `Hi ${CANDIDATE_FIRST},\n\nExcited for your first day on ${extra.startDate ?? 'your start date'}! Here's what to expect:\n  • Arrival time & location/link\n  • Who to ask for\n  • What to bring\n\nWe'll follow up with final logistics closer to the date.\n\nBest,\nThe Team`,
      }
    case 'offer_confirmation':
      return {
        subject: `Confirming your offer details — ${CANDIDATE_FULL}`,
        body: `Hi ${CANDIDATE_FIRST},\n\nCongrats again! This confirms your accepted offer for ${role}, starting ${extra.startDate ?? 'TBD'}. We'll be in touch shortly with background check and onboarding next steps.\n\nBest,\n${RC_NAME}`,
      }
    default:
      return { subject: 'Draft', body: '' }
  }
}

/** Substitutes {{TOKEN}} placeholders with real values locally in the browser. */
function personalizeDraft(template: string, tokens: PersonalizationTokens): string {
  return (Object.keys(tokens) as (keyof PersonalizationTokens)[]).reduce(
    (text, key) => text.replaceAll(`{{${key}}}`, tokens[key]),
    template,
  )
}

export async function generateDraftContent(
  type: AgentActionType,
  ctx: DraftContext,
): Promise<{ subject: string; body: string; internalBody?: string }> {
  const { candidate, recruiter, rc, interviewer, hiringManager, extra = {} } = ctx

  // Step 1: build anonymized context — this is what the model sees.
  const anonCtx: AnonymizedContext = {
    candidateId: candidate.id,
    role: candidate.role,
    department: candidate.department,
    stage: candidate.currentStage,
    extra,
  }

  // Step 2: model returns template with {{TOKEN}} placeholders.
  const template = await buildAnonymizedDraft(type, anonCtx, extra)

  // Step 3: substitute real names locally — PII never left the browser.
  const tokens: PersonalizationTokens = {
    CANDIDATE_FIRST: first(candidate.name),
    CANDIDATE_FULL: candidate.name,
    RC_NAME: rc.name,
    RC_FIRST: first(rc.name),
    RECRUITER_NAME: recruiter.name,
    RECRUITER_FIRST: first(recruiter.name),
    INTERVIEWER_NAME: interviewer?.name ?? 'the interviewer',
    INTERVIEWER_FIRST: first(interviewer?.name ?? 'the interviewer'),
    HM_NAME: hiringManager?.name ?? 'TBD',
  }

  return {
    subject: personalizeDraft(template.subject, tokens),
    body: personalizeDraft(template.body, tokens),
    internalBody: template.internalBody ? personalizeDraft(template.internalBody, tokens) : undefined,
  }
}

export const AGENT_SYSTEM_PROMPT = SYSTEM_PROMPT
