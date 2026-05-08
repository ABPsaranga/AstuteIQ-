import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, Search, ExternalLink, FileSearch,
  ChevronLeft, ChevronRight, CheckCircle,
  XCircle, AlertTriangle, Minus, Filter,
} from 'lucide-react'
import { useReviewHistory } from '../features/reviews/hooks'
import { useReviewStore }   from '../store/liveReviewStore'
import { format, isThisWeek, isToday } from 'date-fns'

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#2DD4A0]/10 text-[#2DD4A0] border border-[#2DD4A0]/20">
      <CheckCircle size={10} />{score}%
    </span>
  )
  if (score >= 60) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFB347]/10 text-[#FFB347] border border-[#FFB347]/20">
      <AlertTriangle size={10} />{score}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20">
      <XCircle size={10} />{score}%
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'processing') return (
    <span className="inline-flex items-center gap-1 text-xs text-[#FFB347]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB347] animate-pulse" />
      Processing
    </span>
  )
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 text-xs text-[#FF6B6B]">
      <XCircle size={11} />Failed
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#2DD4A0]">
      <CheckCircle size={11} />Complete
    </span>
  )
}

function DateLabel({ date }: { date: string }) {
  const d = new Date(date)
  if (isToday(d))      return <span className="text-[#A78BFA] font-medium">Today</span>
  if (isThisWeek(d))   return <span className="text-slate-300">{format(d, 'EEE, d MMM')}</span>
  return <span>{format(d, 'dd MMM yyyy')}</span>
}

type FilterMode = 'all' | 'quick' | 'full'
type FilterScore = 'all' | 'pass' | 'warn' | 'fail'

export default function ReviewHistoryPage() {
  const { data, loading, fetch } = useReviewHistory()
  const { reviews: liveReviews, lastUpdated } = useReviewStore()

  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [modeFilter,  setModeFilter]  = useState<FilterMode>('all')
  const [scoreFilter, setScoreFilter] = useState<FilterScore>('all')

  const PAGE_SIZE = 20

  useEffect(() => {
    fetch(page, PAGE_SIZE)
  }, [fetch, page, lastUpdated])

  // Merge live reviews with backend, deduplicate
  const allReviews = useMemo(() => {
    const backend = data?.reviews ?? []
    const merged  = new Map<string, any>()
    backend.forEach((r: any)      => merged.set(r.id, r))
    liveReviews.forEach((r)       => merged.set(r.id, r))
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [data?.reviews, liveReviews, lastUpdated])

  // Filter
  const filtered = useMemo(() => {
    return allReviews.filter((r) => {
      if (search.trim() && !r.fileName?.toLowerCase().includes(search.toLowerCase())) return false
      if (modeFilter !== 'all' && r.mode !== modeFilter) return false
      if (scoreFilter === 'pass' && r.score < 80) return false
      if (scoreFilter === 'warn' && (r.score < 60 || r.score >= 80)) return false
      if (scoreFilter === 'fail' && r.score >= 60) return false
      return true
    })
  }, [allReviews, search, modeFilter, scoreFilter])

  const total    = filtered.length
  const start    = (page - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Stats from all reviews
  const stats = useMemo(() => {
    const complete  = allReviews.filter(r => r.status === 'complete')
    const avgScore  = complete.length ? Math.round(complete.reduce((s: number, r: any) => s + r.score, 0) / complete.length) : 0
    const thisWeek  = allReviews.filter(r => { try { return isThisWeek(new Date(r.createdAt)) } catch { return false } }).length
    const passing   = complete.filter(r => r.score >= 80).length
    return { avgScore, thisWeek, passing, total: allReviews.length }
  }, [allReviews])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">Review History</h1>
          <p className="page-sub">All compliance reviews for your account.</p>
        </div>
        <Link
          to="/soa-analysis"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#6B2FD9' }}
        >
          <FileSearch size={14} />New review
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total reviews',  value: stats.total,               color: 'text-[#A78BFA]' },
          { label: 'This week',      value: stats.thisWeek,            color: 'text-white' },
          { label: 'Avg score',      value: stats.avgScore ? `${stats.avgScore}%` : '—', color: stats.avgScore >= 80 ? 'text-[#2DD4A0]' : 'text-[#FFB347]' },
          { label: 'Passing (≥80%)', value: stats.passing,             color: 'text-[#2DD4A0]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-[#0f0f1a] p-4">
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-8 h-9 text-sm w-52"
            placeholder="Filter by filename…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Mode filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700">
          {(['all', 'quick', 'full'] as FilterMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setModeFilter(m); setPage(1) }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                modeFilter === m ? 'bg-[#6B2FD9] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'all' ? 'All modes' : m}
            </button>
          ))}
        </div>

        {/* Score filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700">
          {([
            { key: 'all',  label: 'All scores' },
            { key: 'pass', label: '≥80%' },
            { key: 'warn', label: '60–79%' },
            { key: 'fail', label: '<60%' },
          ] as { key: FilterScore; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setScoreFilter(key); setPage(1) }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                scoreFilter === key ? 'bg-[#6B2FD9] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {(search || modeFilter !== 'all' || scoreFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setModeFilter('all'); setScoreFilter('all'); setPage(1) }}
            className="text-xs text-[#A78BFA] hover:text-white flex items-center gap-1 transition-colors"
          >
            <Filter size={11} />Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500">
          {total} review{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0f0f1a] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-widest">
              <th className="text-left px-5 py-3 font-medium">File</th>
              <th className="text-left px-5 py-3 font-medium">Mode</th>
              <th className="text-left px-5 py-3 font-medium">Score</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="text-left px-5 py-3 font-medium">Size</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {/* Loading skeletons */}
            {loading && !allReviews.length && [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-slate-800/60">
                {[...Array(7)].map((__, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="skeleton h-4 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty state */}
            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#6B2FD9]/10 flex items-center justify-center">
                      <FileSearch size={20} className="text-[#A78BFA]" />
                    </div>
                    <p className="text-sm text-slate-400">
                      {search || modeFilter !== 'all' || scoreFilter !== 'all'
                        ? 'No reviews match your filters.'
                        : 'No reviews yet.'}
                    </p>
                    {!search && modeFilter === 'all' && scoreFilter === 'all' && (
                      <Link to="/soa-analysis" className="text-xs text-[#A78BFA] hover:text-white transition-colors">
                        Run your first review →
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Rows */}
            {paginated.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-600 shrink-0" />
                    <span className="text-slate-200 truncate max-w-[200px] font-medium">
                      {r.fileName || 'SOA Document'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    r.mode === 'quick'
                      ? 'bg-[#6B2FD9]/10 text-[#A78BFA] border-[#6B2FD9]/20'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}>
                    {r.mode === 'quick' ? 'Quick' : 'Full'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {r.status === 'complete'
                    ? <ScoreBadge score={r.score} />
                    : <Minus size={14} className="text-slate-600" />
                  }
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill status={r.status} />
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                  <DateLabel date={r.createdAt} />
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                  {formatBytes(r.fileSize ?? 0)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    to={`/review/${r.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#A78BFA] hover:text-white transition-colors"
                  >
                    View <ExternalLink size={10} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total} reviews
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30 flex items-center gap-1"
              >
                <ChevronLeft size={13} />Prev
              </button>
              <span className="text-xs text-slate-500 font-mono">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30 flex items-center gap-1"
              >
                Next<ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}