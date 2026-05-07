import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Search, ExternalLink } from 'lucide-react'
import { useReviewHistory } from '../features/reviews/hooks'
import { format } from 'date-fns'

function formatBytes(bytes: number): string {
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

export default function ReviewHistoryPage() {
  const { data, loading, fetch } = useReviewHistory()
  const [search, setSearch]      = useState('')
  const [page, setPage]          = useState(1)

  useEffect(() => {
    fetch(page, 20)
  }, [fetch, page])

  const reviews = (data?.reviews ?? []).filter((r) =>
    search.trim() === '' ||
    r.fileName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-header">Review History</h1>
        <p className="page-sub">All past compliance reviews for your account.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-9 h-9 text-sm"
          placeholder="Filter by filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide">
              <th className="text-left px-5 py-3">File</th>
              <th className="text-left px-5 py-3">Mode</th>
              <th className="text-left px-5 py-3">Score</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Size</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading &&
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-surface-border">
                  {[...Array(6)].map((__, j) => (
                    <td key={j} className="px-5 py-3">
                      <div className="skeleton h-4 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-sm">
                  {search ? 'No reviews match your search.' : 'No reviews yet.'}
                </td>
              </tr>
            )}

            {!loading &&
              reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-surface-border hover:bg-surface-hover transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-slate-600 shrink-0" />
                      <span className="text-slate-200 truncate max-w-xs">{r.fileName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 capitalize">{r.mode}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`font-semibold ${
                        r.score >= 80
                          ? 'text-green-400'
                          : r.score >= 60
                          ? 'text-orange-400'
                          : 'text-red-400'
                      }`}
                    >
                      {r.score}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                    {format(new Date(r.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                    {formatBytes(r.fileSize)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/review/${r.id}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                    >
                      View <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-30"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= data.total}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
