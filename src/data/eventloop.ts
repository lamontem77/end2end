// EventLoop Mock Data

export type AttendeeTargetRole = 'FDE' | 'Infrastructure' | 'Product Designer' | 'Other'
export type Priority = 'A' | 'B' | 'C'
export type RSVPStatus = 'Yes' | 'No' | 'Pending'
export type AttendanceStatus = 'Checked In' | 'No Show' | 'Expected'
export type EngagementLevel = 'High' | 'Medium' | 'Low' | 'None'
export type RecruitingInterest = 'Interested' | 'Open' | 'Not Looking' | 'Unknown'
export type TalentSignalLabel = 'Strong Potential' | 'Worth Nurturing' | 'Not Enough Info' | 'Not Relevant'
export type EventSource = 'Sourced' | 'Influenced' | null

export interface TalentNeed {
  id: string
  role: string
  description: string
  hiringGoal: number
  qualifiedPipeline: number
  priority: 'Critical' | 'High' | 'Healthy'
  locations: string[]
  level: string
  targetCompanies: string[]
  traits: string[]
  talentPools: string[]
}

export interface Interaction {
  id: string
  attendeeId: string
  employeeId: string
  employeeName: string
  employeeRole: string
  conversationType: 'Technical' | 'Recruiting' | 'Founder' | 'General'
  engagement: 'Strong' | 'Good' | 'Light'
  talentSignal: 'Strong Potential' | 'Worth Nurturing' | 'Not Enough Information' | 'Not Relevant'
  recruitingInterest: 'Interested' | 'Open' | 'Not Looking' | 'Unknown'
  potentialRole: 'FDE' | 'Infrastructure' | 'Other' | 'Unknown'
  note: string
  followUp: boolean
  followUpOwner: string
  timestamp: string
}

export interface EventAttendee {
  id: string
  evtId: string
  name: string
  email: string
  company: string
  title: string
  targetRole: AttendeeTargetRole
  priority: Priority
  relationshipStatus: 'New' | 'Warm' | 'Known' | 'Referral'
  inviteStatus: 'Invited' | 'Not Invited'
  rsvpStatus: RSVPStatus
  attendanceStatus: AttendanceStatus
  checkInTime?: string
  engagement: EngagementLevel
  recruitingInterest: RecruitingInterest
  talentSignal: TalentSignalLabel
  pipelineStage: string | null
  journey: string[]
  eventSource: EventSource
  atsStage?: string
}

export interface RecruitingEvent {
  id: string
  name: string
  date: string
  location: string
  objective: string
  format: string
  targetRole: string
  targetLevel: string
  status: 'draft' | 'planned' | 'live' | 'completed'
  forecastInvited: number
  forecastRsvp: number
  forecastAttended: number
  forecastTargetTalent: number
  forecastQualified: number
  forecastProcessEntries: number
  actualInvited: number
  actualRsvp: number
  actualAttended: number
  actualTargetTalent: number
  actualQualified: number
  actualProcessEntries: number
  actualOnsites: number
  actualOffers: number
  actualHires: number
  cost: number
  attendeeIds: string[]
}

export interface HistoricalEvent {
  id: string
  name: string
  date: string
  format: string
  targetRole: string
  seniority: string
  audienceSize: number
  dayOfWeek: string
  timeSlot: string
  hostType: string
  contentType: string
  invited: number
  rsvp: number
  attended: number
  targetTalent: number
  qualified: number
  processEntries: number
  onsites: number
  offers: number
  hires: number
  cost: number
}

// ─── Talent Needs ─────────────────────────────────────────────────────────────

export const talentNeeds: TalentNeed[] = [
  {
    id: 'tn-fde',
    role: 'Forward Deployed Engineer',
    description: 'Customer-facing engineers who deploy and customize our product at enterprise clients',
    hiringGoal: 6,
    qualifiedPipeline: 2,
    priority: 'Critical',
    locations: ['NYC', 'SF', 'London'],
    level: 'Senior+',
    targetCompanies: ['Palantir', 'Stripe', 'Datadog', 'Twilio', 'Salesforce', 'Google'],
    traits: ['strong software engineer', 'customer-facing', 'high ownership', 'thrives in ambiguity', 'technically credible', 'product-minded'],
    talentPools: ['FDEs', 'Solutions Engineers who code', 'customer-facing SWEs', 'founding engineers', 'technical consultants'],
  },
  {
    id: 'tn-infra',
    role: 'Infrastructure Engineer',
    description: 'Platform and infrastructure engineers scaling our core systems',
    hiringGoal: 4,
    qualifiedPipeline: 2,
    priority: 'High',
    locations: ['NYC', 'SF', 'Remote'],
    level: 'Mid–Senior',
    targetCompanies: ['Cloudflare', 'Snowflake', 'Databricks', 'HashiCorp', 'MongoDB', 'AWS'],
    traits: ['systems thinking', 'distributed systems', 'ownership mindset', 'ops excellence'],
    talentPools: ['Platform engineers', 'DevOps/SRE who code', 'Cloud infrastructure specialists', 'Systems engineers'],
  },
  {
    id: 'tn-design',
    role: 'Product Designer',
    description: 'End-to-end product designers who own the full design process',
    hiringGoal: 2,
    qualifiedPipeline: 5,
    priority: 'Healthy',
    locations: ['NYC', 'Remote'],
    level: 'Senior',
    targetCompanies: ['Figma', 'Linear', 'Notion', 'Vercel', 'Loom', 'Airtable'],
    traits: ['systems thinker', 'strong craft', 'works cross-functionally', 'fast mover'],
    talentPools: ['Product designers', 'UX engineers', 'Design engineers'],
  },
]

