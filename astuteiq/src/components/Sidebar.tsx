import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlayCircle,
  Clock,
  BarChart2,
  FileSearch,
  Settings,
  ShieldCheck,
  Users,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../features/auth/store'

interface NavItem {
  to:      string
  label:   string
  icon:    React.ElementType
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/run-review',   label: 'Run Review',  icon: PlayCircle },
  { to: '/history',      label: 'History',     icon: Clock },
  { to: '/analytics',    label: 'Analytics',   icon: BarChart2 },
  { to: '/soa-analysis', label: 'SOA Analysis',icon: FileSearch },
  { to: '/settings',     label: 'Settings',    icon: Settings },
  // Admin
  { to: '/admin',        label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
  { to: '/admin/users',  label: 'Users',       icon: Users,       adminOnly: true },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)

  const items = NAV_ITEMS.filter((i) => !i.adminOnly || user?.role === 'admin')

  return (
    <aside className="w-60 shrink-0 bg-surface-card border-r border-surface-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-surface-border">
        <span className="text-lg font-bold text-white tracking-tight">
          Astute<span className="text-brand-400">IQ</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} className={isActive ? 'text-brand-400' : ''} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-brand-400 opacity-70" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User chip */}
      {user && (
  <div className="p-4 border-t border-surface-border">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold uppercase">
        {(user.name ?? user.email ?? '?').charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{user.name ?? user.email}</p>
        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
      </div>
          </div>
        </div>
      )}
    </aside>
  )
}
