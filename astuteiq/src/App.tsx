import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import UserDashboardPage from './pages/UserDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import RunReviewPage from './pages/RunReviewPage'
import ReviewResultsPage from './pages/ReviewResultsPage'
import ReviewHistoryPage from './pages/ReviewHistoryPage'
import SOAAnalysisPage from './pages/SOAAnalysisPage'
import SettingsPage from './pages/SettingsPage'
import HomePage from "./pages/HomePage"


// OPTIONAL: only include if you plan to use direct route
// import SOAAnalysisPage from './pages/SOAAnalysisPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🌍 GLOBAL LAYOUT (Navbar + Footer always visible) */}
        <Route element={<AppLayout />}>

          {/* PUBLIC */}
          <Route path="/" element={<HomePage />} />

          {/* AUTH PAGES */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* PROTECTED */}
          <Route element={<ProtectedRoute />}>

            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/run-review" element={<RunReviewPage />} />
            <Route path="/soa-analysis" element={<SOAAnalysisPage />} />
            <Route path="/review/:id" element={<ReviewResultsPage />} />
            <Route path="/history" element={<ReviewHistoryPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* ADMIN */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />

          </Route>

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}