// Sandboxed email sending. No real email provider credentials are available
// in this environment, so this defaults to a capture-only mode: nothing is
// ever sent to a real inbox, every "send" is logged and stored in an
// in-memory outbox you can inspect via GET /v1/_debug/outbox.
//
// Two real swap-in points, both intentionally left unconfigured:
//
// 1. Mailtrap Sandbox (recommended for dev) — a fake SMTP endpoint that
//    captures all mail for inspection in their UI; nothing ever reaches a
//    real recipient even if the "to" address is real. Sign up, grab the
//    sandbox SMTP credentials, and set MAILTRAP_* below.
// 2. Resend test mode — Resend doesn't have a sandbox SMTP the way Mailtrap
//    does, but you can restrict sends to your own verified addresses (or
//    the shared onboarding@resend.dev sender) while developing. Set
//    RESEND_API_KEY to switch to it.
//
// Until either is configured, `sendEmail` just logs + records locally —
// exactly the same "nothing real happens, but the call shape is production
// -ready" pattern the rest of this repo uses for Claude/Webex/Checkr.
export interface OutboundEmail {
  to: string
  cc?: string[]
  subject: string
  body: string
}

export interface SentEmailRecord extends OutboundEmail {
  id: string
  sent_at: string
  provider: 'console' | 'mailtrap' | 'resend'
}

const outbox: SentEmailRecord[] = []

export function getOutbox(): SentEmailRecord[] {
  return outbox
}

export async function sendEmail(email: OutboundEmail): Promise<SentEmailRecord> {
  const provider = process.env.RESEND_API_KEY ? 'resend' : process.env.MAILTRAP_HOST ? 'mailtrap' : 'console'
  const record: SentEmailRecord = { ...email, id: `email_${Math.random().toString(36).slice(2, 10)}`, sent_at: new Date().toISOString(), provider }

  if (provider === 'resend') {
    // Real call, left inert unless RESEND_API_KEY is actually set:
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ from: process.env.RESEND_FROM ?? 'onboarding@resend.dev', to: email.to, cc: email.cc, subject: email.subject, html: email.body }),
    // })
    console.log(`[email:resend-stub] would send "${email.subject}" to ${email.to} — wire the fetch call above once RESEND_API_KEY is real`)
  } else if (provider === 'mailtrap') {
    // Real call, left inert unless MAILTRAP_HOST is actually set — point a
    // standard SMTP client (e.g. nodemailer) at Mailtrap's sandbox host/port/
    // credentials instead of a real mail server.
    console.log(`[email:mailtrap-stub] would send "${email.subject}" to ${email.to} via ${process.env.MAILTRAP_HOST} — wire an SMTP client once credentials are real`)
  } else {
    console.log(`[email:console] "${email.subject}" -> ${email.to}${email.cc?.length ? ` (cc: ${email.cc.join(', ')})` : ''}`)
  }

  outbox.push(record)
  return record
}
