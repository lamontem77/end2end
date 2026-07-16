// Thin fetch wrapper around the mock ATS API. Both the candidate simulator
// and the full-lifecycle script use this — swapping to a real ATS later
// means pointing BASE_URL/API_KEY at the real thing and adjusting whichever
// response shapes differ.
const BASE_URL = process.env.MOCK_ATS_BASE_URL ?? 'http://localhost:4000'
const API_KEY = process.env.MOCK_ATS_API_KEY ?? 'dev-key'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const atsClient = {
  getCandidate: (id: string) => request<any>('GET', `/v1/candidates/${id}`),
  createCandidate: (candidate: Record<string, unknown>) => request<any>('POST', '/v1/candidates', candidate),
  getJob: (id: string) => request<any>('GET', `/v1/jobs/${id}`),
  listJobs: () => request<{ jobs: any[]; total: number }>('GET', '/v1/jobs'),
  createApplication: (candidate_id: string, job_id: string) => request<any>('POST', '/v1/applications', { candidate_id, job_id }),
  getApplication: (id: string) => request<any>('GET', `/v1/applications/${id}`),
  listApplications: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request<{ applications: any[]; total: number }>('GET', `/v1/applications${qs ? `?${qs}` : ''}`)
  },
  moveStage: (id: string, stage: string, actor?: string) => request<any>('PATCH', `/v1/applications/${id}/stage`, { stage, actor }),
  reject: (id: string, reason?: string) => request<any>('POST', `/v1/applications/${id}/reject`, { reason }),
  listMessages: (id: string) => request<{ messages: any[]; total: number }>('GET', `/v1/applications/${id}/messages`),
  postMessage: (id: string, message: { from: string; type: string; text: string; proposed_slots?: string[]; chosen_slot?: string }) =>
    request<any>('POST', `/v1/applications/${id}/messages`, message),
  postScorecard: (id: string, scorecard: { interviewer: unknown; round?: number; recommendation: string; notes?: string }) =>
    request<any>('POST', `/v1/applications/${id}/scorecards`, scorecard),
  getActivity: (id: string) => request<{ application_id: string; events: any[] }>('GET', `/v1/applications/${id}/activity`),
  registerWebhook: (url: string, events: string[]) => request<any>('POST', '/v1/webhooks', { url, events }),
  getDeliveries: (webhookId: string) => request<{ deliveries: any[] }>('GET', `/v1/webhooks/${webhookId}/deliveries`),
  getFreeBusy: (userId: string, days: number) => request<{ user_id: string; busy: { start: string; end: string }[] }>('GET', `/v1/calendar/freebusy?user_id=${userId}&days=${days}`),
  createEvent: (event: { organizer: string; attendees: string[]; start: string; end: string }) => request<any>('POST', '/v1/calendar/events', event),
  createOnboarding: (applicationId: string, startDate?: string) => request<any>('POST', `/v1/applications/${applicationId}/onboarding`, { start_date: startDate }),
  getOnboarding: (applicationId: string) => request<any>('GET', `/v1/applications/${applicationId}/onboarding`),
  patchOnboardingItem: (applicationId: string, item: string, status: string) =>
    request<any>('PATCH', `/v1/applications/${applicationId}/onboarding/${item}`, { status }),
  getOutbox: () => request<{ emails: any[] }>('GET', '/v1/_debug/outbox'),
}
