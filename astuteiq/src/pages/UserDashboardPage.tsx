import { useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSearch, PlayCircle, Clock, TrendingUp,
  ArrowRight, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react'
import { useAuthStore }    from '../features/auth/store'
import { useReviewHistory } from '../features/reviews/hooks'
import { useReviewStore }   from '../store/liveReviewStore'
import ActivityChart        from '../components/ActivityChart'
import { format, isThisWeek } from 'date-fns'

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label:    string
  value:    string | number
  icon:     React.ElementType
  variant?: 'default' | 'success' | 'warning' | 'error'
  pulse?:   boolean
}
function StatCard({ label, value, icon: Icon, variant = 'default', pulse }: StatCardProps) {
  const colors = {
    default: { icon: 'text-[#A78BFA]', bg: 'bg-[#6B2FD9]/10', border: 'border-slate-800' },
    success: { icon: 'text-[#2DD4A0]', bg: 'bg-[#2DD4A0]/10', border: 'border-[#2DD4A0]/20' },
    warning: { icon: 'text-[#E8B84B]', bg: 'bg-[#E8B84B]/10', border: 'border-[#E8B84B]/20' },
    error:   { icon: 'text-[#FF6B6B]', bg: 'bg-[#FF6B6B]/10', border: 'border-[#FF6B6B]/20' },
  }[variant]

  return (
    <div className={`relative rounded-2xl border ${colors.border} bg-[#0f0f1a] p-5 overflow-hidden`}>
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4A0] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2DD4A0]" />
        </span>
      )}
      <div className={`inline-flex p-2 rounded-xl ${colors.bg} mb-3`}>
        <Icon size={16} className={colors.icon} />
      </div>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-[#2DD4A0]' : score >= 60 ? 'text-[#FFB347]' : 'text-[#FF6B6B]'
  return <span className={`text-sm font-bold font-mono ${color}`}>{score}%</span>
}

// ── Status icon ───────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: string }) {
  if (status === 'complete')   return <CheckCircle   size={14} className="text-[#2DD4A0] shrink-0" />
  if (status === 'failed')     return <XCircle       size={14} className="text-[#FF6B6B] shrink-0" />
  if (status === 'processing') return <AlertTriangle size={14} className="text-[#FFB347] shrink-0 animate-pulse" />
  return null
}

