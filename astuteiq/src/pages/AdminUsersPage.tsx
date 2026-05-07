import { useState } from 'react'
import { UserPlus, Search, ShieldCheck, User, Trash2 } from 'lucide-react'
import InviteUserModal from '../components/InviteUserModal'
import RoleGuard from '../components/RoleGuard'
import toast from 'react-hot-toast'

interface MockUser {
  id:       string
  name:     string
  email:    string
  role:     'admin' | 'user'
  reviews:  number
  joinedAt: string
  active:   boolean
}

const INITIAL_USERS: MockUser[] = [
  { id: 'u1', name: 'Admin User',    email: 'admin@astuteiq.com.au', role: 'admin', reviews: 0,  joinedAt: '2024-01-10', active: true  },
  { id: 'u2', name: 'Jane Planner',  email: 'user@astuteiq.com.au',  role: 'user',  reviews: 42, joinedAt: '2024-02-14', active: true  },
  { id: 'u3', name: 'Mark Advisor',  email: 'mark@demo.com.au',      role: 'user',  reviews: 31, joinedAt: '2024-03-01', active: true  },
  { id: 'u4', name: 'Sarah Broker',  email: 'sarah@demo.com.au',     role: 'user',  reviews: 27, joinedAt: '2024-04-22', active: false },
  { id: 'u5', name: 'Chris Finance', email: 'chris@demo.com.au',     role: 'user',  reviews: 19, joinedAt: '2024-05-05', active: true  },
]

export default function AdminUsersPage() {
  const [users, setUsers]         = useState<MockUser[]>(INITIAL_USERS)
  const [search, setSearch]       = useState('')
  const [showInvite, setShowInvite] = useState(false)

  const filtered = users.filter(
    (u) =>
      search.trim() === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  function toggleRole(id: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u
      )
    )
    toast.success('Role updated.')
  }

  function toggleActive(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    )
    toast.success('User status updated.')
  }

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    toast.success('User removed.')
  }

  return (
    <RoleGuard roles="admin">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-header">Users</h1>
            <p className="page-sub">Manage accounts and permissions.</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="btn-primary">
            <UserPlus size={14} />
            Invite user
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9 h-9 text-sm"
            placeholder="Search users…"
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
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold uppercase shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-slate-200">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleRole(u.id)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                        u.role === 'admin'
                          ? 'border-brand-500/40 bg-brand-500/10 text-brand-300'
                          : 'border-surface-border text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {u.role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
                      {u.role}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{u.reviews}</td>
                  <td className="px-5 py-3 text-slate-400">{u.joinedAt}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(u.id)}
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
                      onClick={() => removeUser(u.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Remove user"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} />}
      </div>
    </RoleGuard>
  )
}