// ─── Attendees ────────────────────────────────────────────────────────────────

export const seedAttendees: EventAttendee[] = [
  // Priority A – Direct targets
  {
    id: 'a1', evtId: 'evt_attendee_7f83k2',
    name: 'Sarah Chen', email: 'sarah.chen@stripe.com', company: 'Stripe', title: 'Staff Engineer',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Warm',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:37 PM',
    engagement: 'High', recruitingInterest: 'Interested', talentSignal: 'Strong Potential',
    pipelineStage: 'Recruiter Screen', journey: ['Invited', 'RSVP', 'Attended', 'High Engagement', 'Follow-Up', 'FDE Process'],
    eventSource: 'Sourced', atsStage: 'Recruiter Screen',
  },
  {
    id: 'a2', evtId: 'evt_attendee_4d92m7',
    name: 'Alex Rivera', email: 'alex.rivera@datadog.com', company: 'Datadog', title: 'Staff Engineer',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:41 PM',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'a3', evtId: 'evt_attendee_9c17p1',
    name: 'Maya Patel', email: 'maya.patel@palantir.com', company: 'Palantir', title: 'Senior FDE',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:52 PM',
    engagement: 'High', recruitingInterest: 'Open', talentSignal: 'Strong Potential',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended', 'High Engagement'],
    eventSource: 'Influenced',
  },
  {
    id: 'a4', evtId: 'evt_attendee_2b45r9',
    name: 'Jordan Kim', email: 'jordan.kim@google.com', company: 'Google', title: 'Senior SWE',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:04 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'a5', evtId: 'evt_attendee_5e38s4',
    name: 'Priya Mehta', email: 'priya.mehta@twilio.com', company: 'Twilio', title: 'Principal Engineer',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:29 PM',
    engagement: 'High', recruitingInterest: 'Interested', talentSignal: 'Strong Potential',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended', 'High Engagement'],
    eventSource: 'Sourced',
  },
  {
    id: 'a6', evtId: 'evt_attendee_8h61t3',
    name: 'Marcus Webb', email: 'marcus.webb@cloudflare.com', company: 'Cloudflare', title: 'Staff SRE',
    targetRole: 'Infrastructure', priority: 'A', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:55 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Strong Potential',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'a7', evtId: 'evt_attendee_3f29v6',
    name: 'Emily Zhang', email: 'emily.zhang@meta.com', company: 'Meta', title: 'Senior SWE',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Warm',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:12 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'a8', evtId: 'evt_attendee_6k44w8',
    name: 'Ryan O\'Brien', email: 'ryan.obrien@linear.app', company: 'Linear', title: 'Staff Engineer',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:48 PM',
    engagement: 'High', recruitingInterest: 'Interested', talentSignal: 'Strong Potential',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended', 'High Engagement'],
    eventSource: 'Sourced',
  },
  {
    id: 'a9', evtId: 'evt_attendee_1j57x2',
    name: 'Ava Santiago', email: 'ava.santiago@salesforce.com', company: 'Salesforce', title: 'Sr. Solutions Engineer',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:01 PM',
    engagement: 'Low', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'a10', evtId: 'evt_attendee_0m73y5',
    name: 'David Park', email: 'david.park@figma.com', company: 'Figma', title: 'Founding Engineer',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:38 PM',
    engagement: 'High', recruitingInterest: 'Open', talentSignal: 'Strong Potential',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended', 'High Engagement'],
    eventSource: 'Sourced',
  },
  {
    id: 'a11', evtId: 'evt_attendee_9p21z7',
    name: 'Sofia Andrade', email: 'sofia.andrade@palantir.com', company: 'Palantir', title: 'Senior FDE',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:44 PM',
    engagement: 'High', recruitingInterest: 'Interested', talentSignal: 'Strong Potential',
    pipelineStage: 'Recruiter Screen', journey: ['Invited', 'RSVP', 'Attended', 'High Engagement', 'Follow-Up'],
    eventSource: 'Influenced', atsStage: 'Recruiter Screen',
  },
  {
    id: 'a12', evtId: 'evt_attendee_4q85a3',
    name: 'James Liu', email: 'james.liu@snowflake.com', company: 'Snowflake', title: 'Staff Infrastructure Eng',
    targetRole: 'Infrastructure', priority: 'A', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:08 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'a13', evtId: 'evt_attendee_7r64b9',
    name: 'Natalie Ross', email: 'natalie.ross@retool.com', company: 'Retool', title: 'Principal SWE',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'Warm',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:31 PM',
    engagement: 'High', recruitingInterest: 'Interested', talentSignal: 'Strong Potential',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended', 'High Engagement'],
    eventSource: 'Sourced',
  },
  {
    id: 'a14', evtId: 'evt_attendee_2s48c6',
    name: 'Brandon Cooper', email: 'brandon.cooper@vercel.com', company: 'Vercel', title: 'Senior Engineer',
    targetRole: 'FDE', priority: 'A', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Expected',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP'],
    eventSource: null,
  },
  // Priority B – Adjacent targets
  {
    id: 'b1', evtId: 'evt_attendee_5t12d4',
    name: 'Lisa Wang', email: 'lisa.wang@hubspot.com', company: 'HubSpot', title: 'Senior Solutions Engineer',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:59 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b2', evtId: 'evt_attendee_8u90e1',
    name: 'Kevin Torres', email: 'kevin.torres@shopify.com', company: 'Shopify', title: 'Senior SWE',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:16 PM',
    engagement: 'Low', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b3', evtId: 'evt_attendee_3v77f8',
    name: 'Rachel Green', email: 'rachel.green@mongodb.com', company: 'MongoDB', title: 'Staff Engineer',
    targetRole: 'Infrastructure', priority: 'B', relationshipStatus: 'Warm',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:46 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b4', evtId: 'evt_attendee_6w43g5',
    name: 'Michael Brown', email: 'michael.brown@amazon.com', company: 'AWS', title: 'Sr. Technical Lead',
    targetRole: 'Infrastructure', priority: 'B', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:22 PM',
    engagement: 'Low', recruitingInterest: 'Not Looking', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b5', evtId: 'evt_attendee_1x19h2',
    name: 'Amanda Foster', email: 'amanda.foster@notion.so', company: 'Notion', title: 'Engineering Lead',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:34 PM',
    engagement: 'High', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended', 'Medium Engagement'],
    eventSource: null,
  },
  {
    id: 'b6', evtId: 'evt_attendee_4y86j9',
    name: 'Chris Martinez', email: 'chris.martinez@databricks.com', company: 'Databricks', title: 'Principal Engineer',
    targetRole: 'Infrastructure', priority: 'B', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Expected',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP'],
    eventSource: null,
  },
  {
    id: 'b7', evtId: 'evt_attendee_7z53k1',
    name: 'Jessica Taylor', email: 'jessica.taylor@figma.com', company: 'Figma', title: 'Senior SWE',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:00 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b8', evtId: 'evt_attendee_2a20l8',
    name: 'Daniel Anderson', email: 'daniel.anderson@github.com', company: 'GitHub', title: 'Staff Engineer',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'Warm',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'No Show',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP'],
    eventSource: null,
  },
  {
    id: 'b9', evtId: 'evt_attendee_5b97m5',
    name: 'Ashley White', email: 'ashley.white@twilio.com', company: 'Twilio', title: 'Technical Architect',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:51 PM',
    engagement: 'Low', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b10', evtId: 'evt_attendee_8c64n2',
    name: 'Will Jackson', email: 'will.jackson@stripe.com', company: 'Stripe', title: 'Sr. Platform Engineer',
    targetRole: 'Infrastructure', priority: 'B', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:39 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b11', evtId: 'evt_attendee_3d41o9',
    name: 'Nicole Harris', email: 'nicole.harris@anthropic.com', company: 'Anthropic', title: 'Senior SWE',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:18 PM',
    engagement: 'High', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended', 'Medium Engagement'],
    eventSource: null,
  },
  {
    id: 'b12', evtId: 'evt_attendee_6e08p6',
    name: 'Tyler Garcia', email: 'tyler.garcia@hashicorp.com', company: 'HashiCorp', title: 'Staff Engineer',
    targetRole: 'Infrastructure', priority: 'B', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'No Show',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP'],
    eventSource: null,
  },
  {
    id: 'b13', evtId: 'evt_attendee_1f75q3',
    name: 'Stephanie Lee', email: 'stephanie.lee@google.com', company: 'Google Cloud', title: 'Sr. Solutions Architect',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'Warm',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:56 PM',
    engagement: 'Low', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b14', evtId: 'evt_attendee_4g52r7',
    name: 'Eric Thomas', email: 'eric.thomas@scale.ai', company: 'Scale AI', title: 'Senior Engineer',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:07 PM',
    engagement: 'Medium', recruitingInterest: 'Open', talentSignal: 'Worth Nurturing',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'b15', evtId: 'evt_attendee_7h29s4',
    name: 'Lauren Chen', email: 'lauren.chen@vercel.com', company: 'Vercel', title: 'Staff Engineer',
    targetRole: 'FDE', priority: 'B', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'No', attendanceStatus: 'No Show',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited'],
    eventSource: null,
  },
  // Priority C – Community / referral
  {
    id: 'c1', evtId: 'evt_attendee_2i06t1',
    name: 'Robert Davis', email: 'robert.davis@rippling.com', company: 'Rippling', title: 'Engineering Manager',
    targetRole: 'Other', priority: 'C', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:25 PM',
    engagement: 'Low', recruitingInterest: 'Not Looking', talentSignal: 'Not Relevant',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'c2', evtId: 'evt_attendee_5j83u8',
    name: 'Jennifer Wilson', email: 'jennifer.wilson@robinhood.com', company: 'Robinhood', title: 'Tech Lead',
    targetRole: 'Other', priority: 'C', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'No Show',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP'],
    eventSource: null,
  },
  {
    id: 'c3', evtId: 'evt_attendee_8k60v5',
    name: 'Anthony Robinson', email: 'anthony.robinson@plaid.com', company: 'Plaid', title: 'Staff Engineer',
    targetRole: 'FDE', priority: 'C', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:42 PM',
    engagement: 'Low', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'c4', evtId: 'evt_attendee_3l37w2',
    name: 'Michelle Clark', email: 'michelle.clark@brex.com', company: 'Brex', title: 'Senior Engineer',
    targetRole: 'Other', priority: 'C', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:03 PM',
    engagement: 'Low', recruitingInterest: 'Not Looking', talentSignal: 'Not Relevant',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'c5', evtId: 'evt_attendee_6m14x9',
    name: 'Charles Lewis', email: 'charles.lewis@datadog.com', company: 'Datadog', title: 'Principal Engineer',
    targetRole: 'Infrastructure', priority: 'C', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:58 PM',
    engagement: 'Low', recruitingInterest: 'Not Looking', talentSignal: 'Not Relevant',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'c6', evtId: 'evt_attendee_1n81y6',
    name: 'Sara Walker', email: 'sara.walker@carta.com', company: 'Carta', title: 'Engineering Manager',
    targetRole: 'Other', priority: 'C', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Pending', attendanceStatus: 'Expected',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited'],
    eventSource: null,
  },
  {
    id: 'c7', evtId: 'evt_attendee_4o58z3',
    name: 'Christopher Hall', email: 'chris.hall@openai.com', company: 'OpenAI', title: 'Senior SWE',
    targetRole: 'FDE', priority: 'C', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'Pending', attendanceStatus: 'Expected',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited'],
    eventSource: null,
  },
  {
    id: 'c8', evtId: 'evt_attendee_7p35a7',
    name: 'Jessica Young', email: 'jessica.young@airtable.com', company: 'Airtable', title: 'Staff Engineer',
    targetRole: 'Other', priority: 'C', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'No Show',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP'],
    eventSource: null,
  },
  {
    id: 'c9', evtId: 'evt_attendee_2q02b4',
    name: 'Mark Allen', email: 'mark.allen@lattice.com', company: 'Lattice', title: 'Sr. Director Engineering',
    targetRole: 'Other', priority: 'C', relationshipStatus: 'Referral',
    inviteStatus: 'Invited', rsvpStatus: 'No', attendanceStatus: 'No Show',
    engagement: 'None', recruitingInterest: 'Unknown', talentSignal: 'Not Relevant',
    pipelineStage: null, journey: ['Invited'],
    eventSource: null,
  },
  {
    id: 'c10', evtId: 'evt_attendee_5r79c1',
    name: 'Nancy King', email: 'nancy.king@figma.com', company: 'Figma', title: 'Staff Engineer',
    targetRole: 'FDE', priority: 'C', relationshipStatus: 'Known',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '7:10 PM',
    engagement: 'Low', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
  {
    id: 'c11', evtId: 'evt_attendee_8s56d8',
    name: 'Kevin Wright', email: 'kevin.wright@checkr.com', company: 'Checkr', title: 'Principal SWE',
    targetRole: 'FDE', priority: 'C', relationshipStatus: 'New',
    inviteStatus: 'Invited', rsvpStatus: 'Yes', attendanceStatus: 'Checked In', checkInTime: '6:47 PM',
    engagement: 'Low', recruitingInterest: 'Unknown', talentSignal: 'Not Enough Info',
    pipelineStage: null, journey: ['Invited', 'RSVP', 'Attended'],
    eventSource: null,
  },
]

