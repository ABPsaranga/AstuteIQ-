import type { ReviewSummary } from '../../features/reviews/types'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react'

interface Props {
  summary: ReviewSummary
  score: number
}

interface Segment {
  label: string
  value: number
  color: string
  bg: string
  icon: React.ElementType
}

export default function SummaryCard({ summary, score }: Props) {
  const segments: Segment[] = [
    {
      label: 'Pass',
      value: summary.pass,
      color: '#22c55e',
      bg: 'bg-green-500/15 border border-green-500/20 text-green-400',
      icon: CheckCircle2,
    },
    {
      label: 'Fail',
      value: summary.fail,
      color: '#ef4444',
      bg: 'bg-red-500/15 border border-red-500/20 text-red-400',
      icon: XCircle,
    },
    {
      label: 'Warning',
      value: summary.warning,
      color: '#f59e0b',
      bg: 'bg-amber-500/15 border border-amber-500/20 text-amber-400',
      icon: AlertTriangle,
    },
    {
      label: 'NA',
      value: summary.na,
      color: '#64748b',
      bg: 'bg-slate-500/10 border border-slate-700 text-slate-400',
      icon: MinusCircle,
    },
  ]

  const total = summary.total || 1

  const passRate = Math.round((summary.pass / total) * 100)

  const scoreColor =
    score >= 85
      ? '#22c55e'
      : score >= 65
      ? '#f59e0b'
      : '#ef4444'

  const scoreLabel =
    score >= 85
      ? 'Excellent'
      : score >= 65
      ? 'Needs Review'
      : 'High Risk'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0f1117]/95 backdrop-blur-xl shadow-2xl">

      {/* Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(107,47,217,0.35), transparent 45%)',
        }}
      />

      <div className="relative z-10 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B2FD9]/15 border border-[#6B2FD9]/20 text-[#C4B5FD] text-xs font-semibold tracking-wide uppercase">
              <ShieldAlert size={13} />
              Compliance Summary
            </div>

            <h2 className="text-xl font-bold text-white mt-4">
              Review Performance
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              AI-generated compliance outcome overview.
            </p>
          </div>

          {/* SCORE RING */}
          <div className="relative w-24 h-24 shrink-0">

            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ background: scoreColor }}
            />

            <svg
              viewBox="0 0 120 120"
              className="relative w-full h-full -rotate-90"
            >
              {/* Track */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
              />

              {/* Progress */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 301.5} 301.5`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white leading-none">
                {score}%
              </span>

              <span
                className="text-[10px] font-semibold mt-1 uppercase tracking-wide"
                style={{ color: scoreColor }}
              >
                {scoreLabel}
              </span>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {segments.map((s) => {
            const Icon = s.icon

            return (
              <div
                key={s.label}
                className={`rounded-2xl p-4 transition-all hover:scale-[1.02] ${s.bg}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon size={16} />
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {s.label}
                  </span>
                </div>

                <p className="text-2xl font-bold text-white">
                  {s.value}
                </p>

                <div className="mt-2 h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(s.value / total) * 100}%`,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* DISTRIBUTION BAR */}
        <div className="space-y-2">

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              Compliance Distribution
            </span>

            <span className="text-slate-500">
              {summary.total} total checks
            </span>
          </div>

          <div className="flex h-3 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
            {segments.map((s) => (
              <div
                key={s.label}
                style={{
                  width: `${(s.value / total) * 100}%`,
                  background: s.color,
                }}
                className="transition-all duration-700"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {segments.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 text-xs text-slate-400"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: s.color }}
                />

                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="rounded-2xl border border-slate-800 bg-[#131722] px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div>
            <p className="text-sm font-semibold text-white">
              AI Compliance Confidence
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Based on structured SOA review findings and validation checks.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B2FD9]/15 border border-[#6B2FD9]/20 text-[#C4B5FD] text-sm font-semibold">
            <TrendingUp size={15} />
            {passRate}% passing checks
          </div>
        </div>
      </div>
    </div>
  )
}