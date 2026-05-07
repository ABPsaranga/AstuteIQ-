import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '../features/auth/hooks'
import { Eye, EyeOff, ShieldCheck, User } from 'lucide-react'

type Role = 'user' | 'admin'

const ROLES: {
  value: Role; label: string; desc: string; dest: string
  icon: typeof User; color: string; border: string
}[] = [
  {
    value:  'user',
    label:  'Paraplanner',
    desc:   'Run reviews & export reports',
    dest:   'User dashboard',
    icon:   User,
    color:  'text-[#A78BFA]',
    border: 'border-[#6B2FD9] bg-[#6B2FD9]/10',
  },
  {
    value:  'admin',
    label:  'Admin',
    desc:   'Manage practice & team access',
    dest:   'Admin dashboard',
    icon:   ShieldCheck,
    color:  'text-[#2DD4A0]',
    border: 'border-[#2DD4A0] bg-[#2DD4A0]/10',
  },
]

export default function RegisterPage() {
  const [role, setRole]         = useState<Role>('user')
  const [name, setName]         = useState('')
  const [practice, setPractice] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [strength, setStrength] = useState(0)

  const { register, loading } = useRegister()

  function checkStrength(pw: string) {
    let score = 0
    if (pw.length >= 8)           score++
    if (/[A-Z]/.test(pw))        score++
    if (/[0-9]/.test(pw))        score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    setStrength(score)
    setPassword(pw)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    register(name, email, password, practice, role)
  }

  const active = ROLES.find((r) => r.value === role)!
  const strengthMeta = [
    { label: 'Weak',        color: '#FF6B6B' },
    { label: 'Fair',        color: '#FFB347' },
    { label: 'Good',        color: '#FFB347' },
    { label: 'Strong',      color: '#2DD4A0' },
    { label: 'Very strong', color: '#2DD4A0' },
  ][strength] ?? { label: '', color: '' }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#0B0B14' }}
    >
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1">
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Astute<span style={{ color: '#A78BFA' }}>IQ</span>
          </h1>
          <p className="text-slate-500 text-sm">Create your account</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(({ value, label, desc, dest, icon: Icon, color, border }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${
                role === value
                  ? border
                  : 'border-slate-800 bg-[#0f0f1a] hover:border-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl ${role === value ? 'bg-white/10' : 'bg-slate-800'}`}>
                <Icon size={16} className={role === value ? color : 'text-slate-500'} />
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${role === value ? 'text-white' : 'text-slate-400'}`}>
                  {label}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
                {role === value && (
                  <p className="text-xs mt-1 font-medium" style={{ color: role === 'admin' ? '#2DD4A0' : '#A78BFA' }}>
                    → {dest}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-800 bg-[#0f0f1a] p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <active.icon size={14} className={active.color} />
            <h2 className="text-sm font-semibold text-white">
              Register as {active.label}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                placeholder="Sarah Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Practice name</label>
              <input
                className="input"
                placeholder="Astute Financial Planning"
                value={practice}
                onChange={(e) => setPractice(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder={role === 'admin' ? 'admin@practice.com.au' : 'you@practice.com.au'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => checkStrength(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-colors duration-300"
                        style={{ background: i <= strength ? strengthMeta.color : '#1e1e30' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthMeta.color }}>
                    {strengthMeta.label}
                  </p>
                </div>
              )}
            </div>

            {/* Role + destination summary */}
            <div
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs leading-relaxed"
              style={{
                background:  role === 'admin' ? 'rgba(45,212,160,0.05)' : 'rgba(107,47,217,0.05)',
                borderColor: role === 'admin' ? 'rgba(45,212,160,0.2)'  : 'rgba(107,47,217,0.2)',
                color:       role === 'admin' ? '#2DD4A0'               : '#A78BFA',
              }}
            >
              <active.icon size={12} className="mt-0.5 shrink-0" />
              <span>
                Registering as <strong>{active.label}</strong> —{' '}
                {role === 'admin'
                  ? 'you will be taken to the Admin dashboard.'
                  : 'you will be taken to the User dashboard.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50"
              style={{
                background: role === 'admin' ? '#1a4a3a' : '#6B2FD9',
                border:     role === 'admin' ? '1px solid rgba(45,212,160,0.3)' : 'none',
                color:      role === 'admin' ? '#2DD4A0' : 'white',
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                `Create ${active.label} account`
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-[#A78BFA] hover:text-[#c4b5fd] transition-colors">
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