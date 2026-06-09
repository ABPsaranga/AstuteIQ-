// src/components/admin/AdminTopbar.tsx

import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard, Bell, Search } from 'lucide-react'
import { useAuthStore } from '../../features/auth/store'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/admin':                  { title: 'Dashboard',       subtitle: 'Welcome back'                    },
  '/admin/users':            { title: 'User Management', subtitle: 'Manage accounts and access'      },
  '/admin/billing':          { title: 'Billing',         subtitle: 'Subscriptions and payments'      },
  '/admin/integrations':     { title: 'Integrations',    subtitle: 'Connected services and APIs'     },
  '/admin/logs':             { title: 'Activity Logs',   subtitle: 'System event history'            },
  '/admin/audit-logs':       { title: 'Audit Logs',      subtitle: 'Security and compliance trail'   },
  '/admin/live-monitoring':  { title: 'Live Monitoring', subtitle: 'Real-time platform health'       },
  '/admin/invitations':      { title: 'Invitations',     subtitle: 'Pending user invites'            },
  '/admin/permissions':      { title: 'Permissions',     subtitle: 'Roles and access control'        },
  '/admin/api-usage':        { title: 'API Usage',       subtitle: 'Usage metrics and quotas'        },
  '/admin/run-review':       { title: 'Run Review',      subtitle: 'Start a compliance review'       },
  '/admin/history':          { title: 'History',         subtitle: 'Past review records'             },
  '/admin/analytics':        { title: 'Analytics',       subtitle: 'Performance insights'            },
  '/admin/soa-analysis':     { title: 'SOA Analysis',    subtitle: 'Statement of advice analysis'    },
  '/admin/settings':         { title: 'Settings',        subtitle: 'Platform configuration'          },
}

export default function AdminTopbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const user         = useAuthStore((s) => s.user)

  const page    = TITLES[pathname] ?? { title: 'Admin', subtitle: 'Control panel' }
  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase()
  const name    = user?.name || user?.email || 'Admin'

  return (
    <header
      className="flex h-[57px] shrink-0 items-center justify-between px-6 backdrop-blur-sm"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        background: 'rgba(6,8,16,0.85)',
      }}
    >
      {/* Left — page title */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-white leading-none">
            {page.title}
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">

        {/* Search */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}
        >
          <Search size={13} />
          <span>Search...</span>
          <span
            className="ml-1 px-1 rounded text-[10px]"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#64748b' }}
          >
            ⌘K
          </span>
        </button>

        {/* Switch to User Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all duration-150"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
          }}
          title="Switch to user dashboard"
        >
          <LayoutDashboard size={13} />
          User Dashboard
        </button>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}
        >
          <Bell size={14} />
          {/* Notification dot */}
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#2DD4A0' }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Admin badge */}
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
          style={{
            background: 'rgba(45,212,160,0.1)',
            border: '1px solid rgba(45,212,160,0.2)',
            color: '#2DD4A0',
          }}
        >
          <ShieldCheck size={10} />
          Admin
        </span>
      </div>
    </header>
  )
}