/**
 * Google OAuth 2.0 + Gmail + Calendar integration.
 *
 * OAuth flow:
 *   1. GET /api/google/oauth/start  → redirects to Google consent screen
 *   2. Google redirects back to GET /api/google/oauth/callback?code=...
 *   3. We exchange code for tokens and store them in memory.
 *
 * Scopes requested:
 *   - gmail.send          — send emails on behalf of the logged-in user
 *   - calendar.events     — create/update calendar events
 *   - calendar.readonly   — read freebusy / event details
 */

import { google } from 'googleapis'
import type { OAuth2Client, Credentials } from 'google-auth-library'

// In-memory token store. For a real deploy, persist to a database.
let storedTokens: Credentials | null = null
let authorizedEmail: string | null = null

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

function makeClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3001/api/google/oauth/callback'
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set')
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getAuthUrl(): string {
  const client = makeClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function handleOAuthCallback(code: string): Promise<string> {
  const client = makeClient()
  const { tokens } = await client.getToken(code)
  storedTokens = tokens
  client.setCredentials(tokens)

  // Fetch the email address of the authorized user
  const oauth2 = google.oauth2({ version: 'v2', auth: client })
  const info = await oauth2.userinfo.get()
  authorizedEmail = info.data.email ?? null

  return authorizedEmail ?? 'unknown'
}

export function getGoogleStatus(): { connected: boolean; email: string | null } {
  return { connected: storedTokens !== null, email: authorizedEmail }
}

export function revokeGoogle(): void {
  storedTokens = null
  authorizedEmail = null
}

function getAuthedClient(): OAuth2Client {
  if (!storedTokens) throw new Error('Google not connected — complete OAuth first')
  const client = makeClient()
  client.setCredentials(storedTokens)
  // Auto-refresh on expiry
  client.on('tokens', (tokens) => {
    if (tokens.refresh_token) storedTokens = { ...storedTokens, ...tokens }
    else storedTokens = { ...storedTokens, ...tokens }
  })
  return client
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string[]
  cc?: string[]
  subject: string
  bodyHtml: string
  fromName?: string
}

function buildRawEmail(payload: EmailPayload, fromEmail: string): string {
  const from = payload.fromName ? `${payload.fromName} <${fromEmail}>` : fromEmail
  const to = payload.to.join(', ')
  const cc = payload.cc?.length ? `Cc: ${payload.cc.join(', ')}\r\n` : ''
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    cc.trimEnd(),
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    payload.bodyHtml,
  ]
    .filter((l) => l !== undefined)
    .join('\r\n')
  return Buffer.from(raw).toString('base64url')
}

export async function sendGmail(payload: EmailPayload): Promise<string> {
  const client = getAuthedClient()
  if (!authorizedEmail) throw new Error('No authorized email — reconnect Google')
  const gmail = google.gmail({ version: 'v1', auth: client })
  const raw = buildRawEmail(payload, authorizedEmail)
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })
  return res.data.id ?? 'sent'
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface FreeBusyRequest {
  emails: string[] // check availability for these calendars
  timeMin: string  // ISO 8601
  timeMax: string  // ISO 8601
}

export interface BusySlot {
  start: string
  end: string
}

export async function getFreeBusy(
  req: FreeBusyRequest,
): Promise<Record<string, BusySlot[]>> {
  const client = getAuthedClient()
  const calendar = google.calendar({ version: 'v3', auth: client })
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: req.timeMin,
      timeMax: req.timeMax,
      items: req.emails.map((id) => ({ id })),
    },
  })
  const result: Record<string, BusySlot[]> = {}
  for (const [email, cal] of Object.entries(res.data.calendars ?? {})) {
    result[email] = (cal.busy ?? []).map((b) => ({
      start: b.start ?? '',
      end: b.end ?? '',
    }))
  }
  return result
}

export interface BookEventRequest {
  summary: string
  description?: string
  startIso: string // e.g. "2025-10-15T10:00:00-07:00"
  endIso: string
  attendeeEmails: string[]
  meetLink?: boolean // if true, add a Google Meet conference
  location?: string
}

export interface BookedEvent {
  eventId: string
  htmlLink: string
  meetLink?: string
}

export async function bookCalendarEvent(req: BookEventRequest): Promise<BookedEvent> {
  const client = getAuthedClient()
  const calendar = google.calendar({ version: 'v3', auth: client })
  const res = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all', // send invite emails to attendees
    requestBody: {
      summary: req.summary,
      description: req.description,
      start: { dateTime: req.startIso },
      end: { dateTime: req.endIso },
      attendees: req.attendeeEmails.map((email) => ({ email })),
      location: req.location,
      ...(req.meetLink
        ? {
            conferenceData: {
              createRequest: {
                requestId: `ros-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          }
        : {}),
    },
    conferenceDataVersion: req.meetLink ? 1 : 0,
  })
  const event = res.data
  return {
    eventId: event.id ?? '',
    htmlLink: event.htmlLink ?? '',
    meetLink: event.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri,
  }
}
