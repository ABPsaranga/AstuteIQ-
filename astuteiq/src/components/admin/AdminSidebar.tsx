// src/components/admin/AdminSidebar.tsx

import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  Activity,
  UserPlus,
  Shield,
  Zap,
  Globe2,
  CreditCard,
  GitBranch,
  BarChart3,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

import { useAuthStore } from '../../features/auth/store'

interface NavChild {
  to: string
  label: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

interface NavSection {
  title: string
  icon: React.ElementType
  adminOnly?: boolean
  children: NavChild[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    icon: LayoutDashboard,
    children: [
      { to: '/admin',                 label: 'Dashboard',    icon: LayoutDashboard },
      // { to: '/admin/run-review',      label: 'Run Review',   icon: PlayCircle      },
      // { to: '/admin/history',         label: 'History',      icon: Clock           },
      // { to: '/admin/analytics',       label: 'Analytics',    icon: BarChart2       },
      //{ to: '/admin/soa-analysis',    label: 'SOA Analysis', icon: FileSearch      },
      // { to: '/admin/settings',        label: 'Settings',     icon: Settings        },
    ],
  },
  {
    title: 'Command center',
    icon: ShieldCheck,
    adminOnly: true,
    children: [
      { to: '/admin',                 label: 'Overview',        icon: ShieldCheck                                           },
      { to: '/admin/live-monitoring', label: 'Live monitoring', icon: Activity, badge: 'LIVE', badgeColor: 'emerald'       },
      { to: '/admin/audit-logs',      label: 'Audit logs',      icon: GitBranch                                            },
    ],
  },
  {
    title: 'User & roles',
    icon: Users,
    adminOnly: true,
    children: [
      { to: '/admin/users',       label: 'All users',   icon: Users                                       },
      { to: '/admin/invitations', label: 'Invitations', icon: UserPlus, badge: '3', badgeColor: 'violet' },
      { to: '/admin/permissions', label: 'Permissions', icon: Shield                                      },
      { to: '/admin/settings',        label: 'Settings',     icon: Settings        },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    adminOnly: true,
    children: [
      { to: '/admin/api-usage',    label: 'API usage',    icon: BarChart3  },
      { to: '/admin/integrations', label: 'Integrations', icon: Globe2     },
      { to: '/admin/billing',      label: 'Billing',      icon: CreditCard },
    ],
  },
]

const BADGE_STYLES: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  violet:  'bg-violet-500/20  text-violet-400  border-violet-500/30',
  red:     'bg-red-500/20     text-red-400     border-red-500/30',
  amber:   'bg-amber-500/20   text-amber-400   border-amber-500/30',
}

export default function AdminSidebar() {
  const user       = useAuthStore((s) => s.user)
  const toggleRole = useAuthStore((s) => s.toggleRole)
  const location   = useLocation()
  const isAdmin    = user?.role === 'admin'

  const [collapsed, setCollapsed]     = useState(false)
  const [openSections, setOpenSections] = useState<string[]>(['Workspace', 'Command center', 'User & roles'])

  const toggleSection = (title: string) =>
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )

  const sections = NAV_SECTIONS.filter((s) => !s.adminOnly || isAdmin)

