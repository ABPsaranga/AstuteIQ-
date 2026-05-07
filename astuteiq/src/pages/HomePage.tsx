import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch, ShieldCheck, Zap, ArrowRight, CheckCircle, TrendingUp, Clock } from 'lucide-react'

const STATS = [
  { value: '10,000+', label: 'Advice docs reviewed' },
  { value: '96%',     label: 'Avg SOA score achieved' },
  { value: '40%',     label: 'Time recovered per review' },
  { value: '30+',     label: 'AU practices using AstuteIQ' },
]

const CHECKS = [
  'ASIC RG175 compliance',
  'Best interests duty (s961B)',
  'Fee disclosure — dollar amounts',
  'Risk profile alignment',
  'Client goals linkage',
  'Better position statements',
  'Replacement product comparison',
  'Template language detection',
]

const FEATURES = [
  {
    icon:  Zap,
    title: 'Quick Check',
    time:  '~40s',
    desc:  'Consistency + 13 key compliance items + 2 personalisation checks. FAILs and WARNINGs only. Designed for fast triage before paraplanner review.',
    color: '#A78BFA',
    bg:    'bg-[#6B2FD9]/10 border-[#6B2FD9]/30',
  },
  {
    icon:  FileSearch,
    title: 'Full Review',
    time:  '~90s',
    desc:  'All four areas — Consistency, Structure, Personalisation (P1–P10) and Compliance (C1–C29). Full PASS confirmations with page references.',
    color: '#2DD4A0',
    bg:    'bg-[#2DD4A0]/10 border-[#2DD4A0]/30',
  },
  {
    icon:  ShieldCheck,
    title: 'Override & Flag',
    time:  'Anytime',
    desc:  'Paraplanners can flag incorrect findings, submit overrides with comments, and export a final Word report with all overrides documented.',
    color: '#E8B84B',
    bg:    'bg-[#E8B84B]/10 border-[#E8B84B]/30',
  },
]

