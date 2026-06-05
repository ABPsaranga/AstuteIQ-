// src/components/admin/AdminTopbar.tsx

import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, BarChart3 }  from 'lucide-react'
import { useAuthStore } from '../../features/auth/store'

const TITLES: Record<string, string> = {
  '/admin':              'Dashboard',
  '/admin/users':        'User Management',
  '/admin/billing':      'Billing',
  '/admin/integrations': 'Integrations',
  '/admin/logs':         'Activity Logs',
  '/admin/settings':     'Settings',
}

export default function AdminTopbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const user         = useAuthStore((s) => s.user)
  const title        = TITLES[pathname] ?? 'Admin'
  const initial      = (user?.name || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <header className="flex h-[57px] shrink-0 items-center justify-between border-b border-slate-800 bg-[#020617]/80 px-6 backdrop-blur-sm">

      <h1 className="text-sm font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors text-xs text-slate-300 font-medium"
          title="Switch to user dashboard"
        >
          <BarChart3 size={14} />
          User Dashboard
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
          <ShieldCheck size={10} /> Admin
        </span>

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
          {initial}
        </div>

        <span className="hidden text-xs text-slate-400 sm:block">
          {user?.name || user?.email || 'Admin'}
        </span>
      </div>
    </header>
  )
}