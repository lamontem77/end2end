import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  seedAttendees, seedInteractions, mainEvent, plannedEvent,
} from '../data/eventloop'
import type { EventAttendee, Interaction, RecruitingEvent } from '../data/eventloop'

interface EventLoopStore {
  events: RecruitingEvent[]
  attendees: EventAttendee[]
  interactions: Interaction[]
  selectedAttendeeId: string | null
  activeEventId: string

  setSelectedAttendee: (id: string | null) => void
  setActiveEvent: (id: string) => void
  checkIn: (attendeeId: string) => void
  addInteraction: (interaction: Interaction) => void
  moveToAts: (attendeeId: string, role: string, stage: string) => void
  updateFollowUp: (interactionId: string, status: string) => void
  updateAttendeeInterest: (attendeeId: string, interest: EventAttendee['recruitingInterest']) => void
  resetToSeed: () => void
}

const seedState = () => ({
  events: [mainEvent, plannedEvent],
  attendees: seedAttendees.map((a) => ({ ...a })),
  interactions: seedInteractions.map((i) => ({ ...i })),
  selectedAttendeeId: null,
  activeEventId: 'evt-001',
})

export const useEventLoopStore = create<EventLoopStore>()(
  persist(
    (set) => ({
      ...seedState(),

      setSelectedAttendee: (id) => set({ selectedAttendeeId: id }),
      setActiveEvent: (id) => set({ activeEventId: id }),

      checkIn: (attendeeId) =>
        set((state) => {
          const now = new Date()
          const hours = now.getHours()
          const mins = now.getMinutes().toString().padStart(2, '0')
          const ampm = hours >= 12 ? 'PM' : 'AM'
          const h12 = hours % 12 || 12
          const time = `${h12}:${mins} ${ampm}`
          return {
            attendees: state.attendees.map((a) =>
              a.id === attendeeId
                ? { ...a, attendanceStatus: 'Checked In', checkInTime: time, rsvpStatus: 'Yes' }
                : a
            ),
          }
        }),

      addInteraction: (interaction) =>
        set((state) => {
          const updated = state.attendees.map((a) => {
            if (a.id !== interaction.attendeeId) return a
            const journey = [...a.journey]
            if (!journey.includes('Attended')) journey.push('Attended')
            if (interaction.engagement === 'Strong' && !journey.includes('High Engagement'))
              journey.push('High Engagement')
            return {
              ...a,
              engagement:
                interaction.engagement === 'Strong' ? 'High'
                : interaction.engagement === 'Good' ? 'Medium'
                : 'Low',
              recruitingInterest: interaction.recruitingInterest,
              talentSignal: interaction.talentSignal === 'Strong Potential' ? 'Strong Potential'
                : interaction.talentSignal === 'Worth Nurturing' ? 'Worth Nurturing'
                : interaction.talentSignal === 'Not Enough Information' ? 'Not Enough Info'
                : 'Not Relevant',
              journey,
            }
          })
          return { interactions: [...state.interactions, interaction], attendees: updated }
        }),

      moveToAts: (attendeeId, role, stage) =>
        set((state) => ({
          attendees: state.attendees.map((a) => {
            if (a.id !== attendeeId) return a
            const journey = [...a.journey]
            if (!journey.includes('Follow-Up')) journey.push('Follow-Up')
            const roleLabel = role === 'fde' ? 'FDE Process' : 'Infra Process'
            if (!journey.includes(roleLabel)) journey.push(roleLabel)
            return { ...a, pipelineStage: stage, atsStage: stage, eventSource: a.eventSource || 'Sourced', journey }
          }),
        })),

      updateFollowUp: (interactionId, status) =>
        set((state) => ({
          interactions: state.interactions.map((i) =>
            i.id === interactionId ? { ...i, followUpStatus: status } : i
          ),
        })),

      updateAttendeeInterest: (attendeeId, interest) =>
        set((state) => ({
          attendees: state.attendees.map((a) =>
            a.id === attendeeId ? { ...a, recruitingInterest: interest } : a
          ),
        })),

      resetToSeed: () => set(seedState()),
    }),
    {
      name: 'eventloop-store-v1',
      partialize: (state) => ({
        attendees: state.attendees,
        interactions: state.interactions,
        events: state.events,
        activeEventId: state.activeEventId,
      }),
    }
  )
)
