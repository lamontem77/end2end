import { Router } from 'express'
import { getFreeBusy, createEvent } from '../integrations/calendar.js'

export const calendarRouter = Router()

// GET /v1/calendar/freebusy?user_id=u-devon&days=5
calendarRouter.get('/freebusy', (req, res) => {
  const userId = req.query.user_id as string
  const days = Math.min(Number(req.query.days) || 5, 14)
  if (!userId) return res.status(422).json({ error: 'user_id is required' })
  const slots = getFreeBusy(userId, new Date(), days)
  res.json({ user_id: userId, busy: slots })
})

calendarRouter.post('/events', (req, res) => {
  const { organizer, attendees, start, end } = req.body ?? {}
  if (!organizer || !Array.isArray(attendees) || !start || !end) {
    return res.status(422).json({ error: 'organizer, attendees[], start, and end are required' })
  }
  const event = createEvent({ organizer, attendees, start, end })
  res.status(201).json(event)
})
