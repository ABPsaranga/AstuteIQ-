import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useResetPassword } from '../features/auth/hooks'

export default function ResetPasswordPage() {
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [searchParams]              = useSearchParams()
  const token                       = searchParams.get('token') ?? ''
  const { resetPassword, loading }  = useResetPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) return
    resetPassword(token, password)
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
          <h2 className="text-lg font-semibold text-white mb-1">Set new password</h2>
          <p className="text-sm text-slate-400 mb-5">Must be at least 8 characters.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
              {password && confirm && password !== confirm && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password !== confirm || !password}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
