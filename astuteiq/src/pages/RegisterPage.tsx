import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '../features/auth/hooks'
import {
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Lock,
} from 'lucide-react'

type Role = 'user'

const ROLE = {
  value: 'user' as Role,
  label: 'Paraplanner',
  desc: 'Run reviews & export reports',
  dest: 'User dashboard',
  icon: User,
  color: 'text-[#A78BFA]',
  border: 'border-[#6B2FD9] bg-[#6B2FD9]/10',
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [practice, setPractice] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [strength, setStrength] = useState(0)

  const { register, loading } = useRegister()

  function checkStrength(pw: string) {
    let score = 0

    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    setStrength(score)
    setPassword(pw)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // ALL public registrations are normal users/paraplanners
    register(name, email, password, practice, 'user')
  }

  const strengthMeta = [
    { label: 'Weak', color: '#FF6B6B' },
    { label: 'Fair', color: '#FFB347' },
    { label: 'Good', color: '#FFB347' },
    { label: 'Strong', color: '#2DD4A0' },
    { label: 'Very strong', color: '#2DD4A0' },
  ][strength] ?? { label: '', color: '' }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#0B0B14' }}
    >
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="
            absolute -top-40 left-1/2 -translate-x-1/2
            w-[600px] h-[400px]
            rounded-full opacity-15
          "
          style={{
            background:
              'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <h1
            className="text-4xl font-bold text-white"
            style={{
              fontFamily:
                "'DM Serif Display', Georgia, serif",
            }}
          >
            Astute
            <span style={{ color: '#A78BFA' }}>
              IQ
            </span>
          </h1>

          <p className="text-slate-500 text-sm">
            Create your paraplanner account
          </p>
        </div>

        {/* Access Notice */}
        <div
          className="
            rounded-2xl border border-amber-500/20
            bg-amber-500/5 p-4
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                flex h-10 w-10 shrink-0 items-center
                justify-center rounded-xl
                bg-amber-500/10
              "
            >
              <Lock
                size={18}
                className="text-amber-400"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-300">
                Admin access is restricted
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Only practice administrators can access the
                Admin Dashboard. Admin accounts must be
                invited by an existing administrator.
              </p>
            </div>
          </div>
        </div>

        {/* User Role Card */}
        <div
          className={`
            flex flex-col items-center gap-2
            rounded-2xl border-2 p-4
            ${ROLE.border}
          `}
        >
          <div className="rounded-xl bg-white/10 p-2">
            <ROLE.icon
              size={18}
              className={ROLE.color}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-white">
              {ROLE.label}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {ROLE.desc}
            </p>

            <p
              className="mt-2 text-xs font-medium"
              style={{ color: '#A78BFA' }}
            >
              → {ROLE.dest}
            </p>
          </div>
        </div>

        {/* Form */}
        <div
          className="
            rounded-2xl border border-slate-800
            bg-[#0f0f1a] p-6
            shadow-2xl
          "
        >
          <div className="mb-5 flex items-center gap-2">
            <User
              size={14}
              className="text-[#A78BFA]"
            />

            <h2 className="text-sm font-semibold text-white">
              Register as Paraplanner
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="label">
                Full name
              </label>

              <input
                className="input"
                placeholder="Sarah Johnson"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="label">
                Work email
              </label>

              <input
                type="email"
                className="input"
                placeholder="you@practice.com.au"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="label">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) =>
                    checkStrength(e.target.value)
                  }
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPw((v) => !v)
                  }
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-slate-500
                    transition-colors
                    hover:text-slate-300
                  "
                >
                  {showPw ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="
                          h-1 flex-1 rounded-full
                          transition-colors duration-300
                        "
                        style={{
                          background:
                            i <= strength
                              ? strengthMeta.color
                              : '#1e1e30',
                        }}
                      />
                    ))}
                  </div>

                  <p
                    className="text-xs"
                    style={{
                      color: strengthMeta.color,
                    }}
                  >
                    {strengthMeta.label}
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div
              className="
                rounded-xl border
                border-[#6B2FD9]/20
                bg-[#6B2FD9]/5
                px-3 py-2.5
                text-xs leading-relaxed
                text-[#A78BFA]
              "
            >
              Your account will have access to the
              paraplanner dashboard and SOA review tools.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                flex w-full items-center
                justify-center gap-2
                rounded-xl py-2.5
                text-sm font-semibold text-white
                transition-all duration-150
                disabled:opacity-50
              "
              style={{
                background: '#6B2FD9',
              }}
            >
              {loading ? (
                <span
                  className="
                    h-4 w-4 animate-spin rounded-full
                    border-2 border-current
                    border-t-transparent
                  "
                />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="pt-4 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="
                text-[#A78BFA]
                transition-colors
                hover:text-[#c4b5fd]
              "
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-700">
          Astute Business Partners · ISO 27001 certified
        </p>
      </div>
    </div>
  )
}