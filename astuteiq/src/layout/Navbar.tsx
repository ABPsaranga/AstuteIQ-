import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store'
import { useLogout } from '../features/auth/hooks'

import {
  LayoutDashboard,
  Clock,
  FileSearch,
  Home,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
  Menu,
  X,
} from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/soa-analysis', label: 'Run Review', icon: FileSearch },
  { to: '/history', label: 'History', icon: Clock },
]

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()

  const location = useLocation()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)

    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [])

  function handleLogout() {
    setOpen(false)
    setMobileOpen(false)

    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isActive = (path: string) => location.pathname === path

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/5"
      style={{
        background: 'rgba(11,11,20,0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2 shrink-0"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform duration-200 group-hover:scale-105"
              style={{
                background:
                  'linear-gradient(135deg, #6B2FD9 0%, #A78BFA 100%)',
              }}
            >
              AI
            </div>

            <div className="leading-tight">
              <p
                className="text-lg font-bold text-white tracking-tight"
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                }}
              >
                Astute<span style={{ color: '#A78BFA' }}>IQ</span>
              </p>

              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 -mt-0.5">
                SOA Compliance
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = isActive(to)

              return (
                <Link
                  key={to}
                  to={to}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl
                    text-sm font-medium transition-all duration-200
                    ${
                      active
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                    }
                  `}
                  style={{
                    background: active
                      ? 'rgba(107,47,217,0.18)'
                      : 'transparent',
                    border: active
                      ? '1px solid rgba(167,139,250,0.18)'
                      : '1px solid transparent',
                    boxShadow: active
                      ? '0 0 24px rgba(107,47,217,0.18)'
                      : 'none',
                  }}
                >
                  <Icon
                    size={15}
                    className={active ? 'text-[#A78BFA]' : ''}
                  />

                  {label}

                  {active && (
                    <div
                      className="absolute inset-x-3 -bottom-px h-px rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, #A78BFA, transparent)',
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Admin badge */}
            {isAdmin && (
              <div
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  background: 'rgba(45,212,160,0.08)',
                  color: '#2DD4A0',
                  borderColor: 'rgba(45,212,160,0.16)',
                }}
              >
                <Shield size={11} />
                Admin
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-10 h-10 rounded-xl border border-slate-800 bg-[#11111b] flex items-center justify-center text-slate-300"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {user ? (
              <div className="relative hidden md:block" ref={dropRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="
                    flex items-center gap-2
                    pl-2 pr-3 py-1.5 rounded-2xl
                    border border-slate-800
                    bg-[#11111b]
                    hover:border-slate-700
                    hover:bg-slate-800/50
                    transition-all duration-200
                  "
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg"
                    style={{
                      background: isAdmin
                        ? 'linear-gradient(135deg, #1f6b54, #2DD4A0)'
                        : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                    }}
                  >
                    {initials}
                  </div>

                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-white leading-tight">
                      {user.name ?? 'User'}
                    </p>

                    <p className="text-[11px] text-slate-500 leading-tight">
                      {isAdmin ? 'Administrator' : 'Paraplanner'}
                    </p>
                  </div>

                  <ChevronDown
                    size={14}
                    className={`text-slate-500 transition-transform duration-200 ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {open && (
                  <div
                    className="
                      absolute right-0 mt-3 w-64
                      rounded-3xl overflow-hidden
                      border border-slate-800
                      shadow-2xl
                      animate-in fade-in zoom-in-95 duration-150
                    "
                    style={{
                      background: '#11111b',
                    }}
                  >
                    {/* User */}
                    <div className="p-5 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
                          style={{
                            background: isAdmin
                              ? 'linear-gradient(135deg, #1f6b54, #2DD4A0)'
                              : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                          }}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.name ?? 'User'}
                          </p>

                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="p-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setOpen(false)}
                        className="
                          flex items-center gap-3
                          px-3 py-2.5 rounded-xl
                          text-sm text-slate-300
                          hover:text-white
                          hover:bg-slate-800/60
                          transition-colors
                        "
                      >
                        <LayoutDashboard size={15} />
                        Dashboard
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setOpen(false)}
                        className="
                          flex items-center gap-3
                          px-3 py-2.5 rounded-xl
                          text-sm text-slate-300
                          hover:text-white
                          hover:bg-slate-800/60
                          transition-colors
                        "
                      >
                        <Settings size={15} />
                        Settings
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="
                          flex items-center gap-3
                          w-full px-3 py-2.5 rounded-xl
                          text-sm text-[#FF6B6B]
                          hover:bg-[#FF6B6B]/10
                          transition-colors
                        "
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="
                  hidden md:inline-flex
                  items-center justify-center
                  px-5 py-2.5 rounded-xl
                  text-sm font-semibold text-white
                  transition-all duration-200
                  hover:scale-[1.02]
                "
                style={{
                  background:
                    'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
                  boxShadow: '0 0 28px rgba(107,47,217,0.28)',
                }}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-3xl border border-slate-800 bg-[#11111b] overflow-hidden">

              <div className="p-2">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to)

                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3
                        px-4 py-3 rounded-2xl
                        text-sm transition-colors
                        ${
                          active
                            ? 'text-white bg-[#6B2FD9]/20'
                            : 'text-slate-400'
                        }
                      `}
                    >
                      <Icon
                        size={16}
                        className={active ? 'text-[#A78BFA]' : ''}
                      />

                      {label}
                    </Link>
                  )
                })}
              </div>

              {user && (
                <>
                  <div className="border-t border-slate-800 p-2">
                    <Link
                      to="/settings"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-slate-300"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm text-[#FF6B6B]"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}

              {!user && (
                <div className="p-4 border-t border-slate-800">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="
                      flex items-center justify-center
                      w-full py-3 rounded-2xl
                      text-sm font-semibold text-white
                    "
                    style={{
                      background:
                        'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
                    }}
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}