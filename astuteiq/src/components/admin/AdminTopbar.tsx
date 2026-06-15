import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  Search,
} from 'lucide-react'
import { useAuthStore } from '../../features/auth/store'
import { useMemo, useRef, useState } from 'react'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/admin/users': { title: 'User Management', subtitle: 'Manage accounts and access' },
  '/admin/billing': { title: 'Billing', subtitle: 'Subscriptions and payments' },
  '/admin/integrations': { title: 'Integrations', subtitle: 'Connected services and APIs' },
  '/admin/logs': { title: 'Activity Logs', subtitle: 'System event history' },
  '/admin/audit-logs': { title: 'Audit Logs', subtitle: 'Security and compliance trail' },
  '/admin/live-monitoring': { title: 'Live Monitoring', subtitle: 'Real-time platform health' },
  '/admin/invitations': { title: 'Invitations', subtitle: 'Pending user invites' },
  '/admin/permissions': { title: 'Permissions', subtitle: 'Roles and access control' },
  '/admin/api-usage': { title: 'API Usage', subtitle: 'Usage metrics and quotas' },
  '/admin/run-review': { title: 'Run Review', subtitle: 'Start a compliance review' },
  '/admin/history': { title: 'History', subtitle: 'Past review records' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Performance insights' },
  '/admin/soa-analysis': { title: 'SOA Analysis', subtitle: 'Statement of advice analysis' },
  '/admin/settings': { title: 'Settings', subtitle: 'Platform configuration' },
}

interface Notification {
  id?: string | number
  message: string
  created_at?: string
}

export default function AdminTopbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)

  // Notifications backend endpoint doesn't exist yet — kept as an empty
  // array so the bell UI renders without making a failing API call.
  // TODO: wire up GET /api/notifications once the backend route exists.
  const [notifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  const page =
    TITLES[pathname] ?? {
      title: 'Admin',
      subtitle: 'Control panel',
    }

  useMemo(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    return Object.entries(TITLES)
      .filter(([path, data]) => {
        const q = search.toLowerCase()

        return (
          data.title.toLowerCase().includes(q) ||
          data.subtitle.toLowerCase().includes(q) ||
          path.toLowerCase().includes(q)
        )
      })
      .slice(0, 8)
  }, [search])

  return (
    <header
      className="flex h-[57px] shrink-0 items-center justify-between px-6 backdrop-blur-sm"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        background: 'rgba(6,8,16,0.85)',
      }}
    >
      <div>
        <h1 className="text-sm font-semibold text-white leading-none">
          {page.title}
        </h1>

        <p className="text-[11px] text-slate-500 mt-0.5">
          {page.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">

        <div ref={searchRef} className="relative hidden md:block">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg w-72"
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <Search size={14} className="text-slate-500" />

            <input
              type="text"
              value={search}
              placeholder="Search pages..."
              onFocus={() => setShowResults(true)}
              onChange={(e) => {
                setSearch(e.target.value)
                setShowResults(true)
              }}
              className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
            />
          </div>

          {showResults && searchResults.length > 0 && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden z-50"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#0f172a',
              }}
            >
              {searchResults.map(([path, data]) => (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path)
                    setSearch('')
                    setShowResults(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-none"
                >
                  <div className="text-sm text-white">
                    {data.title}
                  </div>

                  <div className="text-xs text-slate-400">
                    {data.subtitle}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all duration-150"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <LayoutDashboard size={13} />
          Admin Dashboard
        </button>

        <div ref={notificationRef} className="relative">
          <button
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
            className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white transition-colors"
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <Bell size={14} />

            {notifications.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: '#2DD4A0' }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-96 rounded-xl overflow-hidden z-50"
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="px-4 py-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">
                  Notifications
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">
                    No notifications available
                  </div>
                ) : (
                  notifications.map((item, index) => (
                    <div
                      key={item.id ?? index}
                      className="p-4 border-b border-slate-800 hover:bg-slate-800 transition-colors"
                    >
                      <p className="text-sm text-white">
                        {item.message}
                      </p>

                      {item.created_at && (
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="w-px h-5 mx-1"
          style={{
            background: 'rgba(255,255,255,0.07)',
          }}
        />
      </div>
    </header>
  )
}