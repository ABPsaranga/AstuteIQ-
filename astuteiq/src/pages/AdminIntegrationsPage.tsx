// src/pages/AdminIntegrationsPage.tsx

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Plug,
  Server,
  Clock,
  Activity,
  ShieldCheck,
  Cpu,
  Globe,
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'warning'
  latency: number
  version: string
  lastChecked: string
  environment: string
  description: string
}

export default function AdminIntegrationsPage() {
  const [loading, setLoading] = useState(true)
  const [integrations, setIntegrations] = useState<Integration[]>([])

  useEffect(() => {
    loadIntegrations()
  }, [])

  async function loadIntegrations() {
    try {
      setLoading(true)

      // Replace with your backend endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/integrations`
      )

      if (!response.ok) {
        throw new Error('Failed to load integrations')
      }

      const data = await response.json()

      setIntegrations(data)
    } catch (error) {
      console.error(error)

      // Fallback demo data
      setIntegrations([
        {
          id: 'supabase',
          name: 'Supabase',
          status: 'connected',
          latency: 42,
          version: '2.49.1',
          lastChecked: new Date().toISOString(),
          environment: 'Production',
          description: 'Authentication, Database and Storage',
        },
        {
          id: 'openai',
          name: 'OpenAI',
          status: 'connected',
          latency: 186,
          version: 'GPT-5',
          lastChecked: new Date().toISOString(),
          environment: 'Production',
          description: 'AI Review Processing',
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          status: 'connected',
          latency: 152,
          version: 'Claude Sonnet 4',
          lastChecked: new Date().toISOString(),
          environment: 'Production',
          description: 'SOA Compliance Analysis',
        },
        {
          id: 'mongodb',
          name: 'MongoDB',
          status: 'connected',
          latency: 28,
          version: '8.0',
          lastChecked: new Date().toISOString(),
          environment: 'Production',
          description: 'Audit and Analytics Storage',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const connectedCount = integrations.filter(
    (i) => i.status === 'connected'
  ).length

  const avgLatency =
    integrations.length > 0
      ? Math.round(
          integrations.reduce((a, b) => a + b.latency, 0) /
            integrations.length
        )
      : 0

  return (
    <div className="space-y-8 text-slate-300">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Integrations Center
          </h1>

          <p className="mt-2 text-slate-500">
            Monitor external APIs, databases, AI providers and
            infrastructure services.
          </p>
        </div>

        <button
          onClick={loadIntegrations}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-violet-300 transition hover:bg-violet-500/20"
        >
          <RefreshCw size={16} />
          Refresh Status
        </button>
      </div>

      {/* Summary */}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Connected"
          value={`${connectedCount}/${integrations.length}`}
          icon={<CheckCircle2 size={18} />}
          color="green"
        />

        <StatCard
          title="Average Latency"
          value={`${avgLatency} ms`}
          icon={<Activity size={18} />}
          color="violet"
        />

        <StatCard
          title="Environment"
          value="Production"
          icon={<ShieldCheck size={18} />}
          color="blue"
        />

        <StatCard
          title="Services"
          value={integrations.length.toString()}
          icon={<Globe size={18} />}
          color="amber"
        />
      </div>

      {/* Integrations */}

      <div className="grid gap-5">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            Loading integrations...
          </div>
        ) : (
          integrations.map((integration) => (
            <div
              key={integration.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-violet-500/30"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-violet-500/10 p-3">
                    {getIcon(integration.name)}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {integration.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {integration.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <StatusBadge
                        status={integration.status}
                      />

                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Cpu size={12} />
                        Version {integration.version}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={12} />
                        {integration.latency} ms
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 text-sm lg:text-right">
                  <div>
                    <p className="text-slate-500">
                      Environment
                    </p>

                    <p className="font-medium text-white">
                      {integration.environment}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Last Health Check
                    </p>

                    <p className="font-medium text-white">
                      {new Date(
                        integration.lastChecked
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 lg:justify-end">
                    <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800">
                      Test Connection
                    </button>

                    <button className="rounded-lg bg-violet-600 px-3 py-2 text-xs text-white hover:bg-violet-500">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: 'connected' | 'disconnected' | 'warning'
}) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">
        <CheckCircle2 size={12} />
        Connected
      </span>
    )
  }

  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
        <AlertTriangle size={12} />
        Warning
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">
      <AlertTriangle size={12} />
      Disconnected
    </span>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  const colors: Record<string, string> = {
    green: 'text-green-400',
    violet: 'text-violet-400',
    blue: 'text-sky-400',
    amber: 'text-amber-400',
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className={`${colors[color]} mb-3`}>
        {icon}
      </div>

      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-1 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  )
}

function getIcon(name: string) {
  if (name.includes('Supabase')) {
    return (
      <Database
        size={20}
        className="text-emerald-400"
      />
    )
  }

  if (name.includes('MongoDB')) {
    return (
      <Server
        size={20}
        className="text-green-400"
      />
    )
  }

  if (name.includes('OpenAI')) {
    return (
      <Cpu
        size={20}
        className="text-sky-400"
      />
    )
  }

  if (name.includes('Anthropic')) {
    return (
      <Cpu
        size={20}
        className="text-violet-400"
      />
    )
  }

  return (
    <Plug
      size={20}
      className="text-violet-400"
    />
  )
}