import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { format, subDays } from 'date-fns'

interface DataPoint {
  date:    string
  reviews: number
  score:   number | null
}

interface Props {
  height?:  number
  reviews?: Array<{ createdAt: string; score?: number; status?: string }>
}

function buildActivityData(
  reviews: Array<{ createdAt: string; score?: number; status?: string }> = []
): DataPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const day       = subDays(new Date(), 13 - i)
    const dayLabel  = format(day, 'dd MMM')
    const dayStr    = format(day, 'yyyy-MM-dd')

    const dayReviews = reviews.filter((r) => {
      try { return format(new Date(r.createdAt), 'yyyy-MM-dd') === dayStr }
      catch { return false }
    })

    const completed  = dayReviews.filter((r) => r.status === 'complete' && r.score != null)
    const avgScore   = completed.length
      ? Math.round(completed.reduce((s, r) => s + (r.score ?? 0), 0) / completed.length)
      : null

    return {
      date:    dayLabel,
      reviews: dayReviews.length,
      score:   avgScore,
    }
  })
}

export default function ActivityChart({ height = 200, reviews = [] }: Props) {
  const data         = buildActivityData(reviews)
  const hasAnyScore  = data.some((d) => d.score !== null)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6B2FD9" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6B2FD9" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2DD4A0" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#2DD4A0" stopOpacity={0}   />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#252a38" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background:   '#181c27',
            border:       '1px solid #252a38',
            borderRadius: '0.5rem',
            fontSize:     '12px',
            color:        '#f1f5f9',
          }}
          cursor={{ stroke: '#252a38' }}
          formatter={(value: any, name: string) => {
            if (value === null) return ['—', name]
            if (name === 'Avg Score') return [`${value}%`, name]
            return [value, name]
          }}
        />

        <Area
          type="monotone"
          dataKey="reviews"
          name="Reviews"
          stroke="#6B2FD9"
          strokeWidth={2}
          fill="url(#colorReviews)"
          dot={false}
        />

        {/* Only render score line if there's at least one completed review */}
        {hasAnyScore && (
          <Area
            type="monotone"
            dataKey="score"
            name="Avg Score"
            stroke="#2DD4A0"
            strokeWidth={2}
            fill="url(#colorScore)"
            dot={false}
            connectNulls={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}