import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TicketsBoard } from './pages/TicketsBoard'
import { TicketsList } from './pages/TicketsList'
import { MyQueue } from './pages/MyQueue'
import { AtRisk } from './pages/AtRisk'
import { NewHires } from './pages/NewHires'
import { NewHireDetail } from './pages/NewHireDetail'
import { Requests } from './pages/Requests'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* PRD canonical routes */}
        <Route path="/" element={<Navigate to="/pipeline" replace />} />
        <Route path="/pipeline" element={<TicketsBoard />} />
        <Route path="/pipeline/list" element={<TicketsList />} />
        <Route path="/queue" element={<MyQueue />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/drafts" element={<Requests />} />
        <Route path="/onboarding" element={<NewHires />} />
        <Route path="/onboarding/:id" element={<NewHireDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />

        {/* Legacy redirects — keep old URLs working */}
        <Route path="/tickets" element={<Navigate to="/pipeline" replace />} />
        <Route path="/tickets/board" element={<Navigate to="/pipeline" replace />} />
        <Route path="/tickets/list" element={<Navigate to="/pipeline/list" replace />} />
        <Route path="/tickets/queue" element={<Navigate to="/queue" replace />} />
        <Route path="/tickets/at-risk" element={<AtRisk />} />
        <Route path="/new-hires" element={<Navigate to="/onboarding" replace />} />
        <Route path="/new-hires/:id" element={<Navigate to="/onboarding/:id" replace />} />
        <Route path="/scheduling" element={<Navigate to="/requests" replace />} />
        <Route path="/scheduling/requests" element={<Navigate to="/requests" replace />} />
        <Route path="/scheduling/approvals" element={<Navigate to="/requests/drafts" replace />} />

        <Route path="*" element={<Navigate to="/pipeline" replace />} />
      </Route>
    </Routes>
  )
}
