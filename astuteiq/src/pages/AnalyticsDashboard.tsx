import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts'
import ActivityChart from '../components/ActivityChart'
import StatCard from '../components/ui/StatCard'
import { TrendingUp, FileSearch, CheckCircle, XCircle } from 'lucide-react'

const MONTHLY_DATA = [
  { month: 'Jul', reviews: 24, pass: 18, fail: 6  },
  { month: 'Aug', reviews: 31, pass: 25, fail: 6  },
  { month: 'Sep', reviews: 28, pass: 21, fail: 7  },
  { month: 'Oct', reviews: 42, pass: 35, fail: 7  },
  { month: 'Nov', reviews: 38, pass: 30, fail: 8  },
  { month: 'Dec', reviews: 19, pass: 16, fail: 3  },
  { month: 'Jan', reviews: 47, pass: 40, fail: 7  },
]

const CATEGORY_DATA = [
  { name: 'Risk Profile',        value: 94 },
  { name: 'Fees & Costs',        value: 78 },
  { name: 'Best Interests',      value: 86 },
  { name: 'Client Objectives',   value: 82 },
  { name: 'Insurance',           value: 71 },
  { name: 'Projections',         value: 68 },
]

const PIE_DATA = [
  { name: 'PASS',    value: 55, color: '#22c55e' },
  { name: 'FAIL',    value: 20, color: '#ef4444' },
  { name: 'WARNING', value: 18, color: '#f97316' },
  { name: 'NA',      value: 7,  color: '#6b7280' },
]

const TOOLTIP_STYLE = {
  background: '#181c27', border: '1px solid #252a38',
  borderRadius: '0.5rem', fontSize: '12px', color: '#f1f5f9',
}

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Analytics</h1>
        <p className="page-sub">Compliance trends and performance metrics.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Reviews this month"  value={47}    icon={FileSearch}  />
        <StatCard label="Platform pass rate"  value="83%"   icon={CheckCircle} variant="success" />
        <StatCard label="Avg confidence"      value="79%"   icon={TrendingUp}  />
        <StatCard label="Critical failures"   value={8}     icon={XCircle}     variant="danger" />
      </div>

      {/* Monthly volume */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Monthly review volume</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MONTHLY_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#252a38" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="pass" name="Pass"   fill="#22c55e" radius={[3,3,0,0]} stackId="a" />
            <Bar dataKey="fail" name="Fail"   fill="#ef4444" radius={[3,3,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category pass rates */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Pass rate by category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={CATEGORY_DATA}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 80, bottom: 0 }}
            >
              <CartesianGrid stroke="#252a38" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Pass rate']} />
              <Bar dataKey="value" fill="#4a5ff7" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Finding distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {PIE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 14-day activity */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Daily activity — last 14 days</h2>
        <ActivityChart height={160} />
      </div>
    </div>
  )
}
