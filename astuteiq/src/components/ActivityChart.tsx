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
  score:   number
}

// Generate last 14 days of mock data
function generateActivityData(): DataPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i)
    return {
      date:    format(date, 'dd MMM'),
      reviews: Math.floor(Math.random() * 6) + 1,
      score:   60 + Math.floor(Math.random() * 35),
    }
  })
}

const DATA = generateActivityData()

interface Props {
  height?: number
}

export default function ActivityChart({ height = 200 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4a5ff7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4a5ff7" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
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
        />
        <Area
          type="monotone"
          dataKey="reviews"
          name="Reviews"
          stroke="#4a5ff7"
          strokeWidth={2}
          fill="url(#colorReviews)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="score"
          name="Avg Score"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#colorScore)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
