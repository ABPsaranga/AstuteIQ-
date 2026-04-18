import { logout } from "../services/authService"
import { useAuthStore } from "../hooks/authStore"
import { useNavigate } from "react-router-dom"

export default function Topbar() {
  const { user, clearUser } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    clearUser()
    navigate("/login")
  }

  return (
    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40">

      <div className="text-sm text-zinc-400">
        Welcome, {user?.email}
      </div>

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 rounded-lg text-sm"
      >
        Logout
      </button>
    </div>
  )
}