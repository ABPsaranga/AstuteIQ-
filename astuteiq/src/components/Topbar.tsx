import { useState } from 'react'
import {
  Bell,
  LogOut,
  Search,
  Sparkles,
  ChevronDown,
  Shield,
} from 'lucide-react'

import { useLogout } from '../features/auth/hooks'
import { useAuthStore } from '../features/auth/store'

export default function Topbar() {
  const { logout } = useLogout()
  const user = useAuthStore((s) => s.user)

  const [focused, setFocused] = useState(false)

  const isAdmin = user?.role === 'admin'

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b border-slate-800/70 px-4 md:px-6"
      style={{
        background: 'rgba(11,11,20,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="h-full flex items-center gap-4">

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div
            className={`relative transition-all duration-200 ${
              focused ? 'scale-[1.01]' : ''
            }`}
          >
            <Search
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                focused ? 'text-[#A78BFA]' : 'text-slate-500'
              }`}
            />

            <input
              placeholder="Search reviews, clients, compliance flags..."
              readOnly
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="
                w-full h-11 pl-10 pr-4 rounded-2xl
                bg-[#0f0f1a]/90
                border border-slate-800
                text-sm text-slate-200
                placeholder:text-slate-500
                outline-none
                transition-all duration-200
                focus:border-[#6B2FD9]/50
                focus:ring-2 focus:ring-[#6B2FD9]/20
              "
            />

            {/* Search hint */}
            <div className="hidden md:flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-[#151523]">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-[#151523]">
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">

          {/* Live status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2DD4A0]/20 bg-[#2DD4A0]/10">
            <span className="w-2 h-2 rounded-full bg-[#2DD4A0] animate-pulse" />
            <span className="text-xs font-medium text-[#2DD4A0]">
              AI systems operational
            </span>
          </div>

          {/* AI badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#6B2FD9]/25 bg-[#6B2FD9]/10 text-[#A78BFA]">
            <Sparkles size={13} />
            <span className="text-xs font-semibold">AstuteIQ AI</span>
          </div>

          {/* Notifications */}
          <button
            className="
              relative w-11 h-11 rounded-2xl
              border border-slate-800
              bg-[#0f0f1a]
              flex items-center justify-center
              text-slate-400
              hover:text-white
              hover:bg-slate-800/60
              hover:border-slate-700
              transition-all duration-200
            "
          >
            <Bell size={18} />

            {/* Notification dot */}
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF6B6B] opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B6B]" />
            </span>
          </button>

          {/* User card */}
          {user && (
            <div
              className="
                flex items-center gap-3
                pl-2 pr-3 py-1.5
                rounded-2xl
                border border-slate-800
                bg-[#0f0f1a]
                hover:bg-slate-800/50
                hover:border-slate-700
                transition-all duration-200
              "
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg"
                style={{
                  background: isAdmin
                    ? 'linear-gradient(135deg, #14532d, #2DD4A0)'
                    : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                }}
              >
                {initials}
              </div>

              {/* User info */}
              <div className="hidden md:block leading-tight">
                <p className="text-sm font-semibold text-white truncate max-w-[140px]">
                  {user.name ?? 'User'}
                </p>

                <div className="flex items-center gap-1.5 mt-0.5">
                  {isAdmin ? (
                    <Shield size={10} className="text-[#2DD4A0]" />
                  ) : (
                    <Sparkles size={10} className="text-[#A78BFA]" />
                  )}

                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color: isAdmin ? '#2DD4A0' : '#A78BFA',
                    }}
                  >
                    {isAdmin ? 'Administrator' : 'Paraplanner'}
                  </span>
                </div>
              </div>

              <ChevronDown
                size={14}
                className="hidden sm:block text-slate-600"
              />
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out"
            className="
              w-11 h-11 rounded-2xl
              border border-slate-800
              bg-[#0f0f1a]
              flex items-center justify-center
              text-slate-400
              hover:text-[#FF6B6B]
              hover:bg-[#FF6B6B]/10
              hover:border-[#FF6B6B]/20
              transition-all duration-200
            "
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}