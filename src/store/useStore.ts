import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from '../lib/id'
import { CURRENT_USER_ID, SEED_CANDIDATES, SEED_NEW_HIRE_TRACKERS, USERS } from '../data/seed'
import type {
  ActivityEvent,
  ActivityEventType,
  AgentActionType,
  AgentDraft,
  AppEvent,
  AppNotification,
  Candidate,
  ChatMessage,
  InterviewRound,
  NewHireTracker,
  RoundDecision,
  Scorecard,
  Stage,
  SubTicket,
  User,
} from '../types'
import { agentTriggerFor, assigneeRoleFor, slaDeadlineFor, STAGES } from '../lib/stageEngine'
import { generateDraftContent } from '../lib/agent'
import { parseIntent } from '../lib/botIntent'
import { statusLine } from '../lib/statusLine'

interface PendingCandidateAction {
  kind: 'availability_reply' | 'self_schedule_pick'
  roundLabel: string
  interviewerId: string
  nextStage: Stage
}

interface AppState {
  users: User[]
  currentUserId: string
  candidates: Candidate[]
  agentDrafts: AgentDraft[]
  newHireTrackers: Record<string, NewHireTracker>
  notifications: AppNotification[]
  pendingCandidateActions: Record<string, PendingCandidateAction>
  chatMessages: ChatMessage[]
  events: AppEvent[]
  selectedCandidateId: string | null
  commandPaletteOpen: boolean

  setSelectedCandidate: (id: string | null) => void
  setCommandPaletteOpen: (open: boolean) => void
  currentUser: () => User
  userById: (id: string) => User | undefined
  candidateById: (id: string) => Candidate | undefined

  moveToStage: (candidateId: string, stage: Stage, actor?: string) => void
  rejectCandidate: (candidateId: string) => void
  addNote: (candidateId: string, content: string) => void

  requestScheduling: (candidateId: string, mode: 'manual' | 'self_schedule') => void
  simulateCandidateReply: (candidateId: string) => void
  simulateAssessmentComplete: (candidateId: string) => void
  simulateCandidateSignsOffer: (candidateId: string) => void

  createAgentDraft: (candidateId: string, type: AgentActionType, extra?: Record<string, string>) => void
  approveDraft: (draftId: string, editedBody?: string) => void
  declineDraft: (draftId: string, reason: string) => void

  submitScorecard: (
    candidateId: string,
    roundId: string,
    recommendation: 'strong_yes' | 'yes' | 'no' | 'strong_no',
    notes: string,
  ) => void
  submitInterviewerFeedback: (
    candidateId: string,
    roundId: string,
    recommendation: 'strong_yes' | 'yes' | 'no' | 'strong_no',
    notes: string,
  ) => void
  decideRound: (candidateId: string, roundId: string, decision: RoundDecision) => void
  nudgeCandidate: (candidateId: string, roundId: string) => void
  hmDecision: (candidateId: string, decision: 'advance' | 'reject') => void
  hmApproveOffer: (candidateId: string) => void

  createNewHireTrackerFor: (candidateId: string) => void
  checkReadyToStart: (candidateId: string) => void
  initiateBGC: (candidateId: string) => void
  updateBGCResult: (candidateId: string, result: 'clear' | 'flagged' | 'failed') => void
  initiateDrugTest: (candidateId: string) => void
  updateDrugTestResult: (candidateId: string, result: 'negative' | 'positive' | 'inconclusive') => void
  markTechSetup: (candidateId: string, status: 'in_progress' | 'complete') => void

  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  sendChatMessage: (text: string) => void

  resetDemoData: () => void
}

function logEvent(type: ActivityEventType, label: string, actor = 'System'): ActivityEvent {
  return { id: nanoid(), type, label, actor, timestamp: new Date().toISOString() }
}

function pickAssignee(candidate: Candidate, stage: Stage): string {
  const role = assigneeRoleFor(stage)
  if (role === 'recruiter') return candidate.recruiterId
  if (role === 'rc') return candidate.rcId
  if (role === 'hiring_manager') return candidate.hiringManagerId
  if (role === 'interviewer') {
    const latest = candidate.interviewRounds[candidate.interviewRounds.length - 1]
    return latest?.interviewers[0]?.interviewerId ?? candidate.currentAssigneeId
  }
  if (role === 'it') return 'u-sam'
  return candidate.currentAssigneeId
}

