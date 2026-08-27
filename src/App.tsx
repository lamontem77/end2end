import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { EventLoopLayout } from './components/eventloop/EventLoopLayout'
import { TicketsBoard } from './pages/TicketsBoard'
import { TicketsList } from './pages/TicketsList'
import { MyQueue } from './pages/MyQueue'
import { AtRisk } from './pages/AtRisk'
import { NewHires } from './pages/NewHires'
import { NewHireDetail } from './pages/NewHireDetail'
import { Requests } from './pages/Requests'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { TalentNeeds } from './pages/eventloop/TalentNeeds'
import { Events } from './pages/eventloop/Events'
import { EventPlanner } from './pages/eventloop/EventPlanner'
import { EventDetail } from './pages/eventloop/EventDetail'
import { Candidates } from './pages/eventloop/Candidates'
import { Insights } from './pages/eventloop/Insights'

export default function App() {
  return (
    <Routes>
      {/* EventLoop routes */}
      <Route element={<EventLoopLayout />}>
        <Route path="/" element={<Navigate to="/talent-needs" replace />} />
        <Route path="/talent-needs" element={<TalentNeeds />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/new" element={<EventPlanner />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/insights" element={<Insights />} />
      </Route>

      {/* Legacy RecruiterOS routes */}
      <Route element={<Layout />}>
        <Route path="/pipeline" element={<TicketsBoard />} />
        <Route path="/pipeline/list" element={<TicketsList />} />
        <Route path="/queue" element={<MyQueue />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/drafts" element={<Requests />} />
        <Route path="/onboarding" element={<NewHires />} />
        <Route path="/onboarding/:id" element={<NewHireDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tickets" element={<Navigate to="/pipeline" replace />} />
        <Route path="/tickets/board" element={<Navigate to="/pipeline" replace />} />
        <Route path="/tickets/list" element={<Navigate to="/pipeline/list" replace />} />
        <Route path="/tickets/at-risk" element={<AtRisk />} />
        <Route path="/new-hires" element={<Navigate to="/onboarding" replace />} />
        <Route path="/new-hires/:id" element={<Navigate to="/onboarding" replace />} />
        <Route path="/scheduling" element={<Navigate to="/requests" replace />} />
        <Route path="/scheduling/requests" element={<Navigate to="/requests" replace />} />
        <Route path="/scheduling/approvals" element={<Navigate to="/requests/drafts" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/talent-needs" replace />} />
    </Routes>
  )
}