  const initials = (user?.name ?? user?.email ?? '?')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const activeSectionTitle = sections.find((s) =>
    s.children.some(
      (c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/')
    )
  )?.title

  return (
    <aside
      className="shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden select-none transition-all duration-300"
      style={{
        width: collapsed ? '64px' : '256px',
        background: '#060810',
        borderRight: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(107,47,217,0.18) 0%, transparent 70%)' }}
      />

      {/* Logo + collapse toggle */}
      <div
        className="relative h-16 flex items-center px-3 shrink-0 gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
      >
        {/* Logo mark — always visible */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0"
          style={{
            background: 'linear-gradient(135deg, #4a1f99 0%, #7B5CF0 100%)',
            boxShadow: '0 0 20px rgba(107,47,217,0.35)',
          }}
        >
          AI
        </div>

        {/* Wordmark — hidden when collapsed */}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p
              className="text-[17px] font-bold text-white leading-none"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: '-0.01em' }}
            >
              Astute<span style={{ color: '#A78BFA' }}>IQ</span>
            </p>
            <p className="text-[9px] tracking-[0.3em] uppercase text-slate-600 mt-1 font-sans">
              SOA Compliance
            </p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-150"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeftOpen size={14} />
            : <PanelLeftClose size={14} />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="relative flex-1 overflow-y-auto py-4 px-2 space-y-1 no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {sections.map((section, si) => {
          const isOpen   = openSections.includes(section.title)
          const isActive = activeSectionTitle === section.title

          return (
            <div key={section.title} className={si > 0 ? 'pt-3' : ''}>

              {/* Section divider */}
              {section.adminOnly && si > 0 && !collapsed && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <Zap size={8} className="text-slate-700" />
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              )}

              {/* Collapsed: just a thin divider between sections */}
              {section.adminOnly && si > 0 && collapsed && (
                <div className="mx-2 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              )}

              {/* Section header — hidden when collapsed */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`
                    w-full flex items-center justify-between
                    px-3 py-2 mb-1 rounded-xl
                    transition-all duration-150
                    ${isActive ? 'text-slate-300' : 'text-slate-600 hover:text-slate-400'}
                    hover:bg-white/[0.04]
                  `}
                >
                  <div className="flex items-center gap-2">
                    <section.icon size={12} />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">
                      {section.title}
                    </span>
                  </div>
                  <ChevronRight
                    size={12}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
              )}

              {/* Nav items */}
              {(isOpen || collapsed) && (
                <div className={`space-y-0.5 ${collapsed ? '' : 'pl-1'}`}>
                  {section.children.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin'}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive: active }) => `
                        group relative flex items-center
                        ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2.5'}
                        rounded-xl text-sm transition-all duration-150
                        ${active ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}
                      `}
                    >
                      {({ isActive: active }) => (
                        <>
                          {/* Active left bar */}
                          {active && !collapsed && (
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                              style={{ background: '#2DD4A0' }}
                            />
                          )}

                          {/* Active background */}
                          {active && (
                            <div
                              className="absolute inset-0 rounded-xl"
                              style={{
                                background: 'linear-gradient(90deg, rgba(45,212,160,0.08) 0%, transparent 100%)',
                                border: '1px solid rgba(45,212,160,0.12)',
                              }}
                            />
                          )}

                          {/* Hover background */}
                          {!active && (
                            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.04] transition-all duration-150" />
                          )}

                          {/* Icon */}
                          <item.icon
                            size={collapsed ? 17 : 15}
                            className={`relative z-10 shrink-0 transition-colors ${
                              active
                                ? 'text-[#2DD4A0]'
                                : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          />

                          {/* Label + badge — hidden when collapsed */}
                          {!collapsed && (
                            <>
                              <span className="relative z-10 flex-1 font-medium">{item.label}</span>

                              {item.badge && (
                                <span
                                  className={`relative z-10 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border tracking-wide ${
                                    BADGE_STYLES[item.badgeColor ?? 'violet']
                                  }`}
                                >
                                  {item.badge === 'LIVE' ? (
                                    <span className="flex items-center gap-1">
                                      <Radio size={7} className="animate-pulse text-emerald-400" />
                                      {item.badge}
                                    </span>
                                  ) : (
                                    item.badge
                                  )}
                                </span>
                              )}

                              {active && !item.badge && (
                                <div
                                  className="relative z-10 w-1.5 h-1.5 rounded-full"
                                  style={{ background: '#2DD4A0' }}
                                />
                              )}
                            </>
                          )}

                          {/* Collapsed: active dot indicator */}
                          {collapsed && active && (
                            <div
                              className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                              style={{ background: '#2DD4A0' }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User card */}
      {user && (
        <div className="shrink-0 p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <div
            onClick={toggleRole}
            title={collapsed ? `${user.name ?? user.email} · Click to switch role` : 'Click to switch role'}
            className="flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 hover:bg-white/[0.06] cursor-pointer group relative"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg,#065f46,#2DD4A0)',
                boxShadow: '0 0 12px rgba(45,212,160,0.25)',
              }}
            >
              {initials}
            </div>

            {/* Info — hidden when collapsed */}
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-purple-200 transition-colors">
                    {user.name ?? user.email}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield size={9} className="text-[#2DD4A0]" />
                    <span className="text-[10px] font-medium" style={{ color: '#2DD4A0' }}>
                      Administrator
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center shrink-0">
                  <span className="text-[8px] uppercase tracking-tighter text-slate-500 group-hover:text-purple-400 block transition-colors">
                    Switch
                  </span>
                  <Settings
                    size={13}
                    className="text-slate-600 group-hover:text-purple-300 group-hover:rotate-45 transition-all duration-300"
                  />
                </div>

                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  Click to switch role
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}