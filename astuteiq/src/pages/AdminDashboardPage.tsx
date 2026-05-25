import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Users,
  FileSearch,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
} from 'lucide-react'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import api from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// GIF Imports
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GIF URLs (public assets)
// ─────────────────────────────────────────────────────────────────────────────

const totalUsersGif = '/assets/kpi/total-users.gif'
const mrrGif = '/assets/kpi/mrr.gif'
const reviewsGif = '/assets/kpi/reviews.gif'
const avgScoreGif = '/assets/kpi/avg-score.gif'
const failedReviewsGif = '/assets/kpi/failed-reviews.gif'
const systemHealthGif = '/assets/kpi/system-health.gif'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  email: string
  plan: 'Enterprise' | 'Pro' | 'Starter'
  reviews: number
  avgScore: number
  status: 'active' | 'inactive' | 'at-risk' | 'new'
  lastActive?: string
  churnRisk?: number
}

interface AdminStats {
  totalUsers: number
  totalReviews: number
  completedReviews: number
  failedReviews: number
  processingReviews: number
  avgScore: number
  mrr: number
  mrrGrowth: number
}

interface AlertItem {
  id: string
  type: 'danger' | 'warning' | 'info'
  title: string
  description: string
  time: string
}

interface RevenueData {
  month: string
  mrr: number
  reviews: number
}

interface PlanData {
  name: string
  value: number
  color: string
}

type UserFilter = 'all' | 'at-risk' | 'inactive' | 'new'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })
}

