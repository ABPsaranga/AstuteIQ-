import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  FileSearch,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

import ActivityChart from '../components/ActivityChart'
import StatCard from '../components/ui/StatCard'

import api from '../lib/api'

interface AnalyticsResponse {
  total_reviews: number
  pass_rate: number
  avg_confidence: number
  critical_failures: number

  monthly_reviews: {
    month: string
    reviews: number
    pass: number
    fail: number
  }[]

  category_pass_rates: {
    name: string
    value: number
  }[]

  finding_distribution: {
    pass: number
    fail: number
    warning: number
    na: number
  }
}

const TOOLTIP_STYLE = {
  background: '#181c27',
  border: '1px solid #252a38',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: '#f1f5f9',
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsResponse | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    try {
      setLoading(true)

      const res = await api.get('/reviews/analytics')

      setData(res.data)
    } catch (err) {
      console.error('Failed to load analytics', err)
    } finally {
      setLoading(false)
    }
  }

  const pieData = useMemo(() => {
    if (!data) return []

    return [
      {
        name: 'PASS',
        value: data.finding_distribution.pass,
        color: '#22c55e',
      },
      {
        name: 'FAIL',
        value: data.finding_distribution.fail,
        color: '#ef4444',
      },
      {
        name: 'WARNING',
        value: data.finding_distribution.warning,
        color: '#f97316',
      },
      {
        name: 'NA',
        value: data.finding_distribution.na,
        color: '#6b7280',
      },
    ]
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="skeleton h-8 w-52 rounded mb-2" />
          <div className="skeleton h-4 w-72 rounded" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28">
              <div className="skeleton h-full rounded-xl" />
            </div>
          ))}
        </div>

        <div className="card h-[280px]">
          <div className="skeleton h-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-header">Analytics</h1>
        <p className="page-sub">
          Real-time compliance trends and review performance metrics.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Reviews this month"
          value={data?.total_reviews ?? 0}
          icon={FileSearch}
        />

        <StatCard
          label="Platform pass rate"
          value={`${data?.pass_rate ?? 0}%`}
          icon={CheckCircle}
          variant="success"
        />

        <StatCard
          label="Avg confidence"
          value={`${data?.avg_confidence ?? 0}%`}
          icon={TrendingUp}
        />

        <StatCard
          label="Critical failures"
          value={data?.critical_failures ?? 0}
          icon={XCircle}
          variant="danger"
        />
      </div>

      {/* MONTHLY REVIEWS */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Monthly review volume
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real compliance review activity over time
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Pass
            </div>

            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Fail
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data?.monthly_reviews ?? []}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#252a38"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip contentStyle={TOOLTIP_STYLE} />

            <Bar
              dataKey="pass"
              name="Pass"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              stackId="a"
            />

            <Bar
              dataKey="fail"
              name="Fail"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LOWER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CATEGORY PASS RATES */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">
              Pass rate by category
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              AI compliance performance across review categories
            </p>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data?.category_pass_rates ?? []}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 80, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#252a38"
                strokeDasharray="3 3"
                horizontal={false}
              />

              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={90}
              />

              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [`${v}%`, 'Pass rate']}
              />

              <Bar
                dataKey="value"
                fill="#6B2FD9"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">
              Finding distribution
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Breakdown of AI review outcomes
            </p>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>

              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span
                    style={{
                      color: '#94a3b8',
                      fontSize: 12,
                    }}
                  >
                    {value}
                  </span>
                )}
              />

              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [`${v}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* QUICK SUMMARY */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
                <CheckCircle size={12} />
                Passing findings
              </div>

              <p className="text-xl font-bold text-white mt-2">
                {data?.finding_distribution.pass ?? 0}%
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-medium">
                <AlertTriangle size={12} />
                Warning findings
              </div>

              <p className="text-xl font-bold text-white mt-2">
                {data?.finding_distribution.warning ?? 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVITY */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white">
            Daily activity — last 14 days
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Live review activity across the platform
          </p>
        </div>

        <ActivityChart height={180} />
      </div>
    </div>
  )
}