// ─── Seed Interactions ─────────────────────────────────────────────────────────

export const seedInteractions: Interaction[] = [
  {
    id: 'int-1', attendeeId: 'a1',
    employeeId: 'emp-kj', employeeName: 'KJ Shah', employeeRole: 'Cofounder',
    conversationType: 'Founder', engagement: 'Strong',
    talentSignal: 'Strong Potential', recruitingInterest: 'Interested',
    potentialRole: 'FDE', note: 'Deep product conversation. Sarah is exactly who we want — she solves problems end-to-end and has customer empathy. Strong hire signal.',
    followUp: true, followUpOwner: 'Luis Avila', timestamp: '7:15 PM',
  },
  {
    id: 'int-2', attendeeId: 'a1',
    employeeId: 'emp-luis', employeeName: 'Luis Avila', employeeRole: 'Technical Recruiter',
    conversationType: 'Recruiting', engagement: 'Strong',
    talentSignal: 'Strong Potential', recruitingInterest: 'Interested',
    potentialRole: 'FDE', note: 'Sarah is actively exploring. Loves our mission. Comp expectations are in range. Next: schedule a technical screen.',
    followUp: true, followUpOwner: 'Luis Avila', timestamp: '8:02 PM',
  },
  {
    id: 'int-3', attendeeId: 'a1',
    employeeId: 'emp-jordan', employeeName: 'Jordan Park', employeeRole: 'Engineering Lead',
    conversationType: 'Technical', engagement: 'Strong',
    talentSignal: 'Strong Potential', recruitingInterest: 'Interested',
    potentialRole: 'FDE', note: 'Walked through her Stripe infra work. Technically excellent. Would fit our FDE bar easily.',
    followUp: false, followUpOwner: 'Luis Avila', timestamp: '8:30 PM',
  },
  {
    id: 'int-4', attendeeId: 'a3',
    employeeId: 'emp-luis', employeeName: 'Luis Avila', employeeRole: 'Technical Recruiter',
    conversationType: 'Recruiting', engagement: 'Good',
    talentSignal: 'Strong Potential', recruitingInterest: 'Open',
    potentialRole: 'FDE', note: 'Maya knows our FDE role well from Palantir context. Not urgently looking but open to conversation. Follow up in 2 weeks.',
    followUp: true, followUpOwner: 'Luis Avila', timestamp: '7:48 PM',
  },
  {
    id: 'int-5', attendeeId: 'a5',
    employeeId: 'emp-kj', employeeName: 'KJ Shah', employeeRole: 'Cofounder',
    conversationType: 'Founder', engagement: 'Strong',
    talentSignal: 'Strong Potential', recruitingInterest: 'Interested',
    potentialRole: 'FDE', note: 'Priya is brilliant. Runs complex technical accounts at Twilio. Referred by David Kim (trusted). Top of list.',
    followUp: true, followUpOwner: 'Alyssa Placa', timestamp: '7:30 PM',
  },
  {
    id: 'int-6', attendeeId: 'a8',
    employeeId: 'emp-jordan', employeeName: 'Jordan Park', employeeRole: 'Engineering Lead',
    conversationType: 'Technical', engagement: 'Strong',
    talentSignal: 'Strong Potential', recruitingInterest: 'Interested',
    potentialRole: 'FDE', note: 'Ryan built Linear\'s tooling for enterprise customers. Exact profile. Wants to join a faster company.',
    followUp: true, followUpOwner: 'Alyssa Placa', timestamp: '8:15 PM',
  },
  {
    id: 'int-7', attendeeId: 'a10',
    employeeId: 'emp-kj', employeeName: 'KJ Shah', employeeRole: 'Cofounder',
    conversationType: 'Founder', engagement: 'Strong',
    talentSignal: 'Strong Potential', recruitingInterest: 'Open',
    potentialRole: 'FDE', note: 'David built Figma\'s first enterprise integrations. Very product-minded. Exploring next move.',
    followUp: true, followUpOwner: 'Luis Avila', timestamp: '7:55 PM',
  },
  {
    id: 'int-8', attendeeId: 'a11',
    employeeId: 'emp-alyssa', employeeName: 'Alyssa Placa', employeeRole: 'Recruiting Lead',
    conversationType: 'Recruiting', engagement: 'Good',
    talentSignal: 'Strong Potential', recruitingInterest: 'Interested',
    potentialRole: 'FDE', note: 'Sofia already knows the FDE role. Palantir FDE for 3 years. Ready to hear more about comp and scope.',
    followUp: true, followUpOwner: 'Luis Avila', timestamp: '7:22 PM',
  },
  {
    id: 'int-9', attendeeId: 'a13',
    employeeId: 'emp-jordan', employeeName: 'Jordan Park', employeeRole: 'Engineering Lead',
    conversationType: 'Technical', engagement: 'Strong',
    talentSignal: 'Strong Potential', recruitingInterest: 'Interested',
    potentialRole: 'FDE', note: 'Natalie built Retool\'s enterprise embed SDK. Very strong technically. Interested in higher-impact role.',
    followUp: true, followUpOwner: 'Alyssa Placa', timestamp: '8:45 PM',
  },
]