function timeAgo(iso?: string): string {
  if (!iso) return '—'

  const diff =
    Date.now() - new Date(iso).getTime()

  const m = Math.floor(diff / 60000)

  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`

  const h = Math.floor(m / 60)

  if (h < 24) return `${h}h ago`

  return `${Math.floor(h / 24)}d ago`
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  icon?: React.ElementType
  image?: string
  trend?: {
    value: string
    up: boolean
  }
  sub?: string
  variant?:
    | 'default'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
}

function KpiCard({
  label,
  value,
  icon: Icon,
  image,
  trend,
  sub,
  variant = 'default',
}: KpiCardProps) {
  const variantColors: Record<string, string> =
    {
      default: 'text-slate-100',
      success: 'text-emerald-400',
      danger: 'text-red-400',
      warning: 'text-amber-400',
      info: 'text-sky-400',
    }

  return (
    <div
      className="
        group relative overflow-hidden rounded-3xl
        border border-slate-800/80
        bg-gradient-to-br from-[#07142b] via-[#091b36] to-[#07142b]
        p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:border-violet-500/30
        hover:shadow-[0_0_40px_rgba(139,92,246,0.12)]
      "
    >
      {/* Glow */}
      <div
        className="
          absolute -right-12 -top-12
          h-40 w-40 rounded-full
          bg-sky-500/10 blur-3xl
        "
      />

      {/* Top Right Media */}
      <div className="absolute right-4 top-4">
        {image ? (
          <div
            className="
              flex h-16 w-16 items-center justify-center
              rounded-2xl
              border border-slate-700/60
              bg-slate-900/40
              backdrop-blur-sm
            "
          >
            <img
              src={image}
              alt={label}
              className="
                h-10 w-10 object-contain
                opacity-95
                transition-transform duration-300
                group-hover:scale-110
              "
            />
          </div>
        ) : (
          Icon && (
            <div
              className="
                flex h-14 w-14 items-center justify-center
                rounded-2xl
                border border-slate-700
                bg-slate-800/70
              "
            >
              <Icon
                size={24}
                className="text-slate-300"
              />
            </div>
          )
        )}
      </div>

      {/* Label */}
      <p
        className="
          mb-4 text-[11px]
          uppercase tracking-[0.28em]
          text-slate-500
        "
      >
        {label}
      </p>

      {/* Value */}
      <h3
        className={`
          text-4xl font-bold tracking-tight
          ${variantColors[variant]}
        `}
      >
        {value}
      </h3>

      {/* Trend */}
      {(trend || sub) && (
        <div className="mt-5 flex items-center gap-2">
          {trend && (
            <>
              {trend.up ? (
                <ArrowUpRight
                  size={15}
                  className="text-emerald-400"
                />
              ) : (
                <ArrowDownRight
                  size={15}
                  className="text-red-400"
                />
              )}

              <span
                className={`text-sm font-medium ${
                  trend.up
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {trend.value}
              </span>
            </>
          )}

          {sub && (
            <span className="text-xs text-slate-500">
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────────────────────────────────────

const ALERT_ICONS = {
  danger: (
    <XCircle
      size={14}
      className="text-red-400"
    />
  ),
  warning: (
    <AlertCircle
      size={14}
      className="text-amber-400"
    />
  ),
  info: (
    <CheckCircle
      size={14}
      className="text-sky-400"
    />
  ),
}

const ALERT_BG = {
  danger:
    'border-red-500/20 bg-red-500/10',
  warning:
    'border-amber-500/20 bg-amber-500/10',
  info: 'border-sky-500/20 bg-sky-500/10',
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [loading, setLoading] =
    useState(true)

  const [stats, setStats] =
    useState<AdminStats>({
      totalUsers: 0,
      totalReviews: 0,
      completedReviews: 0,
      failedReviews: 0,
      processingReviews: 0,
      avgScore: 0,
      mrr: 0,
      mrrGrowth: 0,
    })

  const [users, setUsers] = useState<
    AdminUser[]
  >([])

  const [alerts, setAlerts] = useState<
    AlertItem[]
  >([])

  const [revenueData, setRevenueData] =
    useState<RevenueData[]>([])

  const [planData, setPlanData] =
    useState<PlanData[]>([])

  const [userFilter, setUserFilter] =
    useState<UserFilter>('all')

  const [lastUpdated, setLastUpdated] =
    useState(new Date())

  const [showInvite, setShowInvite] =
    useState(false)

  const [inviteEmail, setInviteEmail] =
    useState('')

  const [invitePlan, setInvitePlan] =
    useState<
      'Starter' | 'Pro' | 'Enterprise'
    >('Starter')

  const loadDashboard = useCallback(
    async () => {
      try {
        setLoading(true)

        const [
          statsRes,
          usersRes,
          alertsRes,
          revenueRes,
          plansRes,
        ] = await Promise.all([
          api.get<AdminStats>(
            '/admin/stats'
          ),
          api.get<AdminUser[]>(
            '/admin/users'
          ),
          api.get<AlertItem[]>(
            '/admin/alerts'
          ),
          api.get<RevenueData[]>(
            '/admin/revenue'
          ),
          api.get<PlanData[]>(
            '/admin/plans'
          ),
        ])

        setStats(statsRes.data)

        setUsers(
          Array.isArray(usersRes.data)
            ? usersRes.data
            : []
        )

        setAlerts(
          Array.isArray(alertsRes.data)
            ? alertsRes.data
            : []
        )

        setRevenueData(
          Array.isArray(revenueRes.data)
            ? revenueRes.data
            : []
        )

        setPlanData(
          Array.isArray(plansRes.data)
            ? plansRes.data
            : []
        )

        setLastUpdated(new Date())
      } catch (err) {
        console.error(
          'Admin dashboard error:',
          err
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    loadDashboard()

    const iv = setInterval(
      loadDashboard,
      15000
    )

    return () => clearInterval(iv)
  }, [loadDashboard])

  const systemHealth = useMemo(() => {
    if (!stats.totalReviews)
      return 'Healthy'

    const rate =
      (stats.failedReviews /
        stats.totalReviews) *
      100

    if (rate >= 20) return 'Critical'
    if (rate >= 10) return 'Warning'

    return 'Healthy'
  }, [stats])

  const healthVariant =
    systemHealth === 'Healthy'
      ? 'success'
      : systemHealth === 'Warning'
      ? 'warning'
      : 'danger'

  return (
    <div className="animate-fade-in space-y-6 text-slate-300">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Admin command center
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Real-time platform health,
            revenue & user operations ·{' '}
            <span className="text-slate-400">
              Updated{' '}
              {timeAgo(
                lastUpdated.toISOString()
              )}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <Radio
              size={10}
              className="animate-pulse"
            />
            LIVE
          </div>

          <button
            onClick={loadDashboard}
            className="
              flex items-center gap-2 rounded-xl
              border border-slate-700
              bg-slate-900/50
              px-4 py-2 text-sm
              transition-all duration-200
              hover:bg-slate-800
            "
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          <button
            onClick={() =>
              setShowInvite(true)
            }
            className="
              group relative overflow-hidden rounded-xl
              bg-gradient-to-r from-emerald-400 to-teal-500
              px-5 py-2.5 text-sm font-semibold
              text-slate-900
              shadow-lg shadow-emerald-500/20
              transition-all duration-200
              hover:scale-[1.02]
            "
          >
            <span className="relative z-10 flex items-center gap-2">
              <UserPlus
                size={15}
                className="
                  transition-transform
                  group-hover:rotate-6
                "
              />

              Invite User
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        className="
          grid grid-cols-1 gap-5
          sm:grid-cols-2
          xl:grid-cols-3
          2xl:grid-cols-6
        "
      >
        <KpiCard
          label="Total users"
          value={
            loading
              ? '...'
              : stats.totalUsers.toLocaleString()
          }
          image={totalUsersGif}
          trend={{
            value: '+124 this month',
            up: true,
          }}
        />

        <KpiCard
          label="MRR"
          value={
            loading
              ? '...'
              : fmtCurrency(stats.mrr)
          }
          image={mrrGif}
          trend={{
            value: `${stats.mrrGrowth}% vs last mo.`,
            up: true,
          }}
          variant="success"
        />

        <KpiCard
          label="Total reviews"
          value={
            loading
              ? '...'
              : fmtNumber(stats.totalReviews)
          }
          image={reviewsGif}
          trend={{
            value: '+892 this week',
            up: true,
          }}
          variant="info"
        />

        <KpiCard
          label="Avg score"
          value={
            loading
              ? '...'
              : `${stats.avgScore}%`
          }
          image={avgScoreGif}
          trend={{
            value: '1.2% vs last wk.',
            up: false,
          }}
          variant="warning"
        />

        <KpiCard
          label="Failed reviews"
          value={
            loading
              ? '...'
              : stats.failedReviews
          }
          image={failedReviewsGif}
          trend={{
            value: `${(
              (stats.failedReviews /
                (stats.totalReviews ||
                  1)) *
              100
            ).toFixed(1)}% failure rate`,
            up: false,
          }}
          variant="danger"
        />

        <KpiCard
          label="System health"
          value={
            loading
              ? '...'
              : systemHealth
          }
          image={systemHealthGif}
          sub={`${stats.processingReviews} processing`}
          variant={healthVariant}
        />
      </div>
    </div>
  )
}