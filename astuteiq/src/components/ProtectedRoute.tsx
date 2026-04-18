import { Navigate } from "react-router-dom"
import { useAuthStore } from "../hooks/authStore"

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode
  role?: "admin" | "paraplanner"
}) {
  const { user, loading } = useAuthStore()

  // ✅ WAIT until auth loads
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  // ❌ not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // ❌ wrong role
  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin" : "/dashboard"}
        replace
      />
    )
  }

  return <>{children}</>
}