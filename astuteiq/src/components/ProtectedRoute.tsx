import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store'

interface ProtectedRouteProps {
  roles?: string[]
}

/**
 * Protects routes:
 * - Redirects unauthenticated users to /login
 * - Redirects unauthorized roles to their correct dashboard
 * - Waits for persisted auth hydration
 */
export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user)
  const isReady = useAuthStore((s) => s.isReady)

  const location = useLocation()

  // Wait for Zustand persist hydration
  if (!isReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Role-based protection
  if (roles && !roles.includes(user.role)) {

    // Admin trying to access user pages
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }

    // User/paraplanner trying to access admin pages
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}