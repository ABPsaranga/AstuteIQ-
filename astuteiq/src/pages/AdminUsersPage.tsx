import { useEffect, useMemo, useState } from 'react'
import {
  UserPlus,
  Search,
  ShieldCheck,
  User,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

import InviteUserModal from '../components/InviteUserModal'
import RoleGuard from '../components/RoleGuard'

import api from '../lib/api'
import supabase from '../lib/supabase'

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

      // DEBUGGING
      const localToken = localStorage.getItem('token')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.group('ADMIN USERS DEBUG')
      console.log('Local Token:', localToken)
      console.log(
        'Supabase Session:',
        session ? 'EXISTS' : 'MISSING'
      )
      console.log(
        'Supabase Access Token:',
        session?.access_token
      )
      console.groupEnd()

      const res = await api.get('/admin/users')

      console.log('Users Response:', res.data)

      setUsers(res.data)
    } catch (err: any) {
      console.error('Admin Users Error:', err)

      if (err.response) {
        console.error(
          'Status:',
          err.response.status
        )

        console.error(
          'Response:',
          err.response.data
        )

        if (err.response.status === 401) {
          toast.error(
            'Unauthorized. Please login again.'
          )
        } else {
          toast.error('Failed to load users')
        }
      } else {
        toast.error('Failed to connect to server')
      }
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        search.trim() === '' ||
        u.full_name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        u.email
          .toLowerCase()
          .includes(search.toLowerCase())
    )
  }, [users, search])

  async function toggleRole(user: UserItem) {
    try {
      const updatedRole =
        user.role === 'admin' ? 'user' : 'admin'

      await api.patch('/admin/users/role', {
        user_id: user.id,
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
      await api.delete(`/admin/users/${user.id}`)

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
        <div className="flex flex-wrap items-start justify-between gap-4">
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
            Invite User
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            className="input h-9 pl-9 text-sm"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 text-left">
                  User
                </th>
                <th className="px-5 py-3 text-left">
                  Role
                </th>
                <th className="px-5 py-3 text-left">
                  Reviews
                </th>
                <th className="px-5 py-3 text-left">
                  Joined
                </th>
                <th className="px-5 py-3 text-left">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-800 transition-colors hover:bg-slate-900/20"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold uppercase text-violet-400">
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
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${
                          u.role === 'admin'
                            ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                            : 'border-slate-700 text-slate-400'
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
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${
                          u.active
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-slate-600/30 bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        {u.active
                          ? 'Active'
                          : 'Inactive'}
                      </button>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => removeUser(u)}
                        className="text-slate-600 transition-colors hover:text-red-400"
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