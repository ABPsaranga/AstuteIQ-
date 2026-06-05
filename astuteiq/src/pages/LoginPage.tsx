import { useState } from 'react'
import { useLogin } from '../features/auth/hooks'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const { login, loading } = useLogin()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login(email, password)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#0B0B14' }}
    >
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-slate-800 bg-[#0f0f1a] p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-white">
              AstuteIQ
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>

              <input
                type="email"
                className="input"
                placeholder="your@practice.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>

              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 disabled:opacity-50"
              style={{
                background: '#6B2FD9',
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-700">
          Astute Business Partners · ISO 27001 Certified
        </p>
      </div>
    </div>
  )
}