// ── Newsletter form ───────────────────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      // Replace with your newsletter endpoint / Supabase insert
      await new Promise((res) => setTimeout(res, 900))
      setStatus('sent')
      setEmail('')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'sent') {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2DD4A0]/10 border border-[#2DD4A0]/30 text-[#2DD4A0] text-sm font-medium">
        <CheckCircle size={15} />
        You're on the list — we'll be in touch.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mt-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com.au"
        className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0B14] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#6B2FD9] focus:ring-1 focus:ring-[#6B2FD9]/40 transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-60"
        style={{ background: '#6B2FD9' }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>Keep me updated <ArrowRight size={14} /></>
        )}
      </button>
      {status === 'error' && (
        <p className="text-xs text-[#FF6B6B] text-center w-full mt-1">Something went wrong — try again.</p>
      )}
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#0B0B14' }}>

      {/* Noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #2DD4A0 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 space-y-28">

        {/* ── Hero ── */}
        <section className="flex flex-col items-center text-center gap-8 pt-8">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6B2FD9]/40 bg-[#6B2FD9]/10 text-xs font-semibold text-[#A78BFA] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4A0] animate-pulse" />
            For Australian & New Zealand Financial Planning Practices
          </div>

          <div className="space-y-3">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              SOA compliance<br />
              <span style={{ color: '#A78BFA' }}>reviewed in seconds.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              AstuteIQ checks Statements of Advice against ASIC RG175, Corporations Act s961B
              and the FASEA Code — flagging FAILs and WARNINGs before your paraplanner does.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Link
              to="/soa-analysis"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200"
              style={{ background: '#6B2FD9', boxShadow: '0 0 24px rgba(107,47,217,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 36px rgba(107,47,217,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(107,47,217,0.4)')}
            >
              Run your first review
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
            >
              Go to dashboard
            </Link>
          </div>

          {/* Stats bar */}
          <div
            className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-slate-800/60 mt-4"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center py-5 px-4 bg-[#0f0f1a]/80">
                <p className="text-2xl font-bold" style={{ fontFamily: "'DM Mono', monospace", color: '#A78BFA' }}>
                  {value}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 text-center">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Review modes ── */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Two modes. One workflow.
            </h2>
            <p className="text-slate-400 text-sm">Choose the depth of review that matches your quality gate.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, time, desc, color, bg }) => (
              <div
                key={title}
                className={`relative flex flex-col gap-4 p-6 rounded-2xl border ${bg} transition-transform duration-200 hover:-translate-y-0.5`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <span
                    className="text-xs font-mono px-2 py-1 rounded-full border"
                    style={{ color, borderColor: `${color}40`, background: `${color}10` }}
                  >
                    {time}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── What we check ── */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2
              className="text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              39+ compliance checks.<br />
              <span style={{ color: '#A78BFA' }}>Every review.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed">
              AstuteIQ maps every SOA against the full compliance checklist used by
              leading AU paraplanning teams — covering Corporations Act obligations,
              ASIC guidance and FASEA ethics requirements.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {CHECKS.map((c) => (
                <div key={c} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle size={14} style={{ color: '#2DD4A0', flexShrink: 0 }} />
                  {c}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 pt-2 border-t border-slate-800">
              Cannot verify WealthSolver modelling, APIR codes, Xtools+ projections, or data in Xplan / Midwinter.
            </p>
          </div>

          {/* Mock result card */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl opacity-30 blur-2xl"
              style={{ background: 'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)' }}
            />
            <div className="relative rounded-2xl border border-slate-800 bg-[#0f0f1a] p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">John & Mary Smith</p>
                  <p className="text-xs text-slate-500">Comprehensive Advice · Sarah Johnson</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-[#FFB347]/10 text-[#FFB347] border-[#FFB347]/25">
                  MEDIUM RISK
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[['28','PASS','#2DD4A0'],['5','WARNING','#FFB347'],['3','FAIL','#FF6B6B'],['3','N/A','#6b7280']].map(([n,l,c]) => (
                  <div key={l} className="rounded-xl p-3 text-center border" style={{ background: `${c}10`, borderColor: `${c}25` }}>
                    <p className="text-xl font-bold font-mono" style={{ color: c }}>{n}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color: c }}>{l}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { id: 'C3',  icon: '✕', label: 'Better position statement missing',     c: '#FF6B6B' },
                  { id: 'C14', icon: '✕', label: 'Fee amounts not disclosed in dollars',   c: '#FF6B6B' },
                  { id: 'C7',  icon: '⚠', label: 'Disadvantages section is generic',       c: '#FFB347' },
                  { id: 'C1',  icon: '✓', label: 'All numbers match throughout',           c: '#2DD4A0' },
                ].map(({ id, icon, label, c }) => (
                  <div key={id} className="flex items-center gap-2.5 text-xs py-1.5 border-b border-slate-800/50 last:border-0">
                    <span className="font-mono text-slate-600 w-6 shrink-0">{id}</span>
                    <span className="font-bold shrink-0" style={{ color: c }}>{icon}</span>
                    <span className="text-slate-300">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium border border-slate-700 text-slate-400">
                  New review
                </div>
                <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
                  style={{ background: '#6B2FD9' }}>
                  Export Word report
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <span className="flex items-center gap-1.5 text-xs text-[#2DD4A0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4A0] animate-pulse" />
                  Sample output
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Social proof ── */}
        <section className="grid md:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, color: '#A78BFA', title: '40% time recovered',    desc: 'Practices using AstuteIQ recover an average of 40% of paraplanner review time per SOA.' },
            { icon: ShieldCheck, color: '#2DD4A0', title: '96% avg SOA score',    desc: 'SOAs reviewed through AstuteIQ before submission consistently score 96% or above.' },
            { icon: Clock,       color: '#E8B84B', title: 'Results in under 90s', desc: 'Full 39-check review completes in under 90 seconds on any device, any browser.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 rounded-2xl border border-slate-800/60 bg-[#0f0f1a]/60">
              <div className="p-2.5 rounded-xl h-fit shrink-0" style={{ background: `${color}15` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">{title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Newsletter CTA ── */}
        <section
          className="relative rounded-3xl overflow-hidden border border-[#6B2FD9]/30 p-12 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(107,47,217,0.15) 0%, rgba(11,11,20,0.8) 60%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(107,47,217,0.25) 0%, transparent 60%)' }}
          />
          <div className="relative space-y-4">
            <h2
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Stay ahead of compliance changes.
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Join practices already using AstuteIQ. Get compliance tips, feature updates
              and SOA quality insights delivered to your inbox.
            </p>
            <NewsletterForm />
            <p className="text-xs text-slate-600 pt-1">
              Astute Business Partners · ISO 27001 certified · For internal use only
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}