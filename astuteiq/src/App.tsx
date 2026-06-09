// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AppLayout        from './layout/AppLayout'
import AdminLayout      from './layout/AdminLayout'
import UserLayout       from './layout/UserLayout'
import ProtectedRoute   from './components/ProtectedRoute'
import PublicRoute      from './components/PublicRoute'

import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'

import HomePage from './pages/HomePage'

import UserDashboardPage from './pages/UserDashboardPage'

import AdminDashboardPage     from './pages/AdminDashboardPage'
import AdminUsersPage         from './pages/AdminUsersPage'
import AdminBillingPage       from './pages/AdminBillingPage'
import AdminLogsPage          from './pages/AdminLogsPage'
import AdminIntegrationsPage  from './pages/AdminIntegrationsPage'
import AdminInvitationsPage   from './pages/AdminInvitationsPage'
import AdminPermissionsPage   from './pages/AdminPermissionsPage'
import AdminAuditLogsPage     from './pages/AdminAuditLogsPage'
import AdminApiUsagePage      from './pages/AdminApiUsagePage'
import AdminLiveMonitoringPage from './pages/AdminLiveMonitoringPage'

import AnalyticsDashboard from './pages/AnalyticsDashboard'
import RunReviewPage      from './pages/RunReviewPage'
import ReviewResultsPage  from './pages/ReviewResultsPage'
import ReviewHistoryPage  from './pages/ReviewHistoryPage'
import SOAAnalysisPage    from './pages/SOAAnalysisPage'
import SettingsPage       from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route element={<PublicRoute />}>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
        </Route>

        {/* HOME */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* USER ROUTES */}
        <Route element={<ProtectedRoute roles={['user']} />}>
          <Route element={<UserLayout />}>
            <Route path="/dashboard"    element={<UserDashboardPage />} />
            <Route path="/run-review"   element={<RunReviewPage />} />
            <Route path="/soa-analysis" element={<SOAAnalysisPage />} />
            <Route path="/review/:id"   element={<ReviewResultsPage />} />
            <Route path="/history"      element={<ReviewHistoryPage />} />
            <Route path="/analytics"    element={<AnalyticsDashboard />} />
            <Route path="/settings"     element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<AdminLayout />}>
            {/* Core admin pages */}
            <Route path="/admin"                  element={<AdminDashboardPage />} />
            <Route path="/admin/users"            element={<AdminUsersPage />} />
            <Route path="/admin/billing"          element={<AdminBillingPage />} />
            <Route path="/admin/logs"             element={<AdminLogsPage />} />
            <Route path="/admin/integrations"     element={<AdminIntegrationsPage />} />
            <Route path="/admin/invitations"      element={<AdminInvitationsPage />} />
            <Route path="/admin/permissions"      element={<AdminPermissionsPage />} />
            <Route path="/admin/audit-logs"       element={<AdminAuditLogsPage />} />
            <Route path="/admin/live-monitoring"  element={<AdminLiveMonitoringPage />} />
            <Route path="/admin/api-usage"        element={<AdminApiUsagePage />} />

            {/* Workspace pages available to admin under /admin/* */}
            <Route path="/admin/run-review"       element={<RunReviewPage />} />
            <Route path="/admin/history"          element={<ReviewHistoryPage />} />
            <Route path="/admin/analytics"        element={<AnalyticsDashboard />} />
            <Route path="/admin/soa-analysis"     element={<SOAAnalysisPage />} />
            <Route path="/admin/settings"         element={<SettingsPage />} />
            <Route path="/admin/review/:id"       element={<ReviewResultsPage />} />
          </Route>
        </Route>

        <Route path="/asic-rg175p" element={<Navigate to="/" replace />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}