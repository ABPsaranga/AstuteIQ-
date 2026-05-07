import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch, PlayCircle, Clock, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../features/auth/store'
import { useReviewHistory } from '../features/reviews/hooks'
import StatCard from '../components/ui/StatCard'
import ActivityChart from '../components/ActivityChart'
import { format, isThisWeek } from 'date-fns'

export default function UserDashboardPage() {
  const user                     = useAuthStore((s) => s.user)
  const { data, loading, fetch } = useReviewHistory()

  useEffect(() => {
    fetch(1, 100)
  }, [fetch])

  const reviews   = data?.reviews ?? []
  const recent    = reviews.slice(0, 5)
  const firstName = (user?.name ?? user?.email ?? 'there').split(' ')[0]

  const stats = useMemo(() => {
    if (!reviews.length) return { avgScore: null, thisWeek: 0, overrides: 0 }

    const completed  = reviews.filter((r) => r.status === 'complete')
    const avgScore   = completed.length
      ? Math.round(completed.reduce((sum, r) => sum + (r.score ?? 0), 0) / completed.length)
      : null

    const thisWeek = reviews.filter((r) => {
      try { return isThisWeek(new Date(r.createdAt)) } catch { return false }
    }).length

    const overrides = reviews.reduce(
      (sum, r) => sum + ((r.overrides as unknown[])?.length ?? 0), 0
    )

    return { avgScore, thisWeek, overrides }
  }, [reviews])

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* MAIN CONTENT */}
      <div className="flex-1 space-y-6 animate-fade-in p-6">
        
        {/* Greeting */}
        <div>
          <h1 className="page-header">Welcome back, {firstName}</h1>
          <p className="page-sub">Here's an overview of your recent review activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total reviews" value={loading ? '…' : (data?.total ?? 0)} icon={FileSearch} />
          <StatCard
            label="Avg score"
            value={loading ? '…' : stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard label="This week" value={loading ? '…' : stats.thisWeek} icon={PlayCircle} />
          <StatCard label="Overrides submitted" value={loading ? '…' : stats.overrides} icon={Clock} variant="warning" />
        </div>

        {/* Activity chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Activity — last 14 days</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500" />Reviews
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />Avg score
              </span>
            </div>
          </div>
          <ActivityChart height={180} />
        </div>

        {/* Recent reviews */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent reviews</h2>
            <Link to="/history" className="text-xs text-brand-400 hover:text-brand-300">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No reviews yet.{' '}
              <Link to="/soa-analysis" className="text-brand-400 hover:text-brand-300">
                Run your first review →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-surface-border">
              {recent.map((r) => (
                <li key={r.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{r.fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(r.createdAt), 'dd MMM yyyy, h:mm a')} · {r.mode} mode
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-semibold ${
                      r.score >= 80 ? 'text-green-400' : r.score >= 60 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {r.score}%
                    </span>
                    <Link to={`/review/${r.id}`} className="text-xs text-brand-400 hover:text-brand-300">
                      View →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}