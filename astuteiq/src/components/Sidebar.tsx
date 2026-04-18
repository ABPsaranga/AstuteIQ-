import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "../hooks/authStore"

export default function Sidebar() {
  const { user } = useAuthStore()
  const location = useLocation()

  const isAdmin = user?.role === "admin"

  const menu = isAdmin
    ? [
        { name: "Dashboard", path: "/admin" },
        { name: "Analytics", path: "/admin/analytics" },
        { name: "Users", path: "/admin/users" },
      ]
    : [
        { name: "Dashboard", path: "/dashboard" },
        { name: "New Analysis", path: "/run" },
        { name: "History", path: "/history" },
      ]

  return (
    <div className="w-64 bg-black/40 border-r border-white/10 flex flex-col justify-between">

      {/* LOGO */}
      <div>
        <div className="p-6 text-xl font-bold">
          Astute<span className="text-violet-400">IQ</span>
        </div>

        {/* MENU */}
        <nav className="px-4 space-y-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg transition ${
                location.pathname === item.path
                  ? "bg-violet-600"
                  : "hover:bg-white/10"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* USER */}
      <div className="p-4 border-t border-white/10 text-sm">
        <p>{user?.email}</p>
        <p className="text-violet-400 capitalize">{user?.role}</p>
      </div>
    </div>
  )
}