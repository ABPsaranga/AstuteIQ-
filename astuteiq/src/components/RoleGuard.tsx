import { useAuthStore } from "../hooks/authStore"

export default function RoleGuard({
  allow,
  children,
}: {
  allow: ("admin" | "paraplanner")[]
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)

  if (!user || !allow.includes(user.role)) return null

  return <>{children}</>
}