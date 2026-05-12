import { useEffect, useMemo, useState } from 'react'
import { UserPlus, Search, ShieldCheck, User, Trash2 } from 'lucide-react'
import InviteUserModal from '../components/InviteUserModal'
import RoleGuard from '../components/RoleGuard'
import toast from 'react-hot-toast'

import api from '../lib/api'

interface UserItem {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'user'
  reviews_count: number
  created_at: string
  active: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)

      const res = await api.get('/users')

      setUsers(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        search.trim() === '' ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  async function toggleRole(user: UserItem) {
    try {
      const updatedRole = user.role === 'admin' ? 'user' : 'admin'

      await api.patch(`/users/${user.id}/role`, {
        role: updatedRole,
      })

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, role: updatedRole }
            : u
        )
      )

      toast.success('Role updated')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update role')
    }
  }

  async function toggleActive(user: UserItem) {
    try {
      await api.patch(`/users/${user.id}/status`, {
        active: !user.active,
      })

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, active: !u.active }
            : u
        )
      )

      toast.success('Status updated')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  async function removeUser(user: UserItem) {
    const confirmed = window.confirm(
      `Remove ${user.full_name}?`
    )

    if (!confirmed) return

    try {
      await api.delete(`/users/${user.id}`)

      setUsers((prev) =>
        prev.filter((u) => u.id !== user.id)
      )

      toast.success('User removed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove user')
    }
  }

  return (
    <RoleGuard roles="admin">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-header">Users</h1>
            <p className="page-sub">
              Manage accounts and permissions.
            </p>
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="btn-primary"
          >
            <UserPlus size={14} />
            Invite user
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            className="input pl-9 h-9 text-sm"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Reviews</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-surface-border hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold uppercase shrink-0">
                          {u.full_name.charAt(0)}
                        </div>

                        <div>
                          <p className="text-slate-200">
                            {u.full_name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleRole(u)}
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                          u.role === 'admin'
                            ? 'border-brand-500/40 bg-brand-500/10 text-brand-300'
                            : 'border-surface-border text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <ShieldCheck size={11} />
                        ) : (
                          <User size={11} />
                        )}

                        {u.role}
                      </button>
                    </td>

                    <td className="px-5 py-3 text-slate-400">
                      {u.reviews_count}
                    </td>

                    <td className="px-5 py-3 text-slate-400">
                      {new Date(
                        u.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                          u.active
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-slate-600/30 bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        {u.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => removeUser(u)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showInvite && (
          <InviteUserModal
            onClose={() => {
              setShowInvite(false)
              loadUsers()
            }}
          />
        )}
      </div>
    </RoleGuard>
  )
}