function newSubTicket(type: SubTicket['type'], assignee: string, isHardGate: boolean): SubTicket {
  return { id: nanoid(), type, status: 'not_started', assignee, isHardGate }
}

function draftTitle(type: AgentActionType, candidate: Candidate): string {
  const map: Record<AgentActionType, string> = {
    availability_request: `Availability request — ${candidate.name}`,
    schedule_invite: `Interview invite — ${candidate.name}`,
    self_schedule: `Self-schedule link — ${candidate.name}`,
    assessment_send: `Assessment send — ${candidate.name}`,
    assessment_reminder: `Assessment reminder — ${candidate.name}`,
    offer_letter: `Offer letter — ${candidate.name}`,
    offer_send: `Offer send (e-sign) — ${candidate.name}`,
    rejection_email: `Rejection email — ${candidate.name}`,
    interview_prep: `Interview prep — ${candidate.name}`,
    interviewer_nudge: `Interviewer nudge — ${candidate.name}`,
    bgc_initiation: `BGC initiation — ${candidate.name}`,
    drug_test_order: `Drug test order — ${candidate.name}`,
    start_date_confirmation: `Start date confirmation — ${candidate.name}`,
    offer_confirmation: `Offer confirmation — ${candidate.name}`,
  }
  return map[type]
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: USERS,
      currentUserId: CURRENT_USER_ID,
      candidates: SEED_CANDIDATES,
      agentDrafts: [],
      newHireTrackers: SEED_NEW_HIRE_TRACKERS,
      notifications: [],
      pendingCandidateActions: {},
      chatMessages: [],
      events: [],
      selectedCandidateId: null,
      commandPaletteOpen: false,

      setSelectedCandidate: (id) => set({ selectedCandidateId: id }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      currentUser: () => get().users.find((u) => u.id === get().currentUserId)!,
      userById: (id) => get().users.find((u) => u.id === id),
      candidateById: (id) => get().candidates.find((c) => c.id === id),

      moveToStage: (candidateId, stage, actor = 'System') => {
        const candidate = get().candidateById(candidateId)
        if (!candidate) return
        const assignee = pickAssignee(candidate, stage)
        const assigneeUser = get().userById(assignee)
        const entered = new Date()
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  currentStage: stage,
                  currentAssigneeId: assignee,
                  stageEnteredAt: entered.toISOString(),
                  slaDeadline: slaDeadlineFor(stage, entered),
                  updatedAt: entered.toISOString(),
                  activityLog: [
                    ...c.activityLog,
                    logEvent('stage_change', `Advanced to ${stage}`, actor),
                    logEvent('assignment_change', `Assigned to ${assigneeUser?.name ?? assignee}`, actor),
                  ],
                }
              : c,
          ),
          notifications: [
            ...s.notifications,
            {
              id: nanoid(),
              userId: assignee,
              title: `${candidate.name} moved to ${stage}`,
              body: 'You are now the owner for this stage.',
              candidateId,
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }))

        if (stage === 'Offer Accepted') get().createNewHireTrackerFor(candidateId)
        const trigger = agentTriggerFor(stage)
        if (trigger) get().createAgentDraft(candidateId, trigger)
      },

      rejectCandidate: (candidateId) => {
        const actor = get().currentUser().name
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === candidateId
              ? { ...c, tags: [...new Set([...c.tags, 'Rejected'])], activityLog: [...c.activityLog, logEvent('stage_change', 'Marked as rejected', actor)] }
              : c,
          ),
        }))
        get().createAgentDraft(candidateId, 'rejection_email')
      },

      addNote: (candidateId, content) => {
        const author = get().currentUser().name
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  notes: [...c.notes, { id: nanoid(), author, content, createdAt: new Date().toISOString() }],
                  activityLog: [...c.activityLog, logEvent('note_added', 'Note added', author)],
                }
              : c,
          ),
        }))
      },

      requestScheduling: (candidateId, mode) => {
        const candidate = get().candidateById(candidateId)
        if (!candidate) return
        const isFirstRound = candidate.currentStage === 'Screening Scheduled'
        const roundLabel = isFirstRound ? 'Phone Screen' : `Round ${candidate.interviewRounds.length + 1}`
        const interviewerId = candidate.interviewRounds[candidate.interviewRounds.length - 1]?.interviewers[0]?.interviewerId ?? 'u-devon'
        const nextStage: Stage = isFirstRound ? 'Phone Screen' : 'Round N In Progress'
        get().createAgentDraft(candidateId, mode === 'self_schedule' ? 'self_schedule' : 'availability_request', {
          roundLabel,
          interviewerId,
          nextStage,
        })
      },

      simulateCandidateReply: (candidateId) => {
        const pending = get().pendingCandidateActions[candidateId]
        const candidate = get().candidateById(candidateId)
        if (!pending || !candidate) return
        set((s) => {
          const rest = { ...s.pendingCandidateActions }
          delete rest[candidateId]
          return { pendingCandidateActions: rest }
        })
        get().createAgentDraft(candidateId, 'schedule_invite', {
          roundLabel: pending.roundLabel,
          interviewerId: pending.interviewerId,
          nextStage: pending.nextStage,
          when: 'Thu, 2:00 PM PT',
          webex: `https://webex.example.com/meet/${candidate.id}-${pending.roundLabel.replace(/\s+/g, '-').toLowerCase()}`,
          hackerrank: 'SWE II Take-Home (reference)',
          feedbackForm: 'Standard scorecard',
        })
      },

      simulateAssessmentComplete: (candidateId) => {
        set((s) => ({
          candidates: s.candidates.map((c) => (c.id === candidateId ? { ...c, assessmentStatus: 'completed' } : c)),
        }))
        get().moveToStage(candidateId, 'Assessment Review', 'System')
      },

      simulateCandidateSignsOffer: (candidateId) => {
        get().moveToStage(candidateId, 'Offer Accepted', 'System')
      },

      createAgentDraft: (candidateId, type, extra = {}) => {
        const state = get()
        const candidate = state.candidateById(candidateId)
        if (!candidate) return
        const recruiter = state.userById(candidate.recruiterId)!
        const rc = state.userById(candidate.rcId)!
        const hiringManager = state.userById(candidate.hiringManagerId)
        const interviewer = extra.interviewerId ? state.userById(extra.interviewerId) : undefined
        const sentByRecruiter = type === 'offer_letter' || type === 'rejection_email'
        const approverRole: User['role'] = sentByRecruiter
          ? 'recruiter'
          : type === 'interviewer_nudge'
            ? 'ta_lead'
            : type === 'start_date_confirmation'
              ? 'hr'
              : 'rc'

        generateDraftContent(type, { candidate, recruiter, rc, interviewer, hiringManager, extra }).then(({ subject, body, internalBody }) => {
          const draft: AgentDraft = {
            id: nanoid(),
            candidateId,
            candidateName: candidate.name,
            type,
            title: draftTitle(type, candidate),
            subject,
            content: body,
            recipients: [candidate.email],
            // The email is signed by whichever role sends it (recruiter for
            // offer/rejection, RC otherwise) — CC the other one, not yourself.
            ccRecipients: [sentByRecruiter ? rc.email : recruiter.email],
            meta: extra,
            status: 'pending',
            createdAt: new Date().toISOString(),
            approverRole,
            internalPreview: internalBody,
            externalPreview: internalBody ? body : undefined,
          }
          set((s) => ({
            agentDrafts: [...s.agentDrafts, draft],
            candidates: s.candidates.map((c) =>
              c.id === candidateId ? { ...c, activityLog: [...c.activityLog, logEvent('agent_draft_created', `Agent drafted: ${draft.title}`, 'Agent')] } : c,
            ),
            notifications: [
              ...s.notifications,
              {
                id: nanoid(),
                userId: candidate.rcId,
                title: `Draft ready: ${draft.title}`,
                body: 'Review in your Approvals Queue.',
                candidateId,
                read: false,
                createdAt: new Date().toISOString(),
              },
            ],
          }))
        })
      },

      approveDraft: (draftId, editedBody) => {
        const draft = get().agentDrafts.find((d) => d.id === draftId)
        if (!draft) return
        const candidate = get().candidateById(draft.candidateId)
        if (!candidate) return
        const approver = get().currentUser()
        const finalBody = editedBody ?? draft.content

        set((s) => ({
          agentDrafts: s.agentDrafts.map((d) =>
            d.id === draftId ? { ...d, status: 'sent', content: finalBody, approvedBy: approver.name, approvedAt: new Date().toISOString() } : d,
          ),
          candidates: s.candidates.map((c) =>
            c.id === candidate.id
              ? {
                  ...c,
                  activityLog: [
                    ...c.activityLog,
                    logEvent('agent_draft_approved', `${approver.name} approved + sent: ${draft.title}`, approver.name),
                    logEvent('email_sent', `Email sent: ${draft.subject ?? draft.title}`, 'Agent'),
                  ],
                }
              : c,
          ),
          notifications: [
            ...s.notifications,
            {
              id: nanoid(),
              userId: candidate.recruiterId,
              title: `Sent: ${draft.title}`,
              body: `${approver.name} approved and sent this to ${candidate.name}.`,
              candidateId: candidate.id,
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }))

        const meta = draft.meta
        switch (draft.type) {
          case 'availability_request':
            set((s) => ({
              pendingCandidateActions: {
                ...s.pendingCandidateActions,
                [candidate.id]: { kind: 'availability_reply', roundLabel: meta.roundLabel, interviewerId: meta.interviewerId, nextStage: meta.nextStage as Stage },
              },
            }))
            break
          case 'self_schedule':
            set((s) => ({
              pendingCandidateActions: {
                ...s.pendingCandidateActions,
                [candidate.id]: { kind: 'self_schedule_pick', roundLabel: meta.roundLabel, interviewerId: meta.interviewerId, nextStage: meta.nextStage as Stage },
              },
            }))
            break
          case 'schedule_invite': {
            const roundNum = candidate.interviewRounds.length + 1
            const interviewerName = get().userById(meta.interviewerId)?.name ?? 'Interviewer'
            const now = new Date().toISOString()
            const round: InterviewRound = {
              id: nanoid(),
              roundNumber: roundNum,
              interviewers: [{ interviewerId: meta.interviewerId, interviewerName, status: 'pending' }],
              subStatus: 'scheduled',
              format: 'virtual',
              webexLink: meta.webex,
              createdAt: now,
              requestSentAt: now,
              scheduledAt: meta.when,
            }
            set((s) => ({
              candidates: s.candidates.map((c) => (c.id === candidate.id ? { ...c, interviewRounds: [...c.interviewRounds, round] } : c)),
            }))
            get().moveToStage(candidate.id, meta.nextStage as Stage, 'Agent')
            break
          }
          case 'assessment_send':
            set((s) => ({ candidates: s.candidates.map((c) => (c.id === candidate.id ? { ...c, assessmentStatus: 'sent' } : c)) }))
            get().moveToStage(candidate.id, 'Assessment Pending', 'Agent')
            break
          case 'offer_letter':
            set((s) => ({
              candidates: s.candidates.map((c) =>
                c.id === candidate.id ? { ...c, offerDetails: { status: 'drafted', compensation: meta.compensation, startDate: meta.startDate } } : c,
              ),
            }))
            get().moveToStage(candidate.id, 'Offer Pending Approval', 'Agent')
            break
          case 'offer_send':
            set((s) => ({
              candidates: s.candidates.map((c) => (c.id === candidate.id && c.offerDetails ? { ...c, offerDetails: { ...c.offerDetails, status: 'extended' } } : c)),
            }))
            break
          default:
            break
        }
      },

      declineDraft: (draftId, reason) => {
        set((s) => ({ agentDrafts: s.agentDrafts.map((d) => (d.id === draftId ? { ...d, status: 'declined', declinedReason: reason } : d)) }))
        const draft = get().agentDrafts.find((d) => d.id === draftId)
        if (!draft) return
        const actor = get().currentUser().name
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === draft.candidateId
              ? { ...c, activityLog: [...c.activityLog, logEvent('agent_draft_declined', `Draft declined: ${draft.title} (${reason})`, actor)] }
              : c,
          ),
        }))
      },

      submitScorecard: (candidateId, roundId, recommendation, notes) => {
        const candidate = get().candidateById(candidateId)
        if (!candidate) return
        const submitter = get().currentUser()
        const submittedAt = new Date().toISOString()
        const scorecard: Scorecard = { id: nanoid(), roundId, interviewerId: submitter.id, submittedBy: submitter.name, submittedAt, recommendation, notes }
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  scorecards: [...c.scorecards, scorecard],
                  interviewRounds: c.interviewRounds.map((r) => {
                    if (r.id !== roundId) return r
                    const pending = r.interviewers.find((i) => i.status === 'pending')
                    const updatedInterviewers = r.interviewers.map((i) =>
                      i.interviewerId === (pending?.interviewerId ?? '') ? { ...i, status: 'submitted' as const, submittedAt } : i,
                    )
                    const allSubmitted = updatedInterviewers.every((i) => i.status === 'submitted')
                    return { ...r, interviewers: updatedInterviewers, subStatus: allSubmitted ? ('feedback_complete' as const) : r.subStatus, feedbackCompletedAt: allSubmitted ? submittedAt : r.feedbackCompletedAt }
                  }),
                  activityLog: [...c.activityLog, logEvent('scorecard_submitted', `Scorecard submitted by ${submitter.name}`, submitter.name)],
                }
              : c,
          ),
        }))
        if (candidate.currentStage === 'Phone Screen' || candidate.currentStage === 'Pending Feedback') {
          get().moveToStage(candidateId, 'Debrief / Decision', submitter.name)
        }
      },

      submitInterviewerFeedback: (candidateId, roundId, recommendation, notes) => {
        const candidate = get().candidateById(candidateId)
        if (!candidate) return
        const submitter = get().currentUser()
        const submittedAt = new Date().toISOString()
        set((s) => ({
          candidates: s.candidates.map((c) => {
            if (c.id !== candidateId) return c
            const updatedRounds = c.interviewRounds.map((r) => {
              if (r.id !== roundId) return r
              const target = r.interviewers.find((i) => i.interviewerId === submitter.id) ?? r.interviewers.find((i) => i.status === 'pending')
              const updatedInterviewers = r.interviewers.map((i) => (i.interviewerId === target?.interviewerId ? { ...i, status: 'submitted' as const, submittedAt } : i))
              const allSubmitted = updatedInterviewers.every((i) => i.status === 'submitted')
              return { ...r, interviewers: updatedInterviewers, subStatus: allSubmitted ? ('feedback_complete' as const) : r.subStatus, feedbackCompletedAt: allSubmitted ? submittedAt : r.feedbackCompletedAt }
            })
            const scorecard: Scorecard = {
              id: nanoid(),
              roundId,
              interviewerId: submitter.id,
              submittedBy: submitter.name,
              submittedAt,
              recommendation,
              notes,
            }
            const event = logEvent('scorecard_submitted', `Feedback submitted by ${submitter.name}`, submitter.name)
            return { ...c, interviewRounds: updatedRounds, scorecards: [...c.scorecards, scorecard], activityLog: [...c.activityLog, event] }
          }),
          events: [...s.events, { ...logEvent('scorecard_submitted', `Feedback submitted by ${submitter.name}`, submitter.name), candidateId }],
        }))
      },

      decideRound: (candidateId, roundId, decision) => {
        const actor = get().currentUser().name
        const roundCompletedAt = new Date().toISOString()
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  interviewRounds: c.interviewRounds.map((r) => (r.id === roundId ? { ...r, decision, roundCompletedAt } : r)),
                  activityLog: [...c.activityLog, logEvent('decision_recorded', `Round decision: ${decision}`, actor)],
                }
              : c,
          ),
          events: [...s.events, { ...logEvent('decision_recorded', `Round decision: ${decision}`, actor), candidateId }],
        }))
        if (decision === 'advance') {
          get().moveToStage(candidateId, 'Round N Scheduling', actor)
        } else if (decision === 'reject') {
          get().rejectCandidate(candidateId)
        }
      },

      nudgeCandidate: (candidateId, roundId) => {
        const actor = get().currentUser().name
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, activityLog: [...c.activityLog, logEvent('candidate_nudged', 'Candidate nudged for availability', actor)] } : c,
          ),
          events: [...s.events, { ...logEvent('candidate_nudged', 'Candidate nudged for availability', actor), candidateId }],
        }))
        get().createAgentDraft(candidateId, 'availability_request', { roundId })
      },

      hmDecision: (candidateId, decision) => {
        if (decision === 'reject') {
          get().rejectCandidate(candidateId)
          return
        }
        get().moveToStage(candidateId, 'Offer Prep', get().currentUser().name)
      },

      hmApproveOffer: (candidateId) => {
        get().moveToStage(candidateId, 'Offer Extended', get().currentUser().name)
      },

      createNewHireTrackerFor: (candidateId) => {
        const state = get()
        const candidate = state.candidateById(candidateId)
        if (!candidate || state.newHireTrackers[candidateId]) return
        const startDate = candidate.offerDetails?.startDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const tracker: NewHireTracker = {
          candidateId,
          startDate,
          offerLetter: { ...newSubTicket('offer_letter', candidate.rcId, true), status: 'complete', completedAt: new Date().toISOString() },
          backgroundCheck: newSubTicket('bgc', candidate.rcId, true),
          drugTest: newSubTicket('drug_test', candidate.rcId, true),
          techSetup: newSubTicket('tech_setup', 'u-sam', false),
          readyToStart: false,
        }
        set((s) => ({
          newHireTrackers: { ...s.newHireTrackers, [candidateId]: tracker },
          notifications: [
            ...s.notifications,
            {
              id: nanoid(),
              userId: 'u-sam',
              title: `Tech Setup assigned: ${candidate.name}`,
              body: 'New hire graduated — set up their equipment.',
              candidateId,
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        get().createAgentDraft(candidateId, 'offer_confirmation', { startDate })
      },

      checkReadyToStart: (candidateId) => {
        const tracker = get().newHireTrackers[candidateId]
        if (!tracker) return
        const allDone =
          tracker.offerLetter.status === 'complete' &&
          tracker.backgroundCheck.status === 'clear' &&
          tracker.drugTest.status === 'clear' &&
          tracker.techSetup.status === 'complete'
        if (allDone && !tracker.readyToStart) {
          const candidate = get().candidateById(candidateId)
          set((s) => ({
            newHireTrackers: { ...s.newHireTrackers, [candidateId]: { ...tracker, readyToStart: true } },
            notifications: [
              ...s.notifications,
              {
                id: nanoid(),
                userId: candidate?.rcId ?? '',
                title: `${candidate?.name} is Ready to Start`,
                body: 'All pre-checks complete.',
                candidateId,
                read: false,
                createdAt: new Date().toISOString(),
              },
            ],
          }))
        }
      },

      initiateBGC: (candidateId) => {
        const tracker = get().newHireTrackers[candidateId]
        if (!tracker) return
        const actor = get().currentUser().name
        set((s) => ({
          newHireTrackers: { ...s.newHireTrackers, [candidateId]: { ...tracker, backgroundCheck: { ...tracker.backgroundCheck, status: 'pending' } } },
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, activityLog: [...c.activityLog, logEvent('bgc_dt_initiated', 'Background check initiated (Checkr)', actor)] } : c,
          ),
        }))
      },

      updateBGCResult: (candidateId, result) => {
        const tracker = get().newHireTrackers[candidateId]
        if (!tracker) return
        const status = result === 'clear' ? 'clear' : result === 'flagged' ? 'flagged' : 'failed'
        const actor = get().currentUser().name
        set((s) => ({
          newHireTrackers: { ...s.newHireTrackers, [candidateId]: { ...tracker, backgroundCheck: { ...tracker.backgroundCheck, status, result, completedAt: new Date().toISOString() } } },
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, activityLog: [...c.activityLog, logEvent('bgc_dt_result', `BGC result: ${result}`, actor)] } : c,
          ),
        }))
        get().checkReadyToStart(candidateId)
      },

      initiateDrugTest: (candidateId) => {
        const tracker = get().newHireTrackers[candidateId]
        if (!tracker) return
        const actor = get().currentUser().name
        set((s) => ({
          newHireTrackers: { ...s.newHireTrackers, [candidateId]: { ...tracker, drugTest: { ...tracker.drugTest, status: 'pending' } } },
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, activityLog: [...c.activityLog, logEvent('bgc_dt_initiated', 'Drug test ordered (Quest Diagnostics)', actor)] } : c,
          ),
        }))
      },

      updateDrugTestResult: (candidateId, result) => {
        const tracker = get().newHireTrackers[candidateId]
        if (!tracker) return
        const status = result === 'negative' ? 'clear' : result === 'positive' ? 'failed' : 'pending'
        const actor = get().currentUser().name
        set((s) => ({
          newHireTrackers: { ...s.newHireTrackers, [candidateId]: { ...tracker, drugTest: { ...tracker.drugTest, status, result, completedAt: new Date().toISOString() } } },
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, activityLog: [...c.activityLog, logEvent('bgc_dt_result', `Drug test result: ${result}`, actor)] } : c,
          ),
        }))
        get().checkReadyToStart(candidateId)
      },

      markTechSetup: (candidateId, status) => {
        const tracker = get().newHireTrackers[candidateId]
        if (!tracker) return
        const actor = get().currentUser().name
        set((s) => ({
          newHireTrackers: {
            ...s.newHireTrackers,
            [candidateId]: { ...tracker, techSetup: { ...tracker.techSetup, status, completedAt: status === 'complete' ? new Date().toISOString() : undefined } },
          },
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, activityLog: [...c.activityLog, logEvent('sub_ticket_change', `Tech Setup: ${status.replace('_', ' ')}`, actor)] } : c,
          ),
        }))
        get().checkReadyToStart(candidateId)
      },

      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      sendChatMessage: (text) => {
        const state = get()
        const userMsg: ChatMessage = { id: nanoid(), role: 'user', text, createdAt: new Date().toISOString() }
        set((s) => ({ chatMessages: [...s.chatMessages, userMsg] }))

        const intent = parseIntent(text, state.candidates)
        let reply: string
        let candidateId: string | undefined

        switch (intent.type) {
          case 'schedule': {
            candidateId = intent.candidate.id
            get().requestScheduling(intent.candidate.id, intent.mode)
            reply =
              intent.mode === 'self_schedule'
                ? `Done — I've drafted a self-scheduling link for ${intent.candidate.name}. It's waiting for your approval in My Queue → Approvals.`
                : `Done — I've drafted an availability request for ${intent.candidate.name}. It's waiting for your approval in My Queue → Approvals.`
            break
          }
          case 'send_assessment': {
            candidateId = intent.candidate.id
            get().createAgentDraft(intent.candidate.id, 'assessment_send')
            reply = `Drafted the assessment email for ${intent.candidate.name} — approve it in My Queue → Approvals.`
            break
          }
          case 'nudge_interviewer': {
            candidateId = intent.candidate.id
            const round = intent.candidate.interviewRounds[intent.candidate.interviewRounds.length - 1]
            if (!round) {
              reply = `${intent.candidate.name} doesn't have an interview on file yet, so there's no one to nudge.`
            } else {
              const pending = round.interviewers.find((i) => i.status === 'pending') ?? round.interviewers[0]
              get().createAgentDraft(intent.candidate.id, 'interviewer_nudge', { interviewerId: pending?.interviewerId ?? '' })
              reply = `Drafted a nudge for ${pending?.interviewerName ?? 'the interviewer'} to submit their scorecard on ${intent.candidate.name} — approve it in My Queue → Approvals.`
            }
            break
          }
          case 'status': {
            candidateId = intent.candidate.id
            const sl = statusLine(intent.candidate, state.users)
            reply = sl.text
            break
          }
          case 'ambiguous':
            reply = `I found a few matches for "${intent.raw}": ${intent.matches.map((m) => m.name).join(', ')} — could you use their full name?`
            break
          case 'not_found':
            reply = `I couldn't find a candidate matching "${intent.raw}". Try their full name?`
            break
          case 'unrecognized':
            reply = `I can help with: scheduling interviews ("schedule an interview with Jordan Rivera"), self-schedule links, sending assessments, nudging interviewers for feedback, and status checks ("what's the status of Jordan Rivera").`
            break
        }

        const botMsg: ChatMessage = { id: nanoid(), role: 'bot', text: reply, candidateId, createdAt: new Date().toISOString() }
        set((s) => ({ chatMessages: [...s.chatMessages, botMsg] }))
      },

      resetDemoData: () =>
        set({
          candidates: SEED_CANDIDATES,
          agentDrafts: [],
          newHireTrackers: SEED_NEW_HIRE_TRACKERS,
          notifications: [],
          pendingCandidateActions: {},
          chatMessages: [],
          events: [],
          selectedCandidateId: null,
        }),
    }),
    {
      name: 'recruiteros-demo-store-v1',
      partialize: (s) => ({
        candidates: s.candidates,
        agentDrafts: s.agentDrafts,
        newHireTrackers: s.newHireTrackers,
        notifications: s.notifications,
        pendingCandidateActions: s.pendingCandidateActions,
        chatMessages: s.chatMessages,
        events: s.events,
        currentUserId: s.currentUserId,
      }),
    },
  ),
)

export const ALL_STAGES = STAGES
