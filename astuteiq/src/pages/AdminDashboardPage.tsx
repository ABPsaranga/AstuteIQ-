// src/pages/AdminDashboardPage.tsx

import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import {
  Users, CreditCard, ScrollText, Plug,
  TrendingUp, ShieldCheck, CheckCircle2, AlertTriangle,
  UserPlus,
  Shield,
  ClipboardList,
  Activity,
} from 'lucide-react'
 
import api from '../lib/api'

interface DashStats {
  totalUsers:   number
  admins:       number
  paraplanners: number
  regularUsers: number
  totalReviews: number
  thisWeek:     number
  avgScore:     number | null
  overrides:    number
}

export default function AdminDashboardPage() {
  const navigate              = useNavigate()
  const [stats, setStats]     = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/reviews/stats'),
    ])
      .then(([usersRes, statsRes]) => {
        const users: any[] = usersRes.data ?? []
        const s            = statsRes.data  ?? {}
        setStats({
          totalUsers:   users.length,
          admins:       users.filter((u) => u.role === 'admin').length,
          paraplanners: users.filter((u) => u.role === 'paraplanner').length,
          regularUsers: users.filter((u) => u.role === 'user').length,
          totalReviews: s.total    ?? 0,
          thisWeek:     s.thisWeek ?? 0,
          avgScore:     s.avgScore ?? null,
          overrides:    s.overrides ?? 0,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = [
    { label: 'Total Users',   value: stats?.totalUsers,              Icon: Users,         color: 'text-violet-400', bg: 'bg-violet-500/10', to: '/admin/users'   },
    { label: 'Total Reviews', value: stats?.totalReviews,            Icon: TrendingUp,    color: 'text-emerald-400',bg: 'bg-emerald-500/10',to: null              },
    { label: 'This Week',     value: stats?.thisWeek,                Icon: CheckCircle2,  color: 'text-sky-400',    bg: 'bg-sky-500/10',    to: null              },
    { label: 'Avg Score',     value: stats?.avgScore != null ? `${stats.avgScore}%` : '—', Icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10', to: null },
  ]

  const QUICK_LINKS = [
  { label: 'Manage Users', Icon: Users, to: '/admin/users' },
  { label: 'Live Monitoring', Icon: Activity, to: '/admin/live-monitoring' },
  { label: 'Audit Logs', Icon: ClipboardList, to: '/admin/audit-logs' },
  { label: 'Permissions', Icon: Shield, to: '/admin/permissions' },
  { label: 'Invitations', Icon: UserPlus, to: '/admin/invitations' },
  { label: 'Integrations', Icon: Plug, to: '/admin/integrations' },
  { label: 'Billing', Icon: CreditCard, to: '/admin/billing' },
]

  return (
    <div className="space-y-8 text-slate-300">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, Icon, color, bg, to }) => (
          <div
            key={label}
            onClick={() => to && navigate(to)}
            className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${
              to ? 'cursor-pointer transition-colors hover:border-slate-700' : ''
            }`}
          >
            <div className={`mb-3 inline-flex rounded-xl p-2 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-white">
              {loading
                ? <span className="animate-pulse text-slate-700">···</span>
                : (value ?? '—')}
            </p>
          </div>
        ))}
      </div>

      {/* User breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">User Breakdown</h2>
          <button
            onClick={() => navigate('/admin/users')}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div className="h-8 animate-pulse rounded-lg bg-slate-800" />
        ) : (
          <div className="flex flex-wrap gap-6 text-sm">
            {[
              { label: 'Admins',       value: stats?.admins,       color: 'text-violet-300' },
              { label: 'Paraplanners', value: stats?.paraplanners, color: 'text-amber-300'  },
              { label: 'Users',        value: stats?.regularUsers, color: 'text-slate-300'  },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{value ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_LINKS.map(({ label, Icon, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-sm font-medium text-slate-300 transition-colors hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-white"
            >
              <Icon size={15} className="shrink-0 text-violet-400" />
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
} 