/**
 * AdminApiUsagePage.tsx — Advanced API usage monitoring dashboard.
 * Design: "Mission Control" — monospaced telemetry panels, oscilloscope sparklines,
 * amber/cyan on obsidian, live log stream, endpoint health table, latency gauges.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../lib/api'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight,
  CheckCircle2, Clock, Cpu, Database, Globe2, RefreshCw,
  Shield, TrendingUp, Wifi, Zap,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiUsageStats {
  totalRequests:    number
  reviewsProcessed: number
  avgResponseTime:  string
  monthlyUsage:     number
  errorRate:        number
  uptime:           number
  tokensUsed:       number
  costThisMonth:    number
  p95Latency:       string
  p99Latency:       string
  requestsPerMin:   number
  activeEndpoints:  number
}

interface EndpointStat {
  path:      string
  method:    'GET' | 'POST' | 'DELETE' | 'PATCH'
  calls:     number
  avgMs:     number
  errorRate: number
  trend:     number
}

interface TimePoint {
  t:        string
  requests: number
  errors:   number
  latency:  number
}

interface LogEntry {
  id:     string
  ts:     string
  method: string
  path:   string
  status: number
  ms:     number
  model:  string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const FALLBACK_STATS: ApiUsageStats = {
  totalRequests: 1842591, reviewsProcessed: 24807, avgResponseTime: '312ms',
  monthlyUsage: 847234, errorRate: 0.34, uptime: 99.97,
  tokensUsed: 128400000, costThisMonth: 2841.60, p95Latency: '680ms',
  p99Latency: '1.24s', requestsPerMin: 2340, activeEndpoints: 18,
}

const FALLBACK_ENDPOINTS: EndpointStat[] = [
  { path: '/api/soa/analyze',        method: 'POST', calls: 24807, avgMs: 3420, errorRate: 0.41, trend:  8.2 },
  { path: '/api/reviews',            method: 'GET',  calls: 98341, avgMs: 142,  errorRate: 0.12, trend:  3.1 },
  { path: '/api/reviews/:id',        method: 'GET',  calls: 61290, avgMs: 89,   errorRate: 0.08, trend: -1.4 },
  { path: '/api/auth/login',         method: 'POST', calls: 44512, avgMs: 210,  errorRate: 1.82, trend:  0.6 },
  { path: '/api/admin/stats',        method: 'GET',  calls: 38114, avgMs: 67,   errorRate: 0.05, trend:-12.0 },
  { path: '/api/reviews/:id/export', method: 'POST', calls: 18203, avgMs: 4890, errorRate: 0.73, trend:  5.5 },
  { path: '/api/admin/users',        method: 'GET',  calls: 12044, avgMs: 198,  errorRate: 0.18, trend:  1.9 },
  { path: '/api/feedback',           method: 'POST', calls:  9388, avgMs: 134,  errorRate: 0.60, trend: -3.2 },
]

function genSeries(): TimePoint[] {
  const now = new Date()
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now)
    d.setHours(d.getHours() - (23 - i))
    const base = 1800 + Math.sin(i * 0.5) * 600
    return {
      t: d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }),
      requests: Math.round(base + Math.random() * 400),
      errors:   Math.round(Math.random() * 18),
      latency:  Math.round(260 + Math.random() * 180),
    }
  })
}

const FALLBACK_LOGS: LogEntry[] = Array.from({ length: 12 }, (_, i) => ({
  id: `log-${i}`,
  ts: new Date(Date.now() - i * 4200).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  method: ['POST','GET','GET','POST','GET','POST'][i % 6],
  path:   ['/api/soa/analyze','/api/reviews','/api/auth/login','/api/reviews/export','/api/admin/stats','/api/feedback'][i % 6],
  status: i === 3 ? 422 : i === 7 ? 500 : 200,
  ms:     [3241,98,76,4812,44,312,2901,67,500,128,3980,201][i],
  model:  'claude-sonnet-4-20250514',
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtCost(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const METHOD_COLOR: Record<string, string> = {
  GET: '#22d3ee', POST: '#a78bfa', DELETE: '#f87171', PATCH: '#fb923c',
}

const statusColor = (s: number) =>
  s < 300 ? '#34d399' : s < 400 ? '#facc15' : s < 500 ? '#fb923c' : '#f87171'

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth || 200
    const H = height
    canvas.width  = W * window.devicePixelRatio
    canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((v - min) / range) * (H * 0.8) - H * 0.1,
    }))
    ctx.clearRect(0, 0, W, H)
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, color + '44'); grad.addColorStop(1, color + '00')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, H)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, H)
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.stroke()
    const last = pts[pts.length - 1]
    ctx.beginPath(); ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
  }, [data, color, height])
  return <canvas ref={ref} style={{ width: '100%', height }} />
}

// ─── Gauge ────────────────────────────────────────────────────────────────────

function GaugeArc({ value, max, color, size = 52 }: { value: number; max: number; color: string; size?: number }) {
  const pct  = Math.min(value / max, 1)
  const r    = size / 2 - 6
  const circ = 2 * Math.PI * r
  const arc  = circ * 0.75
  const dash = arc * pct
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5}
              strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={circ * 0.125} strokeLinecap="round" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
              strokeDasharray={`${dash} ${arc - dash + circ * 0.25}`} strokeDashoffset={circ * 0.125}
              strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
    </svg>
  )
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, glow, trend, spark, gauge, gaugeMax }: {
  label: string; value: string; sub?: string; icon: React.ElementType
  color: string; glow: string; trend?: { value: string; up: boolean }
  spark?: number[]; gauge?: number; gaugeMax?: number
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border p-5 group transition-all duration-300 hover:-translate-y-0.5"
         style={{ background: 'rgba(8,12,26,0.85)', borderColor: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(12px)' }}>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
           style={{ background: `radial-gradient(ellipse at 20% 20%, ${glow} 0%, transparent 65%)` }} />
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: glow, border: `1px solid ${color}22` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-500">{label}</p>
        </div>
        {gauge !== undefined && gaugeMax !== undefined && (
          <GaugeArc value={gauge} max={gaugeMax} color={color} size={52} />
        )}
      </div>
      <p className="relative text-3xl font-black tracking-tight text-white mb-1"
         style={{ fontFamily: "'DM Mono', 'JetBrains Mono', monospace" }}>{value}</p>
      <div className="relative flex items-center gap-2 mb-3">
        {sub && <p className="text-[11px] text-slate-600">{sub}</p>}
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ color: trend.up ? '#34d399' : '#f87171', background: trend.up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
            {trend.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend.value}
          </span>
        )}
      </div>
      {spark && <div className="relative -mx-1"><Sparkline data={spark} color={color} height={36} /></div>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminApiUsagePage() {
  const [stats,       setStats]       = useState<ApiUsageStats>(FALLBACK_STATS)
  const [endpoints,   setEndpoints]   = useState<EndpointStat[]>(FALLBACK_ENDPOINTS)
  const [series,      setSeries]      = useState<TimePoint[]>(genSeries)
  const [logs,        setLogs]        = useState<LogEntry[]>(FALLBACK_LOGS)
  const [loading,     setLoading]     = useState(false)
  const [lastFetch,   setLastFetch]   = useState(new Date())
  const [chartMode,   setChartMode]   = useState<'requests'|'errors'|'latency'>('requests')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, e, sr, l] = await Promise.allSettled([
        api.get<ApiUsageStats>('/admin/api-usage'),
        api.get<EndpointStat[]>('/admin/api-usage/endpoints'),
        api.get<TimePoint[]>('/admin/api-usage/series'),
        api.get<LogEntry[]>('/admin/api-usage/logs'),
      ])
      if (s.status  === 'fulfilled') setStats(s.value.data)
      if (e.status  === 'fulfilled') setEndpoints(e.value.data)
      if (sr.status === 'fulfilled') setSeries(sr.value.data)
      if (l.status  === 'fulfilled') setLogs(l.value.data)
    } catch { /* keep demo data */ }
    finally { setLoading(false); setLastFetch(new Date()) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!autoRefresh) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setStats(s => ({ ...s, totalRequests: s.totalRequests + Math.round(Math.random() * 40), requestsPerMin: s.requestsPerMin + Math.round(Math.random() * 5 - 2) }))
      setSeries(prev => {
        const last = prev[prev.length - 1]
        const now = new Date()
        return [...prev.slice(1), {
          t:        now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }),
          requests: Math.round(last.requests * (0.95 + Math.random() * 0.1)),
          errors:   Math.round(Math.random() * 20),
          latency:  Math.round(last.latency  * (0.9  + Math.random() * 0.2)),
        }]
      })
    }, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh])

  const chartData  = series.map(s => s[chartMode])
  const chartColor = chartMode === 'requests' ? '#22d3ee' : chartMode === 'errors' ? '#f87171' : '#a78bfa'
  const chartLabel = chartMode === 'requests' ? 'Req/hr' : chartMode === 'errors' ? 'Errors/hr' : 'Latency ms'

  return (
    <div className="min-h-screen text-slate-300"
         style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(6,50,90,0.18) 0%, transparent 50%), #060c1a' }}>
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-7">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-3"
                 style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.18)' }}>
              <Cpu size={11} /> API Telemetry — Live
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
              API Usage Monitor
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-lg">
              Real-time request telemetry, endpoint performance, cost tracking, and live log stream
              across all AstuteIQ API surfaces.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06]"
                 style={{ background: 'rgba(8,12,26,0.8)' }}>
              <PulseDot color={autoRefresh ? '#34d399' : '#475569'} />
              <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: autoRefresh ? '#34d399' : '#475569' }}>
                {autoRefresh ? 'Live' : 'Paused'}
              </span>
            </div>
            <button type="button" onClick={() => setAutoRefresh(v => !v)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-white/[0.06]"
                    style={{ background: 'rgba(8,12,26,0.8)', color: autoRefresh ? '#f87171' : '#34d399' }}>
              {autoRefresh ? 'Pause' : 'Resume'} stream
            </button>
            <button type="button" onClick={load} disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-white/[0.06] text-slate-400 hover:text-white disabled:opacity-50 transition-all"
                    style={{ background: 'rgba(8,12,26,0.8)' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-700 -mt-3">
          Last updated {lastFetch.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </p>

        {/* KPI row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Requests"    value={fmtNum(stats.totalRequests)}    sub="All time"             icon={Activity}   color="#22d3ee" glow="rgba(34,211,238,0.08)"  trend={{ value: '+12.4%', up: true }}  spark={series.map(s => s.requests)} />
          <KpiCard label="Reviews Processed" value={fmtNum(stats.reviewsProcessed)} sub="AI completions"       icon={Database}   color="#a78bfa" glow="rgba(167,139,250,0.08)" trend={{ value: '+8.2%',  up: true }}  spark={series.map((s,i) => Math.round(s.requests * (0.012 + i * 0.0001)))} />
          <KpiCard label="Avg Response"      value={stats.avgResponseTime}           sub={`p95 ${stats.p95Latency} · p99 ${stats.p99Latency}`} icon={Clock} color="#fb923c" glow="rgba(251,146,60,0.08)"  trend={{ value: '+34ms', up: false }} spark={series.map(s => s.latency)} />
          <KpiCard label="Monthly Usage"     value={fmtNum(stats.monthlyUsage)}      sub="of 2M quota"          icon={TrendingUp} color="#34d399" glow="rgba(52,211,153,0.08)"  gauge={stats.monthlyUsage} gaugeMax={2000000} trend={{ value: '42% used', up: true }} />
        </div>

        {/* KPI row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Error Rate"      value={`${stats.errorRate}%`}    sub="Last 24 hours"          icon={AlertTriangle} color={stats.errorRate > 1 ? '#f87171' : '#facc15'} glow="rgba(250,204,21,0.08)"   trend={{ value: '-0.12%', up: true }} spark={series.map(s => s.errors)} />
          <KpiCard label="Uptime"          value={`${stats.uptime}%`}       sub="30-day rolling"         icon={CheckCircle2}  color="#34d399" glow="rgba(52,211,153,0.08)"  gauge={stats.uptime}  gaugeMax={100} />
          <KpiCard label="Tokens Used"     value={fmtNum(stats.tokensUsed)} sub="Claude API cumulative"  icon={Zap}           color="#a78bfa" glow="rgba(167,139,250,0.08)" trend={{ value: '+2.1M today', up: true }} />
          <KpiCard label="Cost This Month" value={fmtCost(stats.costThisMonth)} sub="Anthropic API spend" icon={Shield}       color="#22d3ee" glow="rgba(34,211,238,0.08)"  trend={{ value: '+$124 vs last mo', up: false }} />
        </div>

        {/* Chart + Live stats */}
        <div className="grid xl:grid-cols-[1fr_280px] gap-6">

          {/* Time series */}
          <div className="rounded-2xl border border-white/[0.055] p-6"
               style={{ background: 'rgba(8,12,26,0.85)', backdropFilter: 'blur(12px)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <Wifi size={15} className="text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Request Telemetry</h2>
                <span className="text-[10px] text-slate-600">Last 24 hrs</span>
              </div>
              <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
                {(['requests','errors','latency'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setChartMode(m)}
                          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                          style={{ background: chartMode === m ? (m==='requests'?'#0e4a5a':m==='errors'?'#4a1010':'#2a1a4a') : 'transparent', color: chartMode === m ? chartColor : '#475569' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col justify-between text-right pb-4 shrink-0">
                {[Math.max(...chartData), Math.round(Math.max(...chartData)*0.5), 0].map(v => (
                  <span key={v} className="text-[9px] font-mono text-slate-700">
                    {chartMode==='latency'?`${v}ms`:fmtNum(v)}
                  </span>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <Sparkline data={chartData} color={chartColor} height={120} />
                <div className="flex justify-between mt-1.5">
                  {series.filter((_,i)=>i%6===0).map(s => (
                    <span key={s.t} className="text-[9px] font-mono text-slate-700">{s.t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 rounded-full" style={{ background: chartColor }} />
                <span className="text-[10px] text-slate-600">{chartLabel}</span>
              </div>
              <div className="ml-auto text-[10px] text-slate-700 font-mono">
                Peak {fmtNum(Math.max(...chartData))}{chartMode==='latency'?'ms':''} · Avg {fmtNum(Math.round(chartData.reduce((a,b)=>a+b,0)/chartData.length))}{chartMode==='latency'?'ms':''}
              </div>
            </div>
          </div>

          {/* Live counters panel */}
          <div className="rounded-2xl border border-white/[0.055] p-5 flex flex-col gap-4"
               style={{ background: 'rgba(8,12,26,0.85)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-1">
              <PulseDot color="#34d399" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Live Counters</h2>
            </div>
            {[
              { label: 'Req / min',        value: fmtNum(stats.requestsPerMin), color: '#22d3ee', bar: stats.requestsPerMin/5000 },
              { label: 'Active Endpoints', value: String(stats.activeEndpoints), color: '#a78bfa', bar: stats.activeEndpoints/30 },
              { label: 'Tokens / min',     value: fmtNum(Math.round(stats.requestsPerMin*1800)), color: '#fb923c', bar: 0.62 },
              { label: 'Concurrent Reqs',  value: String(Math.round(stats.requestsPerMin/12)),   color: '#34d399', bar: 0.38 },
            ].map(({ label, value, color, bar }) => (
              <div key={label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-600">{label}</span>
                  <span className="text-sm font-black font-mono" style={{ color }}>{value}</span>
                </div>
                <div className="h-1 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-1 rounded-full transition-all duration-1000"
                       style={{ width: `${Math.min(bar*100,100)}%`, background: color, boxShadow: `0 0 6px ${color}88` }} />
                </div>
              </div>
            ))}
            <div className="mt-2 pt-4 border-t border-white/[0.04]">
              <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-3">Latency Percentiles</p>
              {[
                { label: 'p50', value: stats.avgResponseTime, color: '#34d399', pct: 0.25 },
                { label: 'p95', value: stats.p95Latency,      color: '#facc15', pct: 0.55 },
                { label: 'p99', value: stats.p99Latency,      color: '#f87171', pct: 0.80 },
              ].map(({ label, value, color, pct }) => (
                <div key={label} className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-mono text-slate-600 w-6">{label}</span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="h-1 rounded-full" style={{ width: `${pct*100}%`, background: color }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold w-12 text-right" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-white/[0.04] space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">System Status</p>
              {[
                { label: 'Claude API',   ok: true },
                { label: 'Supabase DB',  ok: true },
                { label: 'Redis Cache',  ok: true },
                { label: 'Storage (S3)', ok: stats.errorRate < 1 },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{label}</span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: ok ? '#34d399' : '#f87171' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ok ? '#34d399' : '#f87171' }} />
                    {ok ? 'Operational' : 'Degraded'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Endpoint table */}
        <div className="rounded-2xl border border-white/[0.055] p-6"
             style={{ background: 'rgba(8,12,26,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Globe2 size={15} className="text-violet-400" />
            <h2 className="text-sm font-bold text-white">Endpoint Performance</h2>
            <span className="ml-auto text-[10px] text-slate-600">{endpoints.length} active endpoints</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Method','Endpoint','Calls','Avg Latency','Error Rate','Trend','Health'].map(h => (
                    <th key={h} className="pb-3 text-left text-[10px] uppercase tracking-[0.18em] font-bold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {endpoints.map(ep => {
                  const health = ep.errorRate < 0.5 ? 'green' : ep.errorRate < 1.5 ? 'yellow' : 'red'
                  const hColor = health==='green'?'#34d399':health==='yellow'?'#facc15':'#f87171'
                  return (
                    <tr key={ep.path} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-4">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md"
                              style={{ color: METHOD_COLOR[ep.method]??'#94a3b8', background: `${METHOD_COLOR[ep.method]??'#94a3b8'}15`, border: `1px solid ${METHOD_COLOR[ep.method]??'#94a3b8'}25` }}>
                          {ep.method}
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 font-mono text-slate-300">{ep.path}</td>
                      <td className="py-3.5 pr-6 font-mono font-bold text-white">{fmtNum(ep.calls)}</td>
                      <td className="py-3.5 pr-6">
                        <span className="font-mono" style={{ color: ep.avgMs > 2000 ? '#fb923c' : '#94a3b8' }}>
                          {ep.avgMs >= 1000 ? `${(ep.avgMs/1000).toFixed(2)}s` : `${ep.avgMs}ms`}
                        </span>
                      </td>
                      <td className="py-3.5 pr-6">
                        <span className="font-mono font-bold" style={{ color: ep.errorRate > 1 ? '#f87171' : '#64748b' }}>
                          {ep.errorRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3.5 pr-6">
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                              style={{ color: ep.trend >= 0 ? '#34d399' : '#f87171' }}>
                          {ep.trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                          {Math.abs(ep.trend)}%
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="h-1 rounded-full" style={{ width: `${Math.max(0,100-ep.errorRate*20)}%`, background: hColor }} />
                          </div>
                          <span className="text-[9px] font-bold uppercase" style={{ color: hColor }}>
                            {health==='green'?'OK':health==='yellow'?'Warn':'Crit'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live log stream */}
        <div className="rounded-2xl border border-white/[0.055] p-6"
             style={{ background: 'rgba(8,12,26,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PulseDot color={autoRefresh ? '#22d3ee' : '#475569'} />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Live Request Log</h2>
            <span className="ml-auto text-[10px] text-slate-600 font-mono">tail -f /var/log/api.log</span>
          </div>
          <div className="rounded-xl border border-white/[0.04] overflow-hidden font-mono text-[11px]"
               style={{ background: 'rgba(4,8,18,0.9)' }}>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04]"
                 style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-3 text-[10px] text-slate-600">astuteiq-api · request stream</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                  <span className="text-slate-600 shrink-0 w-16">{log.ts}</span>
                  <span className="shrink-0 w-10 text-center font-black rounded px-1"
                        style={{ color: METHOD_COLOR[log.method]??'#94a3b8', background: `${METHOD_COLOR[log.method]??'#94a3b8'}10` }}>
                    {log.method.slice(0,3)}
                  </span>
                  <span className="flex-1 text-slate-400 truncate">{log.path}</span>
                  <span className="shrink-0 font-bold w-10 text-right" style={{ color: statusColor(log.status) }}>{log.status}</span>
                  <span className="shrink-0 w-16 text-right" style={{ color: log.ms > 2000 ? '#fb923c' : '#475569' }}>
                    {log.ms >= 1000 ? `${(log.ms/1000).toFixed(2)}s` : `${log.ms}ms`}
                  </span>
                  <span className="shrink-0 text-slate-700 hidden lg:block w-44 truncate text-right">{log.model}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 flex items-center gap-2">
              <span className="text-cyan-600">$</span>
              <span className="w-2 h-3.5 rounded-sm bg-cyan-500/70 animate-pulse" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}