// ─── Voice Note Transcript ────────────────────────────────────────────────────

export const sampleVoiceTranscript = `Sarah works on developer infrastructure at Stripe. Strong technically, very interested in the FDE role, casually exploring. Luis should follow up next week.`

export const sampleVoiceExtraction = {
  company: 'Stripe',
  area: 'Developer Infrastructure',
  interest: 'Open' as const,
  talentSignal: 'Strong Potential' as const,
  potentialRole: 'FDE' as const,
  followUpOwner: 'Luis Avila',
}

// ─── Employees ────────────────────────────────────────────────────────────────

export const employees = [
  { id: 'emp-alyssa', name: 'Alyssa Placa', role: 'Recruiting Lead', avatar: 'AP' },
  { id: 'emp-luis', name: 'Luis Avila', role: 'Technical Recruiter', avatar: 'LA' },
  { id: 'emp-kj', name: 'KJ Shah', role: 'Cofounder', avatar: 'KJ' },
  { id: 'emp-jordan', name: 'Jordan Park', role: 'Engineering Lead', avatar: 'JP' },
]

// ─── Main Event ───────────────────────────────────────────────────────────────

export const mainEvent: RecruitingEvent = {
  id: 'evt-001',
  name: 'AI Builders Dinner',
  date: 'September 17, 2026',
  location: 'Kaizen NYC Office',
  objective: 'Generate qualified FDE pipeline for NYC hiring push',
  format: 'Curated Dinner',
  targetRole: 'Forward Deployed Engineer',
  targetLevel: 'Senior+',
  status: 'live',
  forecastInvited: 54,
  forecastRsvp: 29,
  forecastAttended: 23,
  forecastTargetTalent: 19,
  forecastQualified: 5,
  forecastProcessEntries: 2,
  actualInvited: 54,
  actualRsvp: 29,
  actualAttended: 23,
  actualTargetTalent: 19,
  actualQualified: 8,
  actualProcessEntries: 3,
  actualOnsites: 2,
  actualOffers: 1,
  actualHires: 1,
  cost: 8400,
  attendeeIds: seedAttendees.map((a) => a.id),
}

