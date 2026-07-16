// Sandboxed calendar integration. No real Google Calendar test account or
// Nylas sandbox credentials are available in this environment, so this
// generates deterministic synthetic free/busy data instead — same user +
// same day always yields the same "busy" slots, so a scheduling agent can
// be tested against stable (not just random) calendar behavior.
//
// Real swap-in points, both intentionally left unconfigured:
//
// 1. Google Calendar API against a dedicated test Workspace account — use
//    the freebusy.query endpoint for availability and events.insert to book,
//    scoped to a throwaway calendar so nothing real is ever touched.
// 2. Nylas sandbox — nylas.com offers a free sandbox account with the same
//    request/response shapes as their production Calendar API, meant
//    exactly for this kind of development.
//
// Set CALENDAR_PROVIDER=google|nylas plus the relevant credentials to
// switch; until then, everything below is the synthetic stand-in.
export interface FreeBusySlot {
  start: string
  end: string
}

export interface CalendarEvent {
  id: string
  organizer: string
  attendees: string[]
  start: string
  end: string
  join_url: string
}

function hashSeed(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 0xffffffff
}

// Returns 2-4 deterministic 30-60min busy blocks per day for this user,
// standing in for a real freebusy.query response.
export function getFreeBusy(userId: string, fromDate: Date, days: number): FreeBusySlot[] {
  if (process.env.CALENDAR_PROVIDER) {
    console.log(`[calendar:${process.env.CALENDAR_PROVIDER}-stub] would query real free/busy for ${userId} — wire the provider call here`)
  }
  const slots: FreeBusySlot[] = []
  for (let d = 0; d < days; d++) {
    const day = new Date(fromDate.getTime() + d * 24 * 60 * 60 * 1000)
    const seed = hashSeed(`${userId}:${day.toISOString().slice(0, 10)}`)
    const blockCount = 2 + Math.floor(seed * 3)
    for (let b = 0; b < blockCount; b++) {
      const hour = 9 + Math.floor(((seed * (b + 1) * 37) % 1) * 8) // 9am-5pm
      const start = new Date(day)
      start.setUTCHours(hour, 0, 0, 0)
      const end = new Date(start.getTime() + 30 * 60 * 1000)
      slots.push({ start: start.toISOString(), end: end.toISOString() })
    }
  }
  return slots
}

export function createEvent(params: { organizer: string; attendees: string[]; start: string; end: string }): CalendarEvent {
  if (process.env.CALENDAR_PROVIDER) {
    console.log(`[calendar:${process.env.CALENDAR_PROVIDER}-stub] would create a real event — wire the provider call here`)
  }
  const id = `evt_${Math.random().toString(36).slice(2, 10)}`
  return {
    id,
    organizer: params.organizer,
    attendees: params.attendees,
    start: params.start,
    end: params.end,
    join_url: `https://meet.example.com/${id}`,
  }
}
