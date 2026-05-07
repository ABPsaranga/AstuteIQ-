import { useState } from 'react'
import { useAuthStore } from '../features/auth/store'
import { User, Bell, Shield, Key, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${
        value ? 'bg-[#6B2FD9]' : 'bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  const [name, setName]   = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)

  const [emailAlerts, setEmailAlerts] = useState(true)
  const [autoExport, setAutoExport]   = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)

  const isAdmin   = user?.role === 'admin'
  const roleLabel = isAdmin ? 'Admin' : 'Paraplanner'
  const roleColor = isAdmin ? '#2DD4A0' : '#A78BFA'
  const roleBg    = isAdmin ? 'rgba(45,212,160,0.1)' : 'rgba(107,47,217,0.1)'
  const roleBorder = isAdmin ? 'rgba(45,212,160,0.25)' : 'rgba(107,47,217,0.25)'

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    // Replace with real Supabase user update:
    // await supabase.auth.updateUser({ data: { name } })
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    toast.success('Profile updated.')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    // Replace with real Supabase password reset:
    // await supabase.auth.resetPasswordForEmail(email)
    await new Promise((r) => setTimeout(r, 600))
    toast.success('Password reset link sent — check your inbox.')
  }

  function handleToggle(_label: string, setter: (v: boolean) => void, value: boolean) {
    setter(!value)
    toast.success('Preference saved.')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-header">Settings</h1>
        <p className="page-sub">Manage your account and preferences.</p>
      </div>

      {/* ── Profile ── */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <User size={14} className="text-[#A78BFA]" />
          <h2 className="text-sm font-semibold text-white">Profile</h2>
        </div>

        {/* Avatar + role badge */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            style={{
              background: isAdmin
                ? 'linear-gradient(135deg, #1a4a3a, #2DD4A0)'
                : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
            }}
          >
            {(name || email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name || email || 'User'}</p>
            <div
              className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border"
              style={{ color: roleColor, background: roleBg, borderColor: roleBorder }}
            >
              {isAdmin ? <ShieldCheck size={11} /> : <User size={11} />}
              {roleLabel}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                placeholder="Sarah Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Role</label>
            <div
              className="w-full px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 cursor-not-allowed"
              style={{
                background: roleBg,
                borderColor: roleBorder,
                color: roleColor,
              }}
            >
              {isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
              {roleLabel}
              <span className="ml-auto text-xs opacity-50 font-normal">read-only</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Save profile'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Notifications ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Bell size={14} className="text-[#A78BFA]" />
          <h2 className="text-sm font-semibold text-white">Notifications</h2>
        </div>

        {[
          {
            label:   'Email alerts on review completion',
            desc:    'Receive an email each time a review finishes processing.',
            value:   emailAlerts,
            setter:  setEmailAlerts,
          },
          {
            label:   'Weekly digest',
            desc:    'Summary of all reviews run in the past 7 days.',
            value:   weeklyDigest,
            setter:  setWeeklyDigest,
          },
          {
            label:   'Auto-export Word report on completion',
            desc:    'Automatically download the Word report when a review finishes.',
            value:   autoExport,
            setter:  setAutoExport,
          },
        ].map(({ label, desc, value, setter }) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-200">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <Toggle value={value} onChange={(v) => handleToggle(label, setter, v)} />
          </div>
        ))}
      </div>

      {/* ── Security ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Shield size={14} className="text-[#A78BFA]" />
          <h2 className="text-sm font-semibold text-white">Security</h2>
        </div>

        <form onSubmit={handleChangePassword} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-200">Password</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Send a password reset link to <span className="text-slate-400">{email}</span>
            </p>
          </div>
          <button type="submit" className="btn-secondary shrink-0">
            <Key size={13} />
            Reset password
          </button>
        </form>

        {/* ISO note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <ShieldCheck size={14} className="text-[#2DD4A0] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Astute Business Partners is ISO 27001 certified. All data is encrypted in transit and at rest.
            Authentication is managed by Supabase with row-level security enabled.
          </p>
        </div>
      </div>
    </div>
  )
}