export const plannedEvent: RecruitingEvent = {
  id: 'evt-002',
  name: 'Infrastructure Roundtable',
  date: 'October 9, 2026',
  location: 'Kaizen NYC Office',
  objective: 'Build qualified infrastructure pipeline for Q4',
  format: 'Technical Roundtable',
  targetRole: 'Infrastructure Engineer',
  targetLevel: 'Senior+',
  status: 'planned',
  forecastInvited: 52,
  forecastRsvp: 28,
  forecastAttended: 22,
  forecastTargetTalent: 18,
  forecastQualified: 5,
  forecastProcessEntries: 2,
  actualInvited: 0,
  actualRsvp: 0,
  actualAttended: 0,
  actualTargetTalent: 0,
  actualQualified: 0,
  actualProcessEntries: 0,
  actualOnsites: 0,
  actualOffers: 0,
  actualHires: 0,
  cost: 0,
  attendeeIds: [],
}

export const allEvents: RecruitingEvent[] = [mainEvent, plannedEvent]

// ─── Historical Events ────────────────────────────────────────────────────────

export const historicalEvents: HistoricalEvent[] = [
  {
    id: 'h1', name: 'FDE Founder Dinner (Spring)', date: '2026-03-12', format: 'Curated Dinner',
    targetRole: 'FDE', seniority: 'Senior+', audienceSize: 22, dayOfWeek: 'Thursday',
    timeSlot: '6:30 PM', hostType: 'Founder + Recruiting', contentType: 'Roundtable Discussion',
    invited: 48, rsvp: 28, attended: 22, targetTalent: 19, qualified: 6, processEntries: 3,
    onsites: 2, offers: 1, hires: 1, cost: 7200,
  },
  {
    id: 'h2', name: 'Engineering Open House', date: '2026-01-25', format: 'Open House',
    targetRole: 'FDE', seniority: 'Mid–Senior', audienceSize: 58, dayOfWeek: 'Tuesday',
    timeSlot: '5:00 PM', hostType: 'Engineering Team', contentType: 'Demo + Tour',
    invited: 120, rsvp: 71, attended: 58, targetTalent: 32, qualified: 5, processEntries: 2,
    onsites: 1, offers: 0, hires: 0, cost: 4800,
  },
  {
    id: 'h3', name: 'Senior SWE Technical Roundtable', date: '2026-02-18', format: 'Roundtable',
    targetRole: 'FDE', seniority: 'Senior+', audienceSize: 27, dayOfWeek: 'Wednesday',
    timeSlot: '6:30 PM', hostType: 'Engineering Lead', contentType: 'Technical Talk',
    invited: 58, rsvp: 34, attended: 27, targetTalent: 23, qualified: 7, processEntries: 4,
    onsites: 3, offers: 2, hires: 1, cost: 6100,
  },
  {
    id: 'h4', name: 'Infra Deep Dive Workshop', date: '2026-04-08', format: 'Workshop',
    targetRole: 'Infrastructure', seniority: 'Senior+', audienceSize: 18, dayOfWeek: 'Thursday',
    timeSlot: '6:00 PM', hostType: 'Founder + Technical Lead', contentType: 'Technical Workshop',
    invited: 40, rsvp: 24, attended: 18, targetTalent: 16, qualified: 5, processEntries: 3,
    onsites: 2, offers: 1, hires: 1, cost: 5500,
  },
  {
    id: 'h5', name: 'Networking Happy Hour', date: '2025-11-14', format: 'Networking',
    targetRole: 'FDE', seniority: 'All', audienceSize: 75, dayOfWeek: 'Thursday',
    timeSlot: '5:30 PM', hostType: 'Recruiting Only', contentType: 'Unstructured',
    invited: 180, rsvp: 98, attended: 75, targetTalent: 30, qualified: 3, processEntries: 1,
    onsites: 0, offers: 0, hires: 0, cost: 9000,
  },
  {
    id: 'h6', name: 'Founding Engineers Dinner', date: '2025-10-22', format: 'Curated Dinner',
    targetRole: 'FDE', seniority: 'Senior+', audienceSize: 19, dayOfWeek: 'Wednesday',
    timeSlot: '7:00 PM', hostType: 'Founder', contentType: 'Curated Discussion',
    invited: 42, rsvp: 26, attended: 19, targetTalent: 17, qualified: 6, processEntries: 4,
    onsites: 3, offers: 2, hires: 2, cost: 7800,
  },
  {
    id: 'h7', name: 'Tech Women in Engineering', date: '2025-12-09', format: 'Panel',
    targetRole: 'FDE', seniority: 'Mid–Senior', audienceSize: 44, dayOfWeek: 'Tuesday',
    timeSlot: '6:00 PM', hostType: 'Recruiting + Engineering', contentType: 'Panel + Networking',
    invited: 95, rsvp: 56, attended: 44, targetTalent: 28, qualified: 4, processEntries: 2,
    onsites: 1, offers: 0, hires: 0, cost: 6200,
  },
  {
    id: 'h8', name: 'AI Builders Mixer', date: '2026-06-04', format: 'Networking',
    targetRole: 'FDE', seniority: 'Senior+', audienceSize: 38, dayOfWeek: 'Thursday',
    timeSlot: '6:30 PM', hostType: 'Engineering Lead + Recruiting', contentType: 'Curated Networking',
    invited: 80, rsvp: 48, attended: 38, targetTalent: 29, qualified: 6, processEntries: 3,
    onsites: 2, offers: 1, hires: 0, cost: 7100,
  },
]

