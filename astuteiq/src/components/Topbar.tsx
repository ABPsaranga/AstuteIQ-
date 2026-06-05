import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../features/auth/store'

const TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/run-review':    'Run Review',
  '/history':       'Review History',
  '/analytics':     'Analytics',
  '/soa-analysis':  'SOA Analysis',
  '/settings':      'Settings',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const user         = useAuthStore((s) => s.user)
  const isAdmin      = user?.role === 'admin'
  const title        = TITLES[pathname] ?? 'Dashboard'
  const initial      = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <header className="flex h-[57px] shrink-0 items-center justify-between border-b border-slate-800 bg-[#020617]/80 px-6 backdrop-blur-sm">

      <h1 className="text-sm font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-700 bg-emerald-800 hover:bg-emerald-700 transition-colors text-xs text-emerald-300 font-medium"
            title="Switch to admin dashboard"
          >
            <ShieldCheck size={14} />
            Admin Dashboard
          </button>
        )}
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
          isAdmin
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            : 'border-violet-500/30 bg-violet-500/10 text-violet-300'
        }`}>
          <LayoutDashboard size={10} />
          {isAdmin ? 'Admin' : 'User'}
        </span>

        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          isAdmin
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-violet-500/20 text-violet-300'
        }`}>
          {initial}
        </div>

        <span className="hidden text-xs text-slate-400 sm:block">
          {user?.name || user?.email || 'User'}
        </span>
      </div>
    </header>
  )
}
