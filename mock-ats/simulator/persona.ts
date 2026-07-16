// Gives each candidate a stable "personality" so the same candidate behaves
// consistently across a run (Jordan is always flaky; Priya always replies
// same-day) while still varying across the pool — that's what makes this
// useful for stress-testing a scheduling agent instead of just fuzzing it.

export interface Persona {
  responsiveness: number // 0-1: chance they reply at all instead of ghosting
  decisiveness: number // 0-1: chance they accept a proposed slot outright vs. countering
  responseDelayMinutes: [number, number] // simulated turnaround range
}

function hashSeed(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 0xffffffff
}

export function personaFor(candidateId: string): Persona {
  const seed = hashSeed(candidateId)
  // Spread the seed across three pseudo-independent traits.
  const a = seed
  const b = hashSeed(candidateId + ':b')
  const c = hashSeed(candidateId + ':c')
  return {
    responsiveness: 0.55 + a * 0.45, // 55-100% chance of replying at all
    decisiveness: 0.3 + b * 0.6, // 30-90% chance of just taking a slot
    responseDelayMinutes: [Math.round(c * 60), Math.round(60 + c * 24 * 60)],
  }
}

export type SchedulingAction =
  | { kind: 'ghost' }
  | { kind: 'accept'; chosen_slot: string; text: string }
  | { kind: 'reschedule'; proposed_slots: string[]; text: string }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function futureIso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString()
}

export function decideSchedulingResponse(persona: Persona, proposedSlots: string[] | undefined, firstName: string): SchedulingAction {
  if (Math.random() > persona.responsiveness) return { kind: 'ghost' }

  if (Math.random() < persona.decisiveness && proposedSlots && proposedSlots.length > 0) {
    return {
      kind: 'accept',
      chosen_slot: pick(proposedSlots),
      text: pick([
        `That works for me, see you then!`,
        `Sounds good — I'll be there.`,
        `Perfect, that time works.`,
        `Great, looking forward to it.`,
      ]),
    }
  }

  return {
    kind: 'reschedule',
    proposed_slots: [futureIso(3 + Math.floor(Math.random() * 4)), futureIso(5 + Math.floor(Math.random() * 4))],
    text: pick([
      `Those times don't quite work with my schedule — could we look at later in the week instead?`,
      `I have a conflict then. Do either of these work on your end instead?`,
      `Something came up for those slots. Here are a couple alternates that'd work for me.`,
    ]),
  }
}
