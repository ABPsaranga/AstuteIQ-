import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'

type Variant = 'default' | 'success' | 'danger' | 'warning'

interface Props {
  label: string
  value: string | number | null
  icon?: LucideIcon
  trend?: { value: number; label: string }
  variant?: Variant
  loading?: boolean
  hint?: string

  // ✨ NEW
  sparkline?: number[]
}

const VARIANT_ICON_BG: Record<Variant, string> = {
  default: 'bg-brand-500/10 text-brand-400',
  success: 'bg-green-500/10 text-green-400',
  danger:  'bg-red-500/10 text-red-400',
  warning: 'bg-orange-500/10 text-orange-400',
}

// 🔢 format values
function formatValue(value: string | number | null) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return value
}

// 📈 Sparkline component
function Sparkline({ data }: { data: number[] }) {
  const width = 120
  const height = 40
  const padding = 4

  const { points, strokeColor } = useMemo(() => {
    if (!data.length) return { points: '', strokeColor: '#64748b' }

    const min = Math.min(...data)
    const max = Math.max(...data)

    const range = max - min || 1

    const pts = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding
        const y =
          height -
          ((d - min) / range) * (height - padding * 2) -
          padding
        return `${x},${y}`
      })
      .join(' ')

    const strokeColor =
      data[data.length - 1] >= data[0]
        ? '#22c55e' // green
        : '#ef4444' // red

    return { points: pts, strokeColor }
  }, [data])

  return (
    <svg
      width={width}
      height={height}
      className="mt-2"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        points={points}
        className="opacity-90"
      />
    </svg>
  )
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  loading = false,
  hint,
  sparkline,
}: Props) {
  return (
    <div className="card flex items-start gap-4 animate-fade-in">

      {/* Icon */}
      {Icon && (
        <div className={`p-2.5 rounded-lg shrink-0 ${VARIANT_ICON_BG[variant]}`}>
          <Icon size={18} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* Label */}
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
          {label}
        </p>

        {/* Value */}
        {loading ? (
          <div className="h-7 w-20 mt-1 rounded bg-surface-border animate-pulse" />
        ) : (
          <p className="text-2xl font-semibold text-white mt-0.5">
            {formatValue(value)}
          </p>
        )}

        {/* Trend */}
        {!loading && trend && (
          <p
            className={`text-xs mt-1 flex items-center gap-1 ${
              trend.value >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <span>{trend.value >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-slate-500">{trend.label}</span>
          </p>
        )}

        {/* Sparkline */}
        {!loading && sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} />
        )}

        {/* Hint */}
        {!loading && hint && (
          <p className="text-xs text-slate-500 mt-1">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}