// ─── Insights ────────────────────────────────────────────────────────────────

export const insights = [
  {
    id: 'ins-1',
    category: 'Format',
    observation: 'Curated technical dinners (20–25 pax) produced 2.7× more qualified pipeline per target attendee than general networking events.',
    evidence: 'Dinners avg 32% qualified yield; networking events avg 12% qualified yield.',
    confidence: 'High',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-2',
    category: 'Host',
    observation: 'Founder-hosted events had an 18% higher show rate vs. recruiting-only events.',
    evidence: 'Founder events: 82% avg show rate. Recruiting-only: 64% avg show rate.',
    confidence: 'High',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-3',
    category: 'Outreach',
    observation: 'Senior engineers responded 22% better to technical-topic invitations than culture-focused invitations.',
    evidence: 'Technical invite RSVP rate: 56%. Culture invite RSVP rate: 34%.',
    confidence: 'Medium',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-4',
    category: 'Follow-Up',
    observation: 'Candidates followed up within 24 hours entered process at 1.8× the rate of candidates followed up after 3+ days.',
    evidence: '<24hr follow-up process rate: 54%. 3+ day follow-up: 29%.',
    confidence: 'High',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-5',
    category: 'Timing',
    observation: 'Thursday events had a 14% higher attendance rate than Tuesday events for engineering audiences.',
    evidence: 'Thursday avg show rate: 79%. Tuesday avg show rate: 65%.',
    confidence: 'Medium',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-6',
    category: 'Audience',
    observation: 'Events with >70% Priority A/B attendees generated 3.1× more process entries than broader audience events.',
    evidence: 'Curated events: 3.2 avg process entries. Broad events: 1.0 avg process entries.',
    confidence: 'High',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-7',
    category: 'Size',
    observation: 'Events under 25 attendees had 2.4× higher meaningful interaction rates than events over 50.',
    evidence: 'Small events: 71% interaction coverage. Large events: 29% interaction coverage.',
    confidence: 'High',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-8',
    category: 'Target',
    observation: 'Palantir and Stripe FDEs had the highest conversion from invitation to qualified pipeline (38% and 31%).',
    evidence: 'Based on 24 Palantir and 19 Stripe attendees across 4 events.',
    confidence: 'Medium',
    label: 'Observed association in demo data',
  },
  {
    id: 'ins-9',
    category: 'ROI',
    observation: 'Curated dinners have a $1,400 cost per qualified prospect vs. $3,000 for open-house events.',
    evidence: 'Total event costs divided by qualified pipeline generated, across 8 events.',
    confidence: 'High',
    label: 'Observed association in demo data',
  },
]

