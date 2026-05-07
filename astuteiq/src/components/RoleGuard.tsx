import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store'
import type { UserRole } from '../features/auth/store'

interface RoleGuardProps {
  roles:    UserRole | UserRole[]
  children: ReactNode
  fallback?: string   // redirect path, default /dashboard
}

/**
 * Renders children only if the current user has one of the allowed roles.
 * Otherwise redirects to fallback path.
 */
export default function RoleGuard({ roles, children, fallback = '/dashboard' }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)

  const allowed = Array.isArray(roles) ? roles : [roles]

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
