import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  LogOut,
  Search,
  Sparkles,
  ChevronDown,
  Shield,
  Activity,
  AlertTriangle,
  Users,
  Clock3,
  Settings,
  Terminal,
  Zap,
  ServerCrash,
  Radio,
  GitBranch,
  BarChart3,
  UserCheck,
  X,
  ArrowRight,
  Database,
  Cpu,
  Globe2,
  Lock,
} from 'lucide-react'

import { useLogout } from '../features/auth/hooks'
import { useAuthStore } from '../features/auth/store'

// ─── Quick actions for admin command palette ──────────────────────────────────
const QUICK_ACTIONS = [
  { icon: Users,       label: 'View all users',        shortcut: 'U', to: '/admin/users' },
  { icon: Activity,    label: 'Live monitoring',        shortcut: 'M', to: '/admin/live-monitoring' },
  { icon: BarChart3,   label: 'API usage stats',        shortcut: 'A', to: '/admin/api-usage' },
  { icon: UserCheck,   label: 'Pending invitations',   shortcut: 'I', to: '/admin/invitations' },
  { icon: GitBranch,   label: 'Audit logs',             shortcut: 'L', to: '/admin/audit-logs' },
  { icon: Settings,    label: 'System settings',        shortcut: 'S', to: '/admin/integrations' },
]

// ─── System health micro-metrics ─────────────────────────────────────────────
const SYSTEM_METRICS = [
  { label: 'API',  value: '99.8%', ok: true  },
  { label: 'DB',   value: '98.2%', ok: true  },
  { label: 'Queue',value: '87.1%', ok: false },
]

