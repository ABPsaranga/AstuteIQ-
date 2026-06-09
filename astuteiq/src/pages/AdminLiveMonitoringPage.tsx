import { useEffect, useState } from 'react'
import {
  Activity,
  Server,
  Users,
  Radio,
  AlertCircle,
  Cpu,
  HardDrive,
  ShieldCheck,
} from 'lucide-react'

import api from '../lib/api'

interface MonitoringData {
  status?: string
  active_users?: number
  activeUsers?: number
  active_reviews?: number
  runningReviews?: number
  system_health?: string
  serverStatus?: string
  memoryUsage?: number
  cpuUsage?: number
  uptime?: string
}

export default function AdminLiveMonitoringPage() {
  const [stats, setStats] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  async function loadData() {
    try {
      const res = await api.get('/admin/live-monitoring')

      setStats(res.data)
      setLastUpdate(new Date())
      setError('')
    } catch (err) {
      console.error(err)
      setError('Unable to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const timer = setInterval(loadData, 5000)

    return () => clearInterval(timer)
  }, [])

  const activeUsers =
    stats?.active_users ??
    stats?.activeUsers ??
    0

  const runningReviews =
    stats?.active_reviews ??
    stats?.runningReviews ??
    0

  const systemHealth =
    stats?.system_health ??
    stats?.status ??
    'unknown'

  const serverStatus =
    stats?.serverStatus ??
    systemHealth

  const cpuUsage =
    stats?.cpuUsage ??
    0

  const memoryUsage =
    stats?.memoryUsage ??
    0

  const uptime =
    stats?.uptime ??
    'Unknown'

  const isHealthy =
    systemHealth.toLowerCase() === 'healthy'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">
          Loading monitoring data...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Live Monitoring
          </h1>

          <p className="text-slate-500 mt-1">
            Real-time platform health and activity
          </p>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            isHealthy
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}
        >
          {isHealthy ? (
            <>
              <Radio
                size={12}
                className="text-emerald-400 animate-pulse"
              />
              <span className="text-emerald-400 font-medium">
                LIVE
              </span>
            </>
          ) : (
            <>
              <AlertCircle
                size={12}
                className="text-red-400"
              />
              <span className="text-red-400 font-medium">
                OFFLINE
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Metrics */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <MetricCard
          title="Active Users"
          value={activeUsers}
          icon={<Users size={20} />}
          color="text-violet-400"
        />

        <MetricCard
          title="Running Reviews"
          value={runningReviews}
          icon={<Activity size={20} />}
          color="text-emerald-400"
        />

        <MetricCard
          title="CPU Usage"
          value={`${cpuUsage}%`}
          icon={<Cpu size={20} />}
          color="text-cyan-400"
        />

        <MetricCard
          title="Memory Usage"
          value={`${memoryUsage}%`}
          icon={<HardDrive size={20} />}
          color="text-amber-400"
        />

      </div>

      {/* System Health */}

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck
              size={18}
              className="text-emerald-400"
            />
            <h2 className="text-lg font-semibold text-white">
              System Health
            </h2>
          </div>

          <div className="space-y-5">

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  CPU Usage
                </span>

                <span className="text-white">
                  {cpuUsage}%
                </span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500"
                  style={{
                    width: `${Math.min(cpuUsage, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  Memory Usage
                </span>

                <span className="text-white">
                  {memoryUsage}%
                </span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${Math.min(memoryUsage, 100)}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server
              size={18}
              className="text-violet-400"
            />
            <h2 className="text-lg font-semibold text-white">
              Server Information
            </h2>
          </div>

          <div className="space-y-4">

            <InfoRow
              label="Server Status"
              value={serverStatus}
            />

            <InfoRow
              label="System Health"
              value={systemHealth}
            />

            <InfoRow
              label="Uptime"
              value={uptime}
            />

            <InfoRow
              label="Active Users"
              value={String(activeUsers)}
            />

            <InfoRow
              label="Running Reviews"
              value={String(runningReviews)}
            />

          </div>
        </div>

      </div>

      {lastUpdate && (
        <div className="text-right text-xs text-slate-500">
          Last updated:{' '}
          {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
      <div className={`mb-3 ${color}`}>
        {icon}
      </div>

      <p className="text-slate-400 text-sm">
        {title}
      </p>

      <h3 className="text-3xl font-bold text-white mt-1">
        {value}
      </h3>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-400">
        {label}
      </span>

      <span className="text-white font-medium">
        {value}
      </span>
    </div>
  )
}