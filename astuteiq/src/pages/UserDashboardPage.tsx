import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSearch, PlayCircle, Clock, TrendingUp,
  ArrowRight, CheckCircle, XCircle, AlertTriangle,
  Zap, BarChart3,
} from 'lucide-react'
import { useAuthStore }     from '../features/auth/store'
import { useReviewHistory } from '../features/reviews/hooks'
import { useReviewStore }   from '../store/liveReviewStore'
import ActivityChart        from '../components/ActivityChart'
import { format, isThisWeek } from 'date-fns'

/* ─── Stat Card ────────────────────────────────────────────────────────────── */

interface StatCardProps {
  label:    string
  value:    string | number
  icon:     React.ElementType
  variant?: 'default' | 'success' | 'warning' | 'error'
  pulse?:   boolean
  sub?:     string
}

function StatCard({ label, value, icon: Icon, variant = 'default', pulse, sub }: StatCardProps) {
  const palette = {
    default: { accent: '#6B2FD9', glow: 'rgba(107,47,217,0.15)', icon: '#A78BFA', border: 'rgba(107,47,217,0.2)' },
    success: { accent: '#2DD4A0', glow: 'rgba(45,212,160,0.12)', icon: '#2DD4A0', border: 'rgba(45,212,160,0.2)' },
    warning: { accent: '#E8B84B', glow: 'rgba(232,184,75,0.12)',  icon: '#E8B84B', border: 'rgba(232,184,75,0.2)'  },
    error:   { accent: '#FF6B6B', glow: 'rgba(255,107,107,0.12)', icon: '#FF6B6B', border: 'rgba(255,107,107,0.2)' },
  }[variant]

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden group transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background:  `linear-gradient(135deg, #0f0f1a 0%, #0B0B14 100%)`,
        border:      `1px solid ${palette.border}`,
        boxShadow:   `0 0 0 1px rgba(255,255,255,0.03) inset`,
      }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 30% 20%, ${palette.glow} 0%, transparent 70%)` }}
      />

      {/* Pulse dot */}
      {pulse && (
        <span className="absolute top-3.5 right-3.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: palette.accent }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: palette.accent }} />
        </span>
      )}

      {/* Icon */}
      <div
        className="inline-flex p-2.5 rounded-xl mb-4"
        style={{ background: `${palette.accent}18`, border: `1px solid ${palette.accent}25` }}
      >
        <Icon size={15} style={{ color: palette.icon }} />
      </div>

      {/* Value */}
      <p
        className="text-3xl font-bold tracking-tight"
        style={{ color: '#fff', fontFamily: "'DM Mono', 'JetBrains Mono', monospace" }}
      >
        {value}
      </p>

      {/* Label */}
      <p className="text-xs text-slate-500 mt-1.5 font-medium">{label}</p>

      {/* Sub */}
      {sub && <p className="text-xs mt-1" style={{ color: palette.icon }}>{sub}</p>}
    </div>
  )
}

/* ─── Score Badge ──────────────────────────────────────────────────────────── */

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#2DD4A0' : score >= 60 ? '#FFB347' : '#FF6B6B'
  const bg    = score >= 80 ? 'rgba(45,212,160,0.1)' : score >= 60 ? 'rgba(255,179,71,0.1)' : 'rgba(255,107,107,0.1)'
  return (
    <span
      className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg"
      style={{ color, background: bg, border: `1px solid ${color}30` }}
    >
      {score}%
    </span>
  )
}

/* ─── Status Icon ──────────────────────────────────────────────────────────── */

function StatusIcon({ status }: { status: string }) {
  if (status === 'complete')   return <CheckCircle   size={13} className="shrink-0" style={{ color: '#2DD4A0' }} />
  if (status === 'failed')     return <XCircle       size={13} className="shrink-0" style={{ color: '#FF6B6B' }} />
  if (status === 'processing') return <AlertTriangle size={13} className="shrink-0 animate-pulse" style={{ color: '#FFB347' }} />
  return null
}

/* ─── Processing Banner ────────────────────────────────────────────────────── */

function ProcessingBanner() {
  return (
    <div
      className="relative flex items-center gap-4 p-4 rounded-2xl overflow-hidden animate-fade-in"
      style={{
        background: 'linear-gradient(90deg, rgba(107,47,217,0.15) 0%, rgba(107,47,217,0.05) 100%)',
        border:     '1px solid rgba(107,47,217,0.3)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(107,47,217,0.1) 0%, transparent 60%)' }} />
      <div className="relative w-5 h-5 shrink-0">
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#6B2FD9', borderTopColor: 'transparent' }} />
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Review in progress</p>
        <p className="text-xs text-slate-400 mt-0.5">Results will appear here automatically when complete.</p>
      </div>
      <Link
        to="/soa-analysis"
        className="relative shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{ color: '#A78BFA', background: 'rgba(107,47,217,0.2)', border: '1px solid rgba(107,47,217,0.3)' }}
      >
        View →
      </Link>
    </div>
  )
}

/* ─── Empty State ──────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(107,47,217,0.1)', border: '1px solid rgba(107,47,217,0.2)' }}
      >
        <FileSearch size={24} style={{ color: '#A78BFA' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">No reviews yet</p>
        <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
          Upload a Statement of Advice to run your first AI compliance review.
        </p>
      </div>
      <Link
        to="/soa-analysis"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: '#6B2FD9', boxShadow: '0 0 20px rgba(107,47,217,0.35)' }}
      >
        <Zap size={14} />
        Run your first review
      </Link>
    </div>
  )
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="py-3.5 flex items-center gap-4 animate-pulse">
      <div className="w-3.5 h-3.5 rounded-full bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-800 rounded w-2/5" />
        <div className="h-3 bg-slate-800/60 rounded w-1/3" />
      </div>
      <div className="h-6 w-12 bg-slate-800 rounded-lg" />
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function UserDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data, loading, fetch } = useReviewHistory()
  const { reviews: liveReviews, processing, lastUpdated } = useReviewStore()

  const firstName = (user?.name ?? user?.email ?? 'there').split(' ')[0]

  useEffect(() => {
    fetch(1, 100)
  }, [fetch, lastUpdated])

  // Merge live + backend reviews, deduplicate by id
  const allReviews = useMemo(() => {
    const backendReviews = (data?.reviews ?? []).map((r: any) => ({
      id:          r.id,
      fileName:    r.fileName,
      mode:        r.mode,
      status:      r.status,
      score:       r.score ?? 0,
      findings:    r.findings   ?? [],
      overrides:   r.overrides  ?? [],
      createdAt:   r.createdAt,
    }))
    const merged = new Map<string, any>()
    backendReviews.forEach((r: any) => merged.set(r.id, r))
    liveReviews.forEach((r) => merged.set(r.id, r))
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [data?.reviews, liveReviews, lastUpdated])

  const recent = allReviews.slice(0, 5)

  const stats = useMemo(() => {
    const completed = allReviews.filter((r) => r.status === 'complete')
    const avgScore  = completed.length
      ? Math.round(completed.reduce((s: number, r: any) => s + (r.score ?? 0), 0) / completed.length)
      : null
    const thisWeek  = allReviews.filter((r) => {
      try { return isThisWeek(new Date(r.createdAt)) } catch { return false }
    }).length
    const overrides = allReviews.reduce(
      (s: number, r: any) => s + ((r.overrides as unknown[])?.length ?? 0), 0
    )
    return { avgScore, thisWeek, overrides, total: allReviews.length }
  }, [allReviews])

  const isLoading = loading && !allReviews.length

  return (
    <div
      className="min-h-screen"
      style={{ background: '#0B0B14' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <h1
              className="text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Welcome back, {firstName}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <Link
            to="/soa-analysis"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 transition-all hover:opacity-90"
            style={{
              background:  '#6B2FD9',
              boxShadow:   '0 0 24px rgba(107,47,217,0.35)',
            }}
          >
            <PlayCircle size={15} />
            New review
          </Link>
        </div>

        {/* ── Processing banner ── */}
        {processing && <ProcessingBanner />}

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total reviews"
            value={isLoading ? '—' : stats.total}
            icon={FileSearch}
            pulse={processing}
            sub={stats.total > 0 ? 'All time' : undefined}
          />
          <StatCard
            label="Avg compliance score"
            value={isLoading ? '—' : stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
            icon={TrendingUp}
            variant="success"
            sub={stats.avgScore !== null ? (stats.avgScore >= 80 ? 'Above target' : 'Needs attention') : undefined}
          />
          <StatCard
            label="Reviews this week"
            value={isLoading ? '—' : stats.thisWeek}
            icon={BarChart3}
            variant={stats.thisWeek > 0 ? 'default' : 'warning'}
          />
          <StatCard
            label="Overrides submitted"
            value={isLoading ? '—' : stats.overrides}
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* ── Activity chart ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0f0f1a 0%, #0B0B14 100%)',
            border:     '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#6B2FD9' }} />
                Reviews
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#2DD4A0' }} />
                Avg score
              </span>
            </div>
          </div>
          <ActivityChart height={160} />
        </div>

        {/* ── Recent reviews ── */}
        <div
          className="rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #0f0f1a 0%, #0B0B14 100%)',
            border:     '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Table header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">Recent reviews</h2>
              {processing && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color:      '#A78BFA',
                    background: 'rgba(107,47,217,0.15)',
                    border:     '1px solid rgba(107,47,217,0.25)',
                  }}
                >
                  Live
                </span>
              )}
            </div>
            <Link
              to="/history"
              className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-white"
              style={{ color: '#A78BFA' }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="px-5 pb-5">
            {isLoading ? (
              <div className="divide-y divide-slate-800/40">
                {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y divide-slate-800/40">
                {recent.map((r) => (
                  <li
                    key={r.id}
                    className="group py-3.5 flex items-center gap-4"
                  >
                    <StatusIcon status={r.status} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                        {r.fileName || 'SOA Document'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-600">
                          {format(new Date(r.createdAt), 'dd MMM yyyy, h:mm a')}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-xs text-slate-600 capitalize">{r.mode} review</span>
                        {r.status === 'processing' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-xs animate-pulse" style={{ color: '#FFB347' }}>Processing…</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {r.status === 'complete' && <ScoreBadge score={r.score} />}
                      {r.status === 'processing' && (
                        <div
                          className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                          style={{ borderColor: '#FFB347', borderTopColor: 'transparent' }}
                        />
                      )}
                      <Link
                        to={`/review/${r.id}`}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{
                          color:      '#A78BFA',
                          background: 'rgba(107,47,217,0.12)',
                          border:     '1px solid rgba(107,47,217,0.2)',
                        }}
                      >
                        View →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
          {[
            {
              to:      '/soa-analysis',
              icon:    PlayCircle,
              color:   '#6B2FD9',
              bg:      'rgba(107,47,217,0.08)',
              border:  'rgba(107,47,217,0.2)',
              hoverBg: 'rgba(107,47,217,0.12)',
              title:   'Run a review',
              sub:     'Upload a PDF or DOCX for AI compliance review',
            },
            {
              to:      '/history',
              icon:    Clock,
              color:   '#A78BFA',
              bg:      'rgba(107,47,217,0.05)',
              border:  'rgba(255,255,255,0.05)',
              hoverBg: 'rgba(107,47,217,0.08)',
              title:   'Review history',
              sub:     'Browse all past reviews and findings',
            },
          ].map(({ to, icon: Icon, color, bg, border, title, sub }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div
                className="p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105"
                style={{ background: `${color}18`, border: `1px solid ${color}25` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
              </div>
              <ArrowRight
                size={15}
                className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}