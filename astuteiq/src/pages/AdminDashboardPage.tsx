import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  FileSearch,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  Activity,
  Shield,
  Clock,
} from 'lucide-react'

import StatCard from '../components/ui/StatCard'
import ActivityChart from '../components/ActivityChart'
import InviteUserModal from '../components/InviteUserModal'
import RoleGuard from '../components/RoleGuard'

import apiClient from '../lib/api'
import { useReviewStore } from '../store/liveReviewStore'

interface AdminUser {
  id: string
  name: string
  email: string
  reviews: number
  avgScore: number
  lastActive?: string
}

interface AdminStats {
  totalUsers: number
  totalReviews: number
  completedReviews: number
  failedReviews: number
  processingReviews: number
  avgScore: number
}

export default function AdminDashboardPage() {
  const [showInvite, setShowInvite] = useState(false)

  const [loading, setLoading] = useState(true)

  const [users, setUsers] = useState<AdminUser[]>([])

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalReviews: 0,
    completedReviews: 0,
    failedReviews: 0,
    processingReviews: 0,
    avgScore: 0,
  })

  const { reviews: liveReviews, lastUpdated } =
    useReviewStore()

  async function loadDashboard() {
    try {
      setLoading(true)

      // reviews
      const reviewRes = await apiClient.get(
        '/api/reviews/history?page=1&limit=1000'
      )

      // users
      let usersRes: any = { data: [] }

      try {
        usersRes = await apiClient.get(
          '/api/admin/users'
        )
      } catch {
        //
      }

      const backendReviews =
        reviewRes.data?.reviews ?? []

      const merged = new Map<string, any>()

      backendReviews.forEach((r: any) =>
        merged.set(r.id, r)
      )

      liveReviews.forEach((r) =>
        merged.set(r.id, r)
      )

      const allReviews = Array.from(
        merged.values()
      )

      const completed = allReviews.filter(
        (r) => r.status === 'complete'
      )

      const failed = allReviews.filter(
        (r) => r.status === 'failed'
      )

      const processing = allReviews.filter(
        (r) => r.status === 'processing'
      )

      const avgScore = completed.length
        ? Math.round(
            completed.reduce(
              (sum: number, r: any) =>
                sum + (r.score ?? 0),
              0
            ) / completed.length
          )
        : 0

      setStats({
        totalUsers:
          usersRes.data?.length ?? 0,

        totalReviews: allReviews.length,

        completedReviews: completed.length,

        failedReviews: failed.length,

        processingReviews: processing.length,

        avgScore,
      })

      // build top users
      const grouped = new Map<string, AdminUser>()

      allReviews.forEach((review: any) => {
        const email =
          review.userEmail ??
          review.email ??
          'unknown@example.com'

        const existing = grouped.get(email)

        if (!existing) {
          grouped.set(email, {
            id: email,

            name:
              review.userName ??
              review.name ??
              email.split('@')[0],

            email,

            reviews: 1,

            avgScore:
              review.score ?? 0,

            lastActive:
              review.createdAt,
          })
        } else {
          existing.reviews += 1

          existing.avgScore =
            Math.round(
              (existing.avgScore +
                (review.score ?? 0)) /
                2
            )

          if (
            new Date(
              review.createdAt
            ).getTime() >
            new Date(
              existing.lastActive ??
                0
            ).getTime()
          ) {
            existing.lastActive =
              review.createdAt
          }
        }
      })

      const topUsers = Array.from(
        grouped.values()
      )
        .sort(
          (a, b) =>
            b.reviews - a.reviews
        )
        .slice(0, 10)

      setUsers(topUsers)
    } catch (err) {
      console.error(
        'Admin dashboard error:',
        err
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()

    const interval = setInterval(() => {
      loadDashboard()
    }, 15000)

    return () => clearInterval(interval)
  }, [lastUpdated])

  const systemHealth = useMemo(() => {
    if (!stats.totalReviews)
      return 'Healthy'

    const failureRate =
      (stats.failedReviews /
        stats.totalReviews) *
      100

    if (failureRate >= 20)
      return 'Critical'

    if (failureRate >= 10)
      return 'Warning'

    return 'Healthy'
  }, [stats])

  return (
    <RoleGuard roles="admin">
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-header">
              Admin Dashboard
            </h1>

            <p className="page-sub">
              Real-time platform analytics,
              reviews, user activity and
              operational monitoring.
            </p>
          </div>

          <button
            onClick={() =>
              setShowInvite(true)
            }
            className="btn-primary"
          >
            <UserPlus size={14} />
            Invite user
          </button>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">

          <StatCard
            label="Total users"
            value={
              loading
                ? '...'
                : stats.totalUsers
            }
            icon={Users}
          />

          <StatCard
            label="Total reviews"
            value={
              loading
                ? '...'
                : stats.totalReviews
            }
            icon={FileSearch}
            variant="success"
          />

          <StatCard
            label="Avg score"
            value={
              loading
                ? '...'
                : `${stats.avgScore}%`
            }
            icon={TrendingUp}
            variant="success"
          />

          <StatCard
            label="Failed reviews"
            value={
              loading
                ? '...'
                : stats.failedReviews
            }
            icon={AlertTriangle}
            variant="danger"
          />

          <StatCard
            label="Processing"
            value={
              loading
                ? '...'
                : stats.processingReviews
            }
            icon={Clock}
            variant="warning"
          />

          <StatCard
            label="System health"
            value={systemHealth}
            icon={Shield}
            variant={
              systemHealth ===
              'Healthy'
                ? 'success'
                : systemHealth ===
                  'Warning'
                ? 'warning'
                : 'danger'
            }
          />
        </div>

        {/* Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Platform activity
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Live review volume and
                scoring trends.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#2DD4A0]">
              <Activity
                size={12}
                className="animate-pulse"
              />
              LIVE
            </div>
          </div>

          <ActivityChart height={220} />
        </div>

        {/* Top users */}
        <div className="card p-0 overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Top users by review volume
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Updated automatically in
                real time.
              </p>
            </div>

            <div className="text-xs text-slate-500">
              {users.length} users
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">
                  User
                </th>

                <th className="text-left px-5 py-3">
                  Reviews
                </th>

                <th className="text-left px-5 py-3">
                  Avg score
                </th>

                <th className="text-left px-5 py-3">
                  Last active
                </th>
              </tr>
            </thead>

            <tbody>

              {loading &&
                [...Array(6)].map(
                  (_, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="skeleton h-4 rounded w-40" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="skeleton h-4 rounded w-16" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="skeleton h-4 rounded w-20" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="skeleton h-4 rounded w-24" />
                      </td>
                    </tr>
                  )
                )}

              {!loading &&
                users.map((u) => (
                  <tr
                    key={u.email}
                    className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-slate-200 font-medium">
                        {u.name}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {u.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-medium">
                      {u.reviews}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          u.avgScore >= 80
                            ? 'text-[#2DD4A0]'
                            : u.avgScore >=
                              60
                            ? 'text-[#FFB347]'
                            : 'text-[#FF6B6B]'
                        }`}
                      >
                        {u.avgScore}%
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {u.lastActive
                        ? new Date(
                            u.lastActive
                          ).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}

            </tbody>
          </table>
        </div>

        {showInvite && (
          <InviteUserModal
            onClose={() =>
              setShowInvite(false)
            }
          />
        )}
      </div>
    </RoleGuard>
  )
}