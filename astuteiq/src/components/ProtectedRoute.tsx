import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store'

/**
 * Redirects unauthenticated users to /login.
 * Shows a loading state while the persisted session is being rehydrated.
 */
export default function ProtectedRoute() {
  const user    = useAuthStore((s) => s.user)
  const isReady = useAuthStore((s) => s.isReady)

  if (!isReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
