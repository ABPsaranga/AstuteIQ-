import { useEffect, useState } from 'react'
import { Mail, UserPlus, Check, Clock, X } from 'lucide-react'
import api from '../lib/api'

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  updated_at: string

}

export default function AdminInvitationsPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [invites, setInvites] = useState<Invitation[]>([])
  const [error, setError] = useState<string | null>(null)

  async function loadInvitations() {
    try {
      setLoading(true)
      const res = await api.get('/admin/invitations')
      setInvites(res.data?.invitations || res.data || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  async function sendInvite() {
    if (!email) {
      setError('Please enter an email')
      return
    }

    try {
      setSending(true)
      await api.post('/admin/invitations/send', {
        email,
        role,
      })

      setEmail('')
      setError(null)
      loadInvitations()
    } catch (err) {
      console.error(err)
      setError('Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check size={16} className="text-emerald-400" />
      case 'pending':
        return <Clock size={16} className="text-amber-400" />
      case 'expired':
        return <X size={16} className="text-red-400" />
      default:
        return <Clock size={16} className="text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Invitations</h1>
        <p className="text-slate-500 mt-1">
          Invite new users into the platform
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <X size={16} className="text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="grid gap-4 md:grid-cols-3">

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white placeholder-slate-500"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white"
          >
            <option value="user">User</option>
            <option value="paraplanner">Paraplanner</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={sendInvite}
            disabled={sending}
            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <UserPlus size={16} />
            {sending ? 'Sending...' : 'Send Invite'}
          </button>

        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-950">
            <tr>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Created</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  Loading invitations...
                </td>
              </tr>
            ) : invites.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  No invitations sent yet
                </td>
              </tr>
            ) : (
              invites.map((invite) => (
                <tr key={invite.id} className="border-t border-slate-800">
                  <td className="p-4 text-white">{invite.email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-300 capitalize">
                      {invite.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invite.status)}
                      <span className="capitalize text-sm">{invite.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

      </div>

    </div>
  )
}