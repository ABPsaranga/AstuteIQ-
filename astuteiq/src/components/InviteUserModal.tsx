import { useState } from 'react'
import { X, Mail, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
}

export default function InviteUserModal({ onClose }: Props) {
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState<'user' | 'admin'>('user')
  const [loading, setLoading] = useState(false)

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true)
    // Mock invite call
    await new Promise((r) => setTimeout(r, 800))
    toast.success(`Invite sent to ${email}`)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md mx-4 animate-slide-up">
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

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                className="input pl-9"
                placeholder="advisor@practice.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            className="btn-primary"
          >
            {loading ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