export default function Topbar() {
  const { logout } = useLogout()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [focused,            setFocused]            = useState(false)
  const [showNotifications,  setShowNotifications]  = useState(false)
  const [showUserMenu,       setShowUserMenu]        = useState(false)
  const [showCommandPalette, setShowCommandPalette]  = useState(false)
  const [showSystemPanel,    setShowSystemPanel]     = useState(false)
  const [cmdQuery,           setCmdQuery]            = useState('')
  const [currentTime,        setCurrentTime]         = useState(new Date())
  const [incidentCount]                              = useState(2)

  const cmdInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = user?.role === 'admin'

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ⌘K to open command palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
        setTimeout(() => cmdInputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false)
        setShowNotifications(false)
        setShowUserMenu(false)
        setShowSystemPanel(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const initials = useMemo(() =>
    (user?.name ?? user?.email ?? 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    [user]
  )

  const notifications = isAdmin
    ? [
        { id: 1, icon: AlertTriangle, title: 'Queue processing degraded',     desc: 'Avg wait time 8.4 min — up 340%',           color: 'text-amber-400', dot: 'bg-amber-400', time: '3m ago'  },
        { id: 2, icon: ServerCrash,   title: 'Batch #4421 failure spike',      desc: '22 reviews failed in last 30 min',          color: 'text-red-400',   dot: 'bg-red-400',   time: '11m ago' },
        { id: 3, icon: Users,         title: '14 new enterprise signups',      desc: 'Conversion rate up 2.1% today',             color: 'text-emerald-400', dot: 'bg-emerald-400', time: '1h ago'  },
        { id: 4, icon: Shield,        title: 'Security audit completed',       desc: 'No vulnerabilities found · ISO 27001',      color: 'text-sky-400',   dot: 'bg-sky-400',   time: '2h ago'  },
        { id: 5, icon: Database,      title: 'DB backup successful',           desc: 'Full snapshot stored to S3',                color: 'text-slate-400', dot: 'bg-slate-500', time: '4h ago'  },
      ]
    : [
        { id: 1, icon: Sparkles, title: 'AI review completed',    desc: 'Your SOA review is ready to export', color: 'text-violet-400', dot: 'bg-violet-400', time: '2m ago' },
        { id: 2, icon: Clock3,   title: 'Review history updated', desc: '3 new reports available',             color: 'text-sky-400',   dot: 'bg-sky-400',   time: '1h ago' },
      ]

  const filteredActions = QUICK_ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(cmdQuery.toLowerCase())
  )

  const unreadCount = notifications.filter((_, i) => i < (isAdmin ? 2 : 1)).length

  return (
    <>
      <header
        className="sticky top-0 z-40 h-16 border-b border-white/[0.06]"
        style={{
          background: 'rgba(7,10,20,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Subtle top line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        <div className="h-full flex items-center gap-3 px-4 md:px-6">

          {/* ── Search / Command trigger ── */}
          <div className="flex-1 max-w-xl">
            <button
              onClick={() => {
                setShowCommandPalette(true)
                setTimeout(() => cmdInputRef.current?.focus(), 50)
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={`
                w-full h-10 flex items-center gap-3 px-4 rounded-2xl text-left
                border transition-all duration-200
                ${focused
                  ? 'border-violet-500/40 bg-[#0f0f1a] shadow-[0_0_0_3px_rgba(107,47,217,0.12)]'
                  : 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.12]'
                }
              `}
            >
              <Search size={14} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-500 flex-1 truncate">
                {isAdmin
                  ? 'Search users, logs, reviews, incidents…'
                  : 'Search reviews, clients, compliance flags…'}
              </span>
              <div className="hidden sm:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-md border border-white/10 bg-white/[0.06] text-[10px] font-mono text-slate-500">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded-md border border-white/10 bg-white/[0.06] text-[10px] font-mono text-slate-500">K</kbd>
              </div>
            </button>
          </div>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-2 ml-auto shrink-0">

            {/* ADMIN-ONLY: Live system health strip */}
            {isAdmin && (
              <button
                onClick={() => {
                  setShowSystemPanel((p) => !p)
                  setShowNotifications(false)
                  setShowUserMenu(false)
                }}
                className={`
                  hidden xl:flex items-center gap-3 px-3 py-2 rounded-2xl
                  border transition-all duration-200 relative
                  ${showSystemPanel
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07]'}
                `}
              >
                <div className="flex items-center gap-1.5">
                  <Radio size={10} className="text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-400 tracking-wide">LIVE</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                {SYSTEM_METRICS.map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${m.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-[10px] text-slate-500">{m.label}</span>
                    <span className={`text-[10px] font-semibold ${m.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{m.value}</span>
                  </div>
                ))}
              </button>
            )}

            {/* ADMIN-ONLY: Incident counter */}
            {isAdmin && incidentCount > 0 && (
              <button
                onClick={() => {
                  setShowNotifications((p) => !p)
                  setShowSystemPanel(false)
                  setShowUserMenu(false)
                }}
                className="
                  hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl
                  border border-red-500/30 bg-red-500/10
                  hover:bg-red-500/15 transition-all duration-200
                "
              >
                <AlertTriangle size={13} className="text-red-400" />
                <span className="text-[11px] font-semibold text-red-400">{incidentCount} incidents</span>
              </button>
            )}

            {/* ADMIN-ONLY: Clock */}
            {isAdmin && (
              <div className="hidden lg:flex flex-col items-end px-3 py-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                <span className="text-[13px] font-semibold text-white tabular-nums tracking-tight">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[9px] text-slate-600 uppercase tracking-widest">
                  {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}

            {/* ADMIN-ONLY: Command palette button */}
            {isAdmin && (
              <button
                onClick={() => {
                  setShowCommandPalette(true)
                  setTimeout(() => cmdInputRef.current?.focus(), 50)
                }}
                title="Quick actions"
                className="
                  hidden md:flex items-center gap-2 h-10 px-3 rounded-2xl
                  border border-violet-500/25 bg-violet-500/10
                  hover:bg-violet-500/20 hover:border-violet-500/40
                  transition-all duration-200 text-[#A78BFA]
                "
              >
                <Terminal size={14} />
                <span className="text-xs font-semibold">Quick actions</span>
              </button>
            )}

            {/* AI Badge (non-admin) */}
            {!isAdmin && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-[#6B2FD9]/25 bg-[#6B2FD9]/10 text-[#A78BFA]">
                <Sparkles size={13} />
                <span className="text-xs font-semibold">AstuteIQ AI</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((p) => !p)
                  setShowSystemPanel(false)
                  setShowUserMenu(false)
                }}
                className={`
                  relative w-10 h-10 rounded-2xl flex items-center justify-center
                  border transition-all duration-200
                  ${showNotifications
                    ? 'border-violet-500/40 bg-violet-500/15 text-white'
                    : 'border-white/[0.07] bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'}
                `}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[380px] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#07090f] shadow-2xl shadow-black/60 z-50">
                  <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      {isAdmin && <p className="text-[10px] text-slate-500 mt-0.5">Admin · system &amp; operational alerts</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">{unreadCount} new</span>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04]">
                    {notifications.map((n, i) => (
                      <button
                        key={n.id}
                        className="w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="relative w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <n.icon size={15} className={n.color} />
                          {i < unreadCount && (
                            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${n.dot} border border-[#07090f]`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{n.desc}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] text-slate-600">{n.time}</span>
                          <ArrowRight size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-white/[0.06]">
                    <button className="w-full text-center text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN-ONLY: System panel dropdown */}
            {isAdmin && showSystemPanel && (
              <div className="absolute right-4 top-[68px] w-[340px] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#07090f] shadow-2xl shadow-black/60 z-50">
                <div className="px-4 py-3.5 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Cpu size={14} className="text-emerald-400" />
                    System overview
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Live infrastructure status</p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'API gateway',      pct: 99.8, icon: Globe2,     color: 'bg-emerald-400', ok: true  },
                    { label: 'Database cluster', pct: 98.2, icon: Database,   color: 'bg-emerald-400', ok: true  },
                    { label: 'Review queue',     pct: 87.1, icon: Zap,        color: 'bg-amber-400',   ok: false },
                    { label: 'AI inference',     pct: 99.1, icon: Sparkles,   color: 'bg-emerald-400', ok: true  },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                        <s.icon size={14} className={s.ok ? 'text-emerald-400' : 'text-amber-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300">{s.label}</span>
                          <span className={`text-xs font-semibold ${s.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{s.pct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <button className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                    Full system report →
                  </button>
                </div>
              </div>
            )}

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu((p) => !p)
                    setShowNotifications(false)
                    setShowSystemPanel(false)
                  }}
                  className={`
                    flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl
                    border transition-all duration-200
                    ${showUserMenu
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07]'}
                  `}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg"
                    style={{
                      background: isAdmin
                        ? 'linear-gradient(135deg,#065f46,#2DD4A0)'
                        : 'linear-gradient(135deg,#4a1f99,#6B2FD9)',
                    }}
                  >
                    {initials}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name ?? 'User'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isAdmin
                        ? <Shield size={9} className="text-[#2DD4A0]" />
                        : <Sparkles size={9} className="text-[#A78BFA]" />}
                      <span className="text-[10px] font-medium" style={{ color: isAdmin ? '#2DD4A0' : '#A78BFA' }}>
                        {isAdmin ? 'Administrator' : 'Paraplanner'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`hidden sm:block text-slate-600 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#07090f] shadow-2xl shadow-black/60 z-50">
                    {/* Profile header */}
                    <div className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{
                            background: isAdmin
                              ? 'linear-gradient(135deg,#065f46,#2DD4A0)'
                              : 'linear-gradient(135deg,#4a1f99,#6B2FD9)',
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{user.name ?? 'User'}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[160px]">{user.email}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <Shield size={11} className="text-emerald-400" />
                          <span className="text-[11px] text-emerald-400 font-medium">Full admin access</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      {isAdmin && (
                        <>
                          <p className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-widest text-slate-600">Admin</p>
                          {[
                            { icon: Activity,  label: 'Live monitoring',   to: '/admin/live-monitoring' },
                            { icon: GitBranch, label: 'Audit logs',        to: '/admin/audit-logs' },
                            { icon: Users,     label: 'User management',   to: '/admin/users' },
                          ].map((item) => (
                            <button key={item.label} onClick={() => navigate(item.to)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] transition-colors">
                              <item.icon size={15} className="text-slate-500" />
                              {item.label}
                            </button>
                          ))}
                          <button
                            onClick={() => navigate('/admin')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                          >
                            <Shield size={15} className="text-emerald-500" />
                            Switch to admin dashboard
                          </button>
                          <div className="my-1.5 border-t border-white/[0.06]" />
                        </>
                      )}
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] transition-colors">
                        <Settings size={15} className="text-slate-500" />
                        Account settings
                      </button>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Command Palette (admin only) ─────────────────────────────────── */}
      {isAdmin && showCommandPalette && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden border border-white/[0.1] bg-[#07090f] shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
              <Terminal size={15} className="text-violet-400 shrink-0" />
              <input
                ref={cmdInputRef}
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
              <button onClick={() => setShowCommandPalette(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Actions */}
            <div className="p-2 max-h-[320px] overflow-y-auto">
              <p className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-widest text-slate-600">Quick actions</p>
              {filteredActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setShowCommandPalette(false)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-all duration-150 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center group-hover:bg-violet-500/20 transition-colors shrink-0">
                    <action.icon size={15} className="text-slate-400 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <span className="flex-1 text-left">{action.label}</span>
                  <kbd className="px-2 py-0.5 rounded-md border border-white/10 bg-white/[0.05] text-[10px] font-mono text-slate-600">
                    {action.shortcut}
                  </kbd>
                  <ArrowRight size={13} className="text-slate-700 group-hover:text-violet-400 transition-colors" />
                </button>
              ))}
              {filteredActions.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-600">No actions found for "{cmdQuery}"</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}