import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"

/* ================= PAGES ================= */
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"

import UserDashboardPage from "./pages/UserDashboardPage"
import AdminUsersPage from "./pages/AdminUsersPage"
import AnalyticsDashboard from "./pages/AnalyticsDashboard"
import AdminDashboardPage from "./pages/AdminDashboardPage"

import RunReviewPage from "./pages/RunReviewPage"
import ReviewResultsPage from "./pages/ReviewResultsPage"
import ReviewHistoryPage from "./pages/ReviewHistoryPage"
import SOAAnalysisPage from "./pages/SOAAnalysisPage"

/* ================= COMPONENTS ================= */
import ProtectedRoute from "./components/ProtectedRoute"

/* ================= LAYOUT ================= */
import AppLayout from "./layout/AppLayout"

/* ================= HOOKS ================= */
import useAuth from "./hooks/useAuth"
import { useAuthStore } from "./hooks/authStore"

/* ================= ANIMATED ROUTES ================= */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen"
      >
        <Routes location={location}>

          {/* ================= PUBLIC ================= */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ================= ADMIN ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AppLayout>
                  <AdminDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="admin">
                <AppLayout>
                  <AdminUsersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute role="admin">
                <AppLayout>
                  <AnalyticsDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= USER ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="paraplanner">
                <AppLayout>
                  <UserDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= AI REVIEW ================= */}
          <Route
            path="/soa"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SOAAnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/run"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RunReviewPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReviewResultsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReviewHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= ROOT REDIRECT ================= */}
          <Route path="/" element={<RootRedirect />} />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

/* ================= ROOT REDIRECT ================= */
function RootRedirect() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />

  return (
    <Navigate
      to={user.role === "admin" ? "/admin" : "/dashboard"}
      replace
    />
  )
}

/* ================= APP ================= */
export default function App() {
  useAuth()

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}