/**
 * HTTP client for the RecruiterOS backend server.
 *
 * Base URL is read from localStorage key `ros-backend-url` so
 * the coordinator can set it in Settings without a code deploy.
 * Falls back to http://localhost:3001.
 */

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ros-backend-url') ?? 'http://localhost:3001'
  }
  return 'http://localhost:3001'
}

export function setBackendUrl(url: string): void {
  localStorage.setItem('ros-backend-url', url.replace(/\/$/, ''))
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const base = getBackendUrl()
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `${method} ${path} failed (${res.status})`)
  return data as T
}

const get = <T>(path: string) => request<T>('GET', path)
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)

// ─── Types mirroring server responses ─────────────────────────────────────────

export interface SyncState {
  lastSyncAt: string | null
  candidateCount: number
  positionCount: number
  error: string | null
}

export interface BreezyStatus {
  connected: boolean
  sync: SyncState
}

export interface GoogleStatus {
  connected: boolean
  email: string | null
}

export interface SyncedCandidate {
  id: string
  breezyId: string
  breezyPositionId: string
  name: string
  email: string
  phone?: string
  role: string
  department: string
  source: string
  currentStage: string
  breezyStageId: string
  breezyStageName: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface BreezyStage {
  id: string
  name: string
  type: string
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const api = {
  health: () => get<{ ok: boolean }>('/healthz'),

  breezy: {
    connect: (email: string, password: string, companyId?: string) =>
      post<{ ok: boolean; companyName: string }>('/api/breezy/connect', {
        email,
        password,
        companyId,
      }),
    status: () => get<BreezyStatus>('/api/breezy/status'),
    sync: () => post<{ ok: boolean; sync: SyncState }>('/api/breezy/sync'),
    stages: () => get<BreezyStage[]>('/api/breezy/stages'),
  },

  candidates: {
    list: () => get<SyncedCandidate[]>('/api/candidates'),
    get: (id: string) => get<SyncedCandidate>(`/api/candidates/${id}`),
    advance: (id: string, targetStage: string, breezyStage: BreezyStage, note?: string) =>
      post<SyncedCandidate>(`/api/candidates/${id}/advance`, {
        targetStage,
        breezyStage,
        note,
      }),
    addNote: (id: string, content: string) =>
      post<{ ok: boolean }>(`/api/candidates/${id}/note`, { content }),
  },

  google: {
    status: () => get<GoogleStatus>('/api/google/status'),
    oauthUrl: () => `${getBackendUrl()}/api/google/oauth/start`,
    revoke: () => post<{ ok: boolean }>('/api/google/revoke'),
  },

  email: {
    send: (payload: {
      to: string[]
      cc?: string[]
      subject: string
      bodyHtml: string
      fromName?: string
    }) => post<{ ok: boolean; messageId: string }>('/api/email/send', payload),
  },

  calendar: {
    freebusy: (emails: string[], timeMin: string, timeMax: string) =>
      post<Record<string, Array<{ start: string; end: string }>>>('/api/calendar/freebusy', {
        emails,
        timeMin,
        timeMax,
      }),
    book: (payload: {
      summary: string
      description?: string
      startIso: string
      endIso: string
      attendeeEmails: string[]
      meetLink?: boolean
      location?: string
    }) =>
      post<{ eventId: string; htmlLink: string; meetLink?: string }>(
        '/api/calendar/book',
        payload,
      ),
  },
}