// ── Processing banner ─────────────────────────────────────────────────────────
function ProcessingBanner() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-[#6B2FD9]/30 bg-[#6B2FD9]/10 animate-fade-in">
      <div className="w-4 h-4 border-2 border-[#6B2FD9] border-t-transparent rounded-full animate-spin shrink-0" />
      <div>
        <p className="text-sm font-semibold text-white">Review in progress</p>
        <p className="text-xs text-slate-400">Results will appear here automatically when complete.</p>
      </div>
      <Link to="/soa-analysis" className="ml-auto text-xs text-[#A78BFA] hover:text-white transition-colors shrink-0">
        View →
      </Link>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UserDashboardPage() {
  const user = useAuthStore((s) => s.user)

  // Backend history (paginated)
  const { data, loading, fetch } = useReviewHistory()

  // Live store — reviews pushed here instantly when SOA analysis completes
  const { reviews: liveReviews, processing, lastUpdated } = useReviewStore()

  const firstName = (user?.name ?? user?.email ?? 'there').split(' ')[0]

  // Fetch backend history on mount and whenever live store updates
  useEffect(() => {
    fetch(1, 100)
  }, [fetch, lastUpdated])  // lastUpdated triggers re-fetch after each live review

  // Merge live reviews with backend history, deduplicate by id
  const allReviews = useMemo(() => {
    const backendReviews = (data?.reviews ?? []).map((r: any) => ({
      id:          r.id,
      fileName:    r.fileName,
      fileSize:    r.fileSize,
      mode:        r.mode,
      status:      r.status,
      score:       r.score,
      findings:    r.findings ?? [],
      overrides:   r.overrides ?? [],
      createdAt:   r.createdAt,
      completedAt: r.completedAt ?? r.createdAt,
    }))

    // Live reviews override backend (more up to date)
    const merged = new Map<string, any>()
    backendReviews.forEach((r: any) => merged.set(r.id, r))
    liveReviews.forEach((r) => merged.set(r.id, r))

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [data?.reviews, liveReviews, lastUpdated])

  const recent = allReviews.slice(0, 5)

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = allReviews.filter((r) => r.status === 'complete')
    const avgScore  = completed.length
      ? Math.round(completed.reduce((sum: number, r: any) => sum + (r.score ?? 0), 0) / completed.length)
      : null

    const thisWeek = allReviews.filter((r) => {
      try { return isThisWeek(new Date(r.createdAt)) } catch { return false }
    }).length

    const overrides = allReviews.reduce(
      (sum: number, r: any) => sum + ((r.overrides as unknown[])?.length ?? 0), 0
    )

    return { avgScore, thisWeek, overrides, total: allReviews.length }
  }, [allReviews])

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl">

      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's your review activity at a glance.</p>
        </div>
        <Link
          to="/soa-analysis"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: '#6B2FD9' }}
        >
          <PlayCircle size={14} />
          New review
        </Link>
      </div>

      {/* Processing banner — shows while SOA analysis is streaming */}
      {processing && <ProcessingBanner />}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total reviews"
          value={loading && !allReviews.length ? '…' : stats.total}
          icon={FileSearch}
          pulse={processing}
        />
        <StatCard
          label="Avg score"
          value={loading && !allReviews.length ? '…' : stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          label="This week"
          value={loading && !allReviews.length ? '…' : stats.thisWeek}
          icon={PlayCircle}
        />
        <StatCard
          label="Overrides submitted"
          value={loading && !allReviews.length ? '…' : stats.overrides}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Activity chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Activity — last 14 days</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6B2FD9]" />Reviews
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2DD4A0]" />Avg score
            </span>
          </div>
        </div>
        <ActivityChart height={180} />
      </div>

      {/* Recent reviews */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Recent reviews</h2>
            {processing && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#6B2FD9]/20 text-[#A78BFA] border border-[#6B2FD9]/30">
                Live
              </span>
            )}
          </div>
          <Link to="/history" className="text-xs text-[#A78BFA] hover:text-white transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {loading && !allReviews.length ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6B2FD9]/10 flex items-center justify-center mx-auto">
              <FileSearch size={20} className="text-[#A78BFA]" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No reviews yet</p>
              <p className="text-xs text-slate-500 mt-1">Upload a Statement of Advice to get started.</p>
            </div>
            <Link
              to="/soa-analysis"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#6B2FD9' }}
            >
              Run your first review
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {recent.map((r) => (
              <li
                key={r.id}
                className={`py-3.5 flex items-center gap-4 ${
                  r.status === 'processing' ? 'opacity-70' : ''
                }`}
              >
                <StatusIcon status={r.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate font-medium">{r.fileName || 'SOA Document'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{format(new Date(r.createdAt), 'dd MMM yyyy, h:mm a')}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="capitalize">{r.mode} review</span>
                    {r.status === 'processing' && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[#FFB347] animate-pulse">Processing…</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.status === 'complete' && <ScoreBadge score={r.score} />}
                  {r.status === 'processing' && (
                    <div className="w-4 h-4 border-2 border-[#FFB347] border-t-transparent rounded-full animate-spin" />
                  )}
                  <Link
                    to={`/review/${r.id}`}
                    className="text-xs text-[#A78BFA] hover:text-white transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/soa-analysis"
          className="flex items-center gap-4 p-5 rounded-2xl border border-slate-800 bg-[#0f0f1a] hover:border-[#6B2FD9]/40 hover:bg-[#6B2FD9]/5 transition-all"
        >
          <div className="p-3 rounded-xl bg-[#6B2FD9]/10">
            <PlayCircle size={20} className="text-[#A78BFA]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Run a review</p>
            <p className="text-xs text-slate-400 mt-0.5">Upload a PDF or DOCX for AI compliance review</p>
          </div>
          <ArrowRight size={16} className="text-slate-600 ml-auto" />
        </Link>

        <Link
          to="/history"
          className="flex items-center gap-4 p-5 rounded-2xl border border-slate-800 bg-[#0f0f1a] hover:border-slate-700 hover:bg-slate-800/20 transition-all"
        >
          <div className="p-3 rounded-xl bg-slate-800/60">
            <Clock size={20} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Review history</p>
            <p className="text-xs text-slate-400 mt-0.5">Browse all past reviews and findings</p>
          </div>
          <ArrowRight size={16} className="text-slate-600 ml-auto" />
        </Link>
      </div>
    </div>
  )
}
