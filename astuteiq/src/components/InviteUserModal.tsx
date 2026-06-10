import { useState } from 'react'
import { X, Mail, UserPlus, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api'

interface Props {
  onClose: () => void
}

export default function InviteUserModal({ onClose }: Props) {
  const [email,   setEmail]   = useState('')
  const [role,    setRole]    = useState<'user' | 'admin'>('user')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleInvite() {
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Real backend call — service-role key stays server-side in auth.py
      await apiClient.post('/auth/invite', 
        {
           user_email: email.trim(), 
           user_role: role 
        }
      )
      toast.success(`Invite sent to ${email.trim()}`)
      onClose()
    } catch (err: any) {
        console.error('Invite Error:', err.response?.data)

        setError(
          JSON.stringify(
            err.response?.data ?? err.message,
            null,
            2
          )
        )
      }
    finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && email.trim() && !loading) handleInvite()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      // Click outside to close
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="card w-full max-w-md mx-4 animate-slide-up"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <UserPlus size={17} className="text-brand-400" />
            Invite User
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex gap-2 items-start p-3 mb-4 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-sm text-[#FF6B6B]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                autoFocus
                className="input pl-9"
                placeholder="adviser@practice.com.au"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
              />
            </div>
          </div>

          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            >
              <option value="user">User — can run reviews</option>
              <option value="admin">Admin — full access</option>
            </select>
            {role === 'admin' && (
              <p className="text-xs text-[#FFB347] mt-1.5">
                Admin users can manage all reviews, users, and platform settings.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!email.trim() || loading}
            className="btn-primary inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              'Send invite'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}