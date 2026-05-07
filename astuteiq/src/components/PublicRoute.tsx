import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store'

/**
 * Redirects already-authenticated users away from login/register pages.
 */
export default function PublicRoute() {
  const user    = useAuthStore((s) => s.user)
  const isReady = useAuthStore((s) => s.isReady)

  if (!isReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