// ─── Next Event Recommendation ─────────────────────────────────────────────────

export const nextEventRecommendation = {
  name: 'Staff Infrastructure Technical Roundtable',
  reason: 'Historical technical events for Senior+ infrastructure candidates generated the highest qualified-pipeline yield. Thursday evening dinners with founder presence produce the best outcomes for this audience.',
  format: 'Technical Roundtable',
  targetRole: 'Infrastructure Engineer',
  targetLevel: 'Senior+',
  capacity: 22,
  inviteVolume: 52,
  suggestedDay: 'Thursday',
  suggestedTime: '6:30 PM',
  hosts: ['Founder', 'Technical Lead'],
  audienceMix: { directTarget: 60, adjacent: 30, community: 10 },
  forecast: {
    rsvp: 28,
    attended: 22,
    targetTalent: 18,
    qualified: 5,
    processEntries: { min: 2, max: 3 },
  },
  label: 'Illustrative recommendation based on demo historical data',
}

// ─── Event Format Options ─────────────────────────────────────────────────────

export const eventFormatOptions = [
  {
    id: 'dinner',
    name: 'AI Builders Dinner',
    description: '20–25 person curated dinner',
    why: 'Curated dinners maximize depth of conversation for senior FDE candidates. The intimate setting drives founder-level connection that broader events can\'t replicate.',
    strengths: ['Highest qualified yield per attendee', 'Strong founder connection', 'Memorable, personal experience'],
    downsides: ['Lower top-of-funnel volume', 'Requires careful audience curation'],
    forecast: { invited: 54, rsvp: 29, attended: 23, targetTalent: 19, qualified: 5, entries: 2 },
    tag: 'Recommended',
  },
  {
    id: 'roundtable',
    name: 'Technical Roundtable',
    description: '20–30 senior technical candidates',
    why: 'Technical roundtables attract senior engineers motivated by intellectual discussion. Strong for filtering high signal candidates quickly.',
    strengths: ['Technical credibility signal', 'Self-selecting audience', 'Good depth of conversation'],
    downsides: ['Harder to invite non-technical adjacent talent', 'Content production required'],
    forecast: { invited: 60, rsvp: 32, attended: 26, targetTalent: 20, qualified: 4, entries: 2 },
    tag: null,
  },
  {
    id: 'open-house',
    name: 'Engineering Open House',
    description: '40–60 broader candidates',
    why: 'Open houses maximize top-of-funnel exposure and build employer brand. Lower conversion rate but higher total volume.',
    strengths: ['Broad reach', 'Good for employer brand', 'Lower cost per invite'],
    downsides: ['Lower qualified yield', 'Less personal connection', 'More operational lift'],
    forecast: { invited: 120, rsvp: 65, attended: 52, targetTalent: 28, qualified: 4, entries: 1 },
    tag: null,
  },
]
