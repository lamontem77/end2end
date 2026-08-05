/**
 * Breezy HR API v3 client.
 * Docs: https://developer.breezy.hr/reference
 *
 * Auth: sign in with email/password → bearer token.
 * All calls go to https://api.breezy.hr/v3
 */

const BASE = 'https://api.breezy.hr/v3'

export interface BreezyStage {
  id: string
  name: string
  type: 'new' | 'active' | 'offer' | 'hired' | 'rejected' | string
}

export interface BreezyPosition {
  _id: string
  name: string
  department?: { name: string }
  state: 'published' | 'draft' | 'archived' | 'closed'
  type?: string
}

export interface BreezyTag {
  name: string
}

export interface BreezyCandidate {
  _id: string
  name: string
  email_address?: string
  phone_number?: string
  origin?: string
  stage?: BreezyStage
  tags?: BreezyTag[]
  created_date?: string
  updated_date?: string
  // position is not returned on candidate objects — callers must carry it
}

export interface BreezyCompany {
  _id: string
  name: string
}

export class BreezyClient {
  private token: string | null = null
  private companyId: string | null = null
  private tokenExpiresAt: number = 0

  constructor(
    private readonly email: string,
    private readonly password: string,
    companyId?: string,
  ) {
    if (companyId) this.companyId = companyId
  }

  private async ensureToken(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiresAt) return
    const res = await fetch(`${BASE}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Breezy sign-in failed ${res.status}: ${text}`)
    }
    const data = (await res.json()) as { access_token: string }
    this.token = data.access_token
    // Breezy tokens don't have a documented expiry — refresh after 50 min
    this.tokenExpiresAt = Date.now() + 50 * 60 * 1000
  }

  private async get<T>(path: string): Promise<T> {
    await this.ensureToken()
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: this.token! },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Breezy GET ${path} failed ${res.status}: ${text}`)
    }
    return res.json() as Promise<T>
  }

  private async put<T>(path: string, body: unknown): Promise<T> {
    await this.ensureToken()
    const res = await fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: { Authorization: this.token!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Breezy PUT ${path} failed ${res.status}: ${text}`)
    }
    return res.json() as Promise<T>
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    await this.ensureToken()
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: this.token!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Breezy POST ${path} failed ${res.status}: ${text}`)
    }
    return res.json() as Promise<T>
  }

  async getCompanies(): Promise<BreezyCompany[]> {
    return this.get<BreezyCompany[]>('/company')
  }

  async ensureCompanyId(): Promise<string> {
    if (this.companyId) return this.companyId
    const companies = await this.getCompanies()
    if (!companies.length) throw new Error('No Breezy companies found for this account')
    this.companyId = companies[0]._id
    return this.companyId
  }

  async getStages(): Promise<BreezyStage[]> {
    const cid = await this.ensureCompanyId()
    return this.get<BreezyStage[]>(`/company/${cid}/stages`)
  }

  async getPositions(state = 'published'): Promise<BreezyPosition[]> {
    const cid = await this.ensureCompanyId()
    return this.get<BreezyPosition[]>(`/company/${cid}/positions?state=${state}`)
  }

  async getCandidates(positionId: string): Promise<BreezyCandidate[]> {
    const cid = await this.ensureCompanyId()
    return this.get<BreezyCandidate[]>(`/company/${cid}/position/${positionId}/candidates`)
  }

  async getCandidate(positionId: string, candidateId: string): Promise<BreezyCandidate> {
    const cid = await this.ensureCompanyId()
    return this.get<BreezyCandidate>(
      `/company/${cid}/position/${positionId}/candidate/${candidateId}`,
    )
  }

  async updateCandidateStage(
    positionId: string,
    candidateId: string,
    stage: BreezyStage,
  ): Promise<BreezyCandidate> {
    const cid = await this.ensureCompanyId()
    return this.put<BreezyCandidate>(
      `/company/${cid}/position/${positionId}/candidate/${candidateId}`,
      { stage },
    )
  }

  async addNote(positionId: string, candidateId: string, content: string): Promise<void> {
    const cid = await this.ensureCompanyId()
    await this.post(`/company/${cid}/position/${positionId}/candidate/${candidateId}/note`, {
      content,
    })
  }

  /** Test credentials — returns company name on success, throws on failure. */
  async testConnection(): Promise<string> {
    const companies = await this.getCompanies()
    const cid = await this.ensureCompanyId()
    return companies.find((c) => c._id === cid)?.name ?? companies[0]?.name ?? 'Unknown company'
  }
}
