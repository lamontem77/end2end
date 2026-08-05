/**
 * Breezy HR → RecruiterOS sync engine.
 *
 * Keeps an in-memory snapshot of candidates pulled from Breezy.
 * The frontend fetches this via GET /api/candidates.
 *
 * Stage mapping: Breezy uses free-form stage names. We do a best-effort
 * name match to our Stage enum. Operators can override via BREEZY_STAGE_MAP
 * env var (JSON: { "Breezy Stage Name": "Our Stage Name" }).
 */

import type { BreezyCandidate, BreezyClient, BreezyPosition, BreezyStage } from './breezy.js'

// Mirrors src/types/index.ts Stage — duplicated here to avoid cross-package deps
export type Stage =
  | 'Applied'
  | 'Screening Scheduled'
  | 'Phone Screen'
  | 'Assessment to Send'
  | 'Assessment Pending'
  | 'Assessment Review'
  | 'Round N Scheduling'
  | 'Round N In Progress'
  | 'Pending Feedback'
  | 'Debrief / Decision'
  | 'Offer Prep'
  | 'Offer Pending Approval'
  | 'Offer Extended'
  | 'Offer Accepted'

const DEFAULT_STAGE_MAP: Record<string, Stage> = {
  new: 'Applied',
  applied: 'Applied',
  'phone screen': 'Phone Screen',
  screening: 'Screening Scheduled',
  'screening scheduled': 'Screening Scheduled',
  assessment: 'Assessment to Send',
  interview: 'Round N Scheduling',
  'interview scheduled': 'Round N Scheduling',
  'interview in progress': 'Round N In Progress',
  'pending feedback': 'Pending Feedback',
  'debrief': 'Debrief / Decision',
  'decision': 'Debrief / Decision',
  'offer': 'Offer Prep',
  'offer prep': 'Offer Prep',
  'offer extended': 'Offer Extended',
  'offer accepted': 'Offer Accepted',
  hired: 'Offer Accepted',
}

function parseStageMap(): Record<string, Stage> {
  const raw = process.env.BREEZY_STAGE_MAP
  if (!raw) return DEFAULT_STAGE_MAP
  try {
    return { ...DEFAULT_STAGE_MAP, ...JSON.parse(raw) }
  } catch {
    console.warn('[syncEngine] BREEZY_STAGE_MAP is not valid JSON — using defaults')
    return DEFAULT_STAGE_MAP
  }
}

function mapBreezyStage(breezyStageName: string | undefined): Stage {
  if (!breezyStageName) return 'Applied'
  const stageMap = parseStageMap()
  const key = breezyStageName.toLowerCase().trim()
  return stageMap[key] ?? 'Applied'
}

function mapOriginToSource(origin: string | undefined): string {
  if (!origin) return 'Unknown'
  const map: Record<string, string> = {
    linkedin: 'LinkedIn',
    referral: 'Referral',
    careers_page: 'Careers Page',
    indeed: 'Indeed',
    glassdoor: 'Glassdoor',
    agency: 'Agency',
    direct: 'Direct',
    applied: 'Applied',
  }
  return map[origin.toLowerCase()] ?? origin
}

export interface SyncedCandidate {
  id: string              // "breezy-{_id}"
  breezyId: string        // raw Breezy _id
  breezyPositionId: string
  name: string
  email: string
  phone?: string
  role: string            // position name
  department: string
  source: string
  currentStage: Stage
  breezyStageId: string
  breezyStageName: string
  tags: string[]
  createdAt: string
  updatedAt: string
  // Available slots we've collected for scheduling
  availabilitySlots?: string[]
}

export interface SyncState {
  lastSyncAt: string | null
  candidateCount: number
  positionCount: number
  error: string | null
}

const store: Map<string, SyncedCandidate> = new Map()
let syncState: SyncState = {
  lastSyncAt: null,
  candidateCount: 0,
  positionCount: 0,
  error: null,
}

export function getSyncState(): SyncState {
  return syncState
}

export function getAllCandidates(): SyncedCandidate[] {
  return Array.from(store.values())
}

export function getCandidate(id: string): SyncedCandidate | undefined {
  return store.get(id)
}

function mapCandidate(
  raw: BreezyCandidate,
  position: BreezyPosition,
): SyncedCandidate {
  return {
    id: `breezy-${raw._id}`,
    breezyId: raw._id,
    breezyPositionId: position._id,
    name: raw.name ?? 'Unknown',
    email: raw.email_address ?? '',
    phone: raw.phone_number,
    role: position.name,
    department: position.department?.name ?? 'Unknown',
    source: mapOriginToSource(raw.origin),
    currentStage: mapBreezyStage(raw.stage?.name),
    breezyStageId: raw.stage?.id ?? '',
    breezyStageName: raw.stage?.name ?? '',
    tags: (raw.tags ?? []).map((t) => t.name),
    createdAt: raw.created_date ?? new Date().toISOString(),
    updatedAt: raw.updated_date ?? new Date().toISOString(),
  }
}

export async function runSync(client: BreezyClient): Promise<void> {
  console.log('[syncEngine] starting sync...')
  try {
    const positions = await client.getPositions('published')
    let count = 0
    for (const position of positions) {
      const candidates = await client.getCandidates(position._id)
      for (const raw of candidates) {
        const mapped = mapCandidate(raw, position)
        store.set(mapped.id, mapped)
        count++
      }
    }
    syncState = {
      lastSyncAt: new Date().toISOString(),
      candidateCount: count,
      positionCount: positions.length,
      error: null,
    }
    console.log(`[syncEngine] sync complete — ${count} candidates across ${positions.length} positions`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[syncEngine] sync failed:', msg)
    syncState = { ...syncState, error: msg }
  }
}

/**
 * Update a candidate's stage locally and push to Breezy.
 * Returns the updated candidate.
 */
export async function advanceCandidateStage(
  client: BreezyClient,
  candidateId: string,
  targetStage: Stage,
  breezyStage: BreezyStage,
  noteContent?: string,
): Promise<SyncedCandidate> {
  const existing = store.get(candidateId)
  if (!existing) throw new Error(`Candidate ${candidateId} not found in sync store`)

  await client.updateCandidateStage(existing.breezyPositionId, existing.breezyId, breezyStage)

  if (noteContent) {
    await client.addNote(existing.breezyPositionId, existing.breezyId, noteContent)
  }

  const updated: SyncedCandidate = {
    ...existing,
    currentStage: targetStage,
    breezyStageId: breezyStage.id,
    breezyStageName: breezyStage.name,
    updatedAt: new Date().toISOString(),
  }
  store.set(candidateId, updated)
  return updated
}
