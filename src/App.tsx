import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TicketsBoard } from './pages/TicketsBoard'
import { TicketsList } from './pages/TicketsList'
import { MyQueue } from './pages/MyQueue'
import { AtRisk } from './pages/AtRisk'
import { NewHires } from './pages/NewHires'
import { NewHireDetail } from './pages/NewHireDetail'
import { SchedulingRequests } from './pages/SchedulingRequests'
import { SchedulingApprovals } from './pages/SchedulingApprovals'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/tickets/board" replace />} />
        <Route path="/tickets" element={<Navigate to="/tickets/board" replace />} />
        <Route path="/tickets/board" element={<TicketsBoard />} />
        <Route path="/tickets/list" element={<TicketsList />} />
        <Route path="/tickets/queue" element={<MyQueue />} />
        <Route path="/tickets/at-risk" element={<AtRisk />} />
        <Route path="/new-hires" element={<NewHires />} />
        <Route path="/new-hires/:id" element={<NewHireDetail />} />
        <Route path="/scheduling" element={<Navigate to="/scheduling/requests" replace />} />
        <Route path="/scheduling/requests" element={<SchedulingRequests />} />
        <Route path="/scheduling/approvals" element={<SchedulingApprovals />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/tickets/board" replace />} />
      </Route>
    </Routes>
  )
}
