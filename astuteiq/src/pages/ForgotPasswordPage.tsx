import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '../features/auth/hooks'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]          = useState('')
  const { sendReset, loading, sent } = useForgotPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendReset(email)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Astute<span className="text-brand-400">IQ</span>
          </h1>
        </div>

        <div className="card">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-4">
            <ArrowLeft size={13} /> Back to login
          </Link>

          {sent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle size={36} className="text-green-400 mx-auto" />
              <p className="text-white font-medium">Reset link sent</p>
              <p className="text-sm text-slate-400">Check your email for a link to reset your password.</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Forgot password?</h2>
              <p className="text-sm text-slate-400 mb-5">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@practice.com.au"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-2.5"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
