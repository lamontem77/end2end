import type { AgentActionType, Candidate, User } from '../types'

// Stands in for the real `claude-sonnet-4-6` call described in the PRD
// (POST https://api.anthropic.com/v1/messages, system prompt in section 19).
// Swap `generateDraftContent` for a real fetch() once ANTHROPIC_API_KEY is
// wired to a backend — the call shape (recipients/cc/subject/body) already
// matches AgentDraft so no other code needs to change.
const SYSTEM_PROMPT = `You are an intelligent recruiting coordination agent. Your job is to
draft professional, warm communications on behalf of recruiting coordinators.

Always: write in a professional but warm tone, be concise, CC the recruiter
on all candidate-facing emails, pre-fill every field you have data for, flag
missing fields rather than leaving blanks.

Never: send anything without human approval, invent information not in
context, use overly formal or robotic language.`

export interface DraftContext {
  candidate: Candidate
  recruiter: User
  rc: User
  interviewer?: User
  hiringManager?: User
  extra?: Record<string, string>
}

function greet(name: string) {
  return `Hi ${name.split(' ')[0]},`
}

export async function generateDraftContent(
  type: AgentActionType,
  ctx: DraftContext,
): Promise<{ subject: string; body: string; internalBody?: string }> {
  // Simulated latency so the Approvals Queue can show a "drafting..." state.
  await new Promise((r) => setTimeout(r, 300))
  const { candidate, recruiter, rc, interviewer, hiringManager, extra } = ctx
  const first = candidate.name.split(' ')[0]

  switch (type) {
    case 'availability_request':
      return {
        subject: `Interview scheduling — ${candidate.role} at RecruiterOS Inc.`,
        body: `${greet(candidate.name)}\n\nThanks for your interest in the ${candidate.role} role! I'd love to get some time on the calendar for your ${extra?.roundLabel ?? 'next interview'} (${extra?.length ?? '45 min'}, ${extra?.format ?? 'virtual via Webex'}).\n\nHere are three times that work well:\n  • ${extra?.slot1 ?? 'Mon 10:00 AM PT'}\n  • ${extra?.slot2 ?? 'Tue 2:00 PM PT'}\n  • ${extra?.slot3 ?? 'Wed 11:30 AM PT'}\n\nLet me know which works, or share a few other times and I'll find a match.\n\nBest,\n${rc.name}`,
      }
    case 'schedule_invite':
      return {
        subject: `Interview confirmed — ${candidate.role} · ${extra?.when ?? 'TBD'}`,
        body: `${greet(candidate.name)}\n\nYou're all set! Your interview with ${interviewer?.name ?? 'the team'} is confirmed for ${extra?.when ?? 'TBD'}.\n\nJoin via Webex: ${extra?.webex ?? 'link generated on approval'}\n${extra?.assessment ? `Take-home reference: ${extra.assessment}\n` : ''}\nWhat to expect: a conversational, technical discussion about your experience with ${candidate.role.toLowerCase()} work. No need to prepare slides — just come as you are.\n\nBest,\n${rc.name}`,
        internalBody: `Interview scheduled: ${candidate.name} (${candidate.role})\nInterviewer: ${interviewer?.name}\nRC: ${rc.name}  ·  Recruiter: ${recruiter.name}\nWhen: ${extra?.when ?? 'TBD'}\nWebex: ${extra?.webex ?? 'auto-generated'}\nHackerRank: ${extra?.hackerrank ?? 'SWE II take-home'}\nFeedback form: ${extra?.feedbackForm ?? 'Standard scorecard'}\nCandidate profile: /tickets/${candidate.id}`,
      }
    case 'self_schedule':
      return {
        subject: `Pick a time — ${candidate.role} interview`,
        body: `${greet(candidate.name)}\n\nPlease grab a time that works for you here: ${extra?.schedulingLink ?? '[self-schedule link]'}\n\nThe interview will be ${extra?.length ?? '45 min'}, ${extra?.format ?? 'virtual via Webex'}, with ${interviewer?.name ?? 'our interviewer'}.\n\nBest,\n${rc.name}`,
      }
    case 'assessment_send':
      return {
        subject: `Take-home assessment — ${candidate.role}`,
        body: `${greet(candidate.name)}\n\nNext step is a short take-home assessment via HackerRank: ${extra?.hackerrankLink ?? '[HackerRank link]'}\n\nYou'll have ${extra?.deadline ?? '5 days'} to complete it — expect to spend about ${extra?.duration ?? '2-3 hours'}. Let me know if anything comes up.\n\nBest,\n${rc.name}`,
      }
    case 'assessment_reminder':
      return {
        subject: `Reminder — your ${candidate.role} assessment`,
        body: `${greet(candidate.name)}\n\nJust a friendly nudge — your take-home assessment is still open. Let me know if you have questions or need more time.\n\nBest,\n${rc.name}`,
      }
    case 'offer_letter':
      return {
        subject: `Offer letter — ${candidate.name}`,
        body: `Offer letter drafted for ${candidate.name}\nRole: ${candidate.role}  ·  Department: ${candidate.department}\nStart date: ${extra?.startDate ?? 'TBD'}\nCompensation: ${extra?.compensation ?? '[pending recruiter input]'}\nManager: ${hiringManager?.name ?? 'TBD'}\n\nReview and approve to send to ${first} for e-signature.`,
      }
    case 'offer_send':
      return {
        subject: `Your offer from RecruiterOS Inc. — ${candidate.role}`,
        body: `${greet(candidate.name)}\n\nWe're thrilled to extend you an offer for the ${candidate.role} role! Your formal offer letter is attached for e-signature.\n\nPlease review and sign at your convenience — reach out with any questions.\n\nBest,\n${rc.name}`,
      }
    case 'rejection_email':
      return {
        subject: `Update on your application — ${candidate.role}`,
        body: `${greet(candidate.name)}\n\nThank you for taking the time to interview with us for the ${candidate.role} role. After careful consideration, we've decided to move forward with other candidates at this time.\n\nWe really enjoyed getting to know you and hope our paths cross again.\n\nBest,\n${recruiter.name}`,
      }
    case 'interview_prep':
      return {
        subject: `Prep notes — ${candidate.name} interview`,
        body: `Heads up ${interviewer?.name?.split(' ')[0] ?? ''} — you're interviewing ${candidate.name} for ${candidate.role}.\n\nCandidate profile: /tickets/${candidate.id}\nSource: ${candidate.source}\nFormat: ${extra?.format ?? 'virtual via Webex'}\nFeedback due within 24h of the interview via the scorecard link in your queue.`,
      }
    case 'interviewer_nudge':
      return {
        subject: `Reminder — scorecard needed for ${candidate.name}`,
        body: `Hi ${interviewer?.name?.split(' ')[0] ?? ''}, just a nudge to submit your scorecard for ${candidate.name} (${candidate.role}) — it's been waiting a bit and the candidate is in queue for a decision.`,
      }
    case 'bgc_initiation':
      return {
        subject: `Background check — ${candidate.name}`,
        body: `Background check request pre-filled for ${candidate.name}. Vendor: Checkr. Confirm to submit.`,
      }
    case 'drug_test_order':
      return {
        subject: `Drug test order — ${candidate.name}`,
        body: `Drug test order pre-filled for ${candidate.name}. Lab: Quest Diagnostics. Confirm to submit.`,
      }
    case 'start_date_confirmation':
      return {
        subject: `Welcome to the team, ${first}!`,
        body: `${greet(candidate.name)}\n\nExcited for your first day on ${extra?.startDate ?? 'your start date'}! Here's what to expect:\n  • Arrival time & location/link\n  • Who to ask for\n  • What to bring\n\nWe'll follow up with final logistics closer to the date.\n\nBest,\nThe Team`,
      }
    case 'offer_confirmation':
      return {
        subject: `Confirming your offer details — ${candidate.name}`,
        body: `${greet(candidate.name)}\n\nCongrats again! This confirms your accepted offer for ${candidate.role}, starting ${extra?.startDate ?? 'TBD'}. We'll be in touch shortly with background check and onboarding next steps.\n\nBest,\n${rc.name}`,
      }
    default:
      return { subject: 'Draft', body: '' }
  }
}

export const AGENT_SYSTEM_PROMPT = SYSTEM_PROMPT
