import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { format } from 'date-fns'
import { useReviewHistory } from '../features/reviews/hooks'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Notification {
  id:        string
  type:      'success' | 'error' | 'info'
  title:     string
  message:   string
  createdAt: Date
  read:      boolean
}

// ─────────────────────────────────────────────────────────────
// Derive notifications from real review records
// ─────────────────────────────────────────────────────────────

function deriveNotifications(reviews: any[]): Notification[] {
  return reviews
    .slice(0, 20)                          // cap at 20 most recent
    .flatMap((r): Notification[] => {
      const name = r.fileName ?? 'Document'
      const date = new Date(r.createdAt ?? Date.now())

      if (r.status === 'complete') {
        return [{
          id:        `notif-${r.id}-done`,
          type:      'success',
          title:     'Review complete',
          message:   `${name} scored ${r.score ?? 0}%.`,
          createdAt: date,
          read:      false,
        }]
      }

      if (r.status === 'failed') {
        return [{
          id:        `notif-${r.id}-fail`,
          type:      'error',
          title:     'Review failed',
          message:   `${name} could not be processed. Try re-uploading.`,
          createdAt: date,
          read:      false,
        }]
      }

      return []
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const ICONS: Record<Notification['type'], React.ReactNode> = {
  success: <CheckCircle size={15} className="text-[#2DD4A0] shrink-0 mt-0.5" />,
  error:   <AlertCircle size={15} className="text-[#FF6B6B] shrink-0 mt-0.5" />,
  info:    <Info        size={15} className="text-[#A78BFA] shrink-0 mt-0.5" />,
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function Notifications() {
  const { data, loading, fetch } = useReviewHistory()

  // Fetch on mount — only needs the most recent reviews
  useEffect(() => {
    fetch(1, 20)
  }, [fetch])

  // Derive from real data
  const derived = deriveNotifications(data?.reviews ?? [])

  // Dismissed ids stored in local state (session only — no backend needed)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const dismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]))

  const visible = derived.filter((n) => !dismissed.has(n.id))

  // ── Loading skeleton ────────────────────────────────────────
  if (loading) {
    return (
      <ul className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <li key={i} className="flex gap-3 p-3 rounded-lg border border-slate-800 bg-[#0f0f1a] animate-pulse">
            <div className="w-4 h-4 rounded-full bg-slate-800 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-800/60 rounded w-2/3" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  // ── Empty state ─────────────────────────────────────────────
  if (visible.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        {data?.reviews?.length === 0
          ? 'Run your first review to see notifications here.'
          : 'No new notifications.'}
      </div>
    )
  }

  // ── Notification list ───────────────────────────────────────
  return (
    <ul className="space-y-2">
      {visible.map((n) => (
        <li
          key={n.id}
          className={`flex gap-3 p-3 rounded-lg border transition-colors ${
            n.read
              ? 'bg-[#0f0f1a] border-slate-800/60'
              : 'bg-[#0f0f1a] border-slate-700/60'
          }`}
        >
          {ICONS[n.type]}

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`}>
              {n.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
            <p className="text-xs text-slate-600 mt-1">
              {format(n.createdAt, 'dd MMM, h:mm a')}
            </p>
          </div>

          <button
            onClick={() => dismiss(n.id)}
            className="text-slate-600 hover:text-slate-400 shrink-0 transition-colors"
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  )
}