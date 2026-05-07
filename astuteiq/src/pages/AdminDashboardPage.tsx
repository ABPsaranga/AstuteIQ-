import { useState } from 'react'
import { Users, FileSearch, TrendingUp, AlertTriangle, UserPlus } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import ActivityChart from '../components/ActivityChart'
import InviteUserModal from '../components/InviteUserModal'
import RoleGuard from '../components/RoleGuard'

const TOP_USERS = [
  { name: 'Jane Planner',    email: 'jane@example.com.au',  reviews: 42, avgScore: 88 },
  { name: 'Mark Accountant', email: 'mark@example.com.au',  reviews: 31, avgScore: 76 },
  { name: 'Sarah Broker',    email: 'sarah@example.com.au', reviews: 27, avgScore: 91 },
  { name: 'Chris Adviser',   email: 'chris@example.com.au', reviews: 19, avgScore: 83 },
  { name: 'Emma Finance',    email: 'emma@example.com.au',  reviews: 14, avgScore: 72 },
]

export default function AdminDashboardPage() {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <RoleGuard roles="admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-header">Admin Dashboard</h1>
            <p className="page-sub">System-wide usage and user activity.</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="btn-primary">
            <UserPlus size={14} />
            Invite user
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total users"      value={133}    icon={Users}       />
          <StatCard label="Reviews this month" value={487}  icon={FileSearch}  variant="success" />
          <StatCard label="Platform avg score" value="83%"  icon={TrendingUp}  variant="success" />
          <StatCard label="Failed reviews"     value={29}   icon={AlertTriangle} variant="danger" />
        </div>

        {/* Activity chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Platform activity — last 14 days</h2>
          <ActivityChart height={200} />
        </div>

        {/* Top users table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-white">Top users by volume</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Reviews</th>
                <th className="text-left px-5 py-3">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {TOP_USERS.map((u) => (
                <tr key={u.email} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-slate-200">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{u.reviews}</td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${u.avgScore >= 80 ? 'text-green-400' : 'text-orange-400'}`}>
                      {u.avgScore}%
                    </span>
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
