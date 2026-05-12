import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSearch,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Activity,
  Globe,
  ChevronRight,
} from 'lucide-react'

const STATS = [
  { value: 'Live', label: 'AI-powered SOA analysis' },
  { value: 'RG175', label: 'Compliance review coverage' },
  { value: 'P1–P10', label: 'Personalisation checks' },
  { value: 'C1–C29', label: 'Compliance controls' },
]

const CHECKS = [
  'ASIC RG175 compliance review',
  'Best interests duty (s961B)',
  'Fee disclosure validation',
  'Risk profile alignment',
  'Client goals linkage',
  'Better position analysis',
  'Replacement product comparison',
  'Template language detection',
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Quick Check',
    time: 'Fast',
    desc: 'Focused review highlighting FAIL and WARNING items for rapid paraplanner triage.',
    color: '#A78BFA',
    bg: 'bg-[#6B2FD9]/10 border-[#6B2FD9]/30',
  },
  {
    icon: FileSearch,
    title: 'Full Review',
    time: 'Comprehensive',
    desc: 'Complete SOA analysis covering consistency, structure, personalisation and compliance.',
    color: '#2DD4A0',
    bg: 'bg-[#2DD4A0]/10 border-[#2DD4A0]/30',
  },
  {
    icon: ShieldCheck,
    title: 'Override & Export',
    time: 'Workflow Ready',
    desc: 'Review findings, apply overrides, add comments and export final reports.',
    color: '#E8B84B',
    bg: 'bg-[#E8B84B]/10 border-[#E8B84B]/30',
  },
]

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) return

    setLoading(true)

    try {
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
      <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2DD4A0]/10 border border-[#2DD4A0]/30 text-[#2DD4A0] text-sm font-medium shadow-lg shadow-[#2DD4A0]/10">
        <CheckCircle size={16} />
        You're on the list — we'll be in touch.
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-2"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com.au"
        className="flex-1 px-5 py-3 rounded-2xl bg-[#0B0B14] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#6B2FD9] focus:ring-2 focus:ring-[#6B2FD9]/30 transition-all"
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
          boxShadow: '0 0 30px rgba(107,47,217,0.35)',
        }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Keep me updated
            <ArrowRight size={14} />
          </>
        )}
      </button>

      {status === 'error' && (
        <p className="text-xs text-[#FF6B6B] text-center w-full mt-1">
          Something went wrong — try again.
        </p>
      )}
    </form>
  )
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen overflow-hidden relative"
      style={{ background: '#0B0B14' }}
    >
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
        }}
      />

      {/* Glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-52 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(107,47,217,0.6) 0%, transparent 70%)',
          }}
        />

        <div
          className="absolute top-1/3 -left-44 w-[420px] h-[420px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(45,212,160,0.5) 0%, transparent 70%)',
          }}
        />

        <div
          className="absolute bottom-0 right-0 w-[520px] h-[320px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 space-y-32">

        {/* HERO */}
        <section className="relative flex flex-col items-center text-center gap-10 pt-12">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6B2FD9]/40 bg-[#6B2FD9]/10 text-xs font-semibold text-[#C4B5FD] uppercase tracking-[0.2em]">
            <span className="w-2 h-2 rounded-full bg-[#2DD4A0] animate-pulse" />
            AI-powered compliance workflow
          </div>

          <div className="space-y-6 max-w-5xl">
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight text-white"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Review SOAs with
              <br />
              <span className="bg-gradient-to-r from-[#A78BFA] to-[#E9D5FF] bg-clip-text text-transparent">
                confidence & speed.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              AstuteIQ helps financial planning teams analyse Statements of Advice
              against RG175, s961B obligations and structured compliance controls —
              with real-time AI review workflows.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              to="/soa-analysis"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02]"
              style={{
                background:
                  'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
                boxShadow: '0 0 35px rgba(107,47,217,0.45)',
              }}
            >
              Run your first review

              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-medium text-sm text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              Open dashboard
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {[
              'Live AI reviews',
              'Word exports',
              'Override workflows',
              'Streaming analysis',
            ].map((item) => (
              <div
                key={item}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-[#0f0f1a]/80 text-xs text-slate-400"
              >
                {item}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden border border-slate-800/60 mt-2 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center py-7 px-5 bg-[#0f0f1a]/80 backdrop-blur-sm"
              >
                <p
                  className="text-2xl md:text-3xl font-bold"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    color: '#A78BFA',
                  }}
                >
                  {value}
                </p>

                <p className="text-xs text-slate-500 mt-1 text-center">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="space-y-10">

          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-[#A78BFA] text-sm font-semibold">
              <Sparkles size={15} />
              Review Modes
            </div>

            <h2
              className="text-4xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Two modes. One seamless workflow.
            </h2>

            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Choose rapid triage or deep compliance analysis depending on your review stage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, time, desc, color, bg }) => (
              <div
                key={title}
                className={`group relative overflow-hidden flex flex-col gap-5 p-7 rounded-3xl border ${bg} hover:-translate-y-1 transition-all duration-300`}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
                  }}
                />

                <div className="flex items-start justify-between relative z-10">
                  <div
                    className="p-3 rounded-2xl"
                    style={{ background: `${color}20` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>

                  <span
                    className="text-xs font-mono px-3 py-1 rounded-full border"
                    style={{
                      color,
                      borderColor: `${color}40`,
                      background: `${color}10`,
                    }}
                  >
                    {time}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {desc}
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-sm font-medium text-white/80 pt-2">
                  Learn more
                  <ChevronRight size={15} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CHECKS */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-[#2DD4A0] text-sm font-semibold">
              <ShieldCheck size={15} />
              Compliance Coverage
            </div>

            <h2
              className="text-4xl font-bold text-white leading-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              39+ structured
              <br />
              compliance checks.
            </h2>

            <p className="text-slate-400 leading-relaxed text-base">
              AstuteIQ maps every SOA against structured review frameworks used
              by modern paraplanning teams across Australia and New Zealand.
            </p>

            <div className="grid gap-3">
              {CHECKS.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-3 text-sm text-slate-300 rounded-xl border border-slate-800 bg-[#10101a] px-4 py-3"
                >
                  <CheckCircle
                    size={16}
                    style={{ color: '#2DD4A0', flexShrink: 0 }}
                  />
                  {c}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 pt-2 border-t border-slate-800">
              Cannot verify WealthSolver modelling, APIR codes, Xtools+ projections,
              or external platform calculations.
            </p>
          </div>

          {/* Live card */}
          <div className="relative">

            <div
              className="absolute inset-0 rounded-[32px] opacity-30 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(107,47,217,0.45) 0%, transparent 70%)',
              }}
            />

            <div className="relative rounded-[32px] border border-slate-800 bg-[#0f0f1a]/90 backdrop-blur-xl p-7 space-y-6 shadow-2xl">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">
                    Live Compliance Engine
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Real-time AI workflow processing
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border bg-[#2DD4A0]/10 text-[#2DD4A0] border-[#2DD4A0]/25">
                  <Activity size={12} />
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3">
                {[
                  'Consistency validation across uploaded documents',
                  'Structure and section completeness analysis',
                  'P1–P10 personalisation review',
                  'C1–C29 compliance assessment',
                  'ATO threshold verification via live web search',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#12121d] px-4 py-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#2DD4A0] animate-pulse" />

                    <span className="text-sm text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  ['Quick', 'Triage review', '#A78BFA'],
                  ['Full', 'Deep analysis', '#2DD4A0'],
                  ['Export', 'Word reports', '#E8B84B'],
                ].map(([title, desc, color]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-800 bg-[#12121d] p-4 text-center"
                  >
                    <p
                      className="text-lg font-bold"
                      style={{ color }}
                    >
                      {title}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: TrendingUp,
              color: '#A78BFA',
              title: 'Structured compliance workflows',
              desc: 'Built for Australian financial planning teams reviewing Statements of Advice.',
            },
            {
              icon: ShieldCheck,
              color: '#2DD4A0',
              title: 'Multi-area review engine',
              desc: 'Consistency, structure, personalisation and compliance in one workflow.',
            },
            {
              icon: Globe,
              color: '#E8B84B',
              title: 'Live streaming reviews',
              desc: 'Real-time progress updates while compliance analysis runs.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="group relative overflow-hidden flex gap-4 p-7 rounded-3xl border border-slate-800/60 bg-[#0f0f1a]/60 hover:border-slate-700 transition-all"
            >
              <div
                className="p-3 rounded-2xl h-fit shrink-0"
                style={{ background: `${color}15` }}
              >
                <Icon size={18} style={{ color }} />
              </div>

              <div>
                <p className="text-base font-semibold text-white mb-2">
                  {title}
                </p>

                <p className="text-sm text-slate-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section
          className="relative rounded-[36px] overflow-hidden border border-[#6B2FD9]/30 p-10 md:p-14 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(107,47,217,0.18) 0%, rgba(11,11,20,0.9) 65%)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at top, rgba(139,92,246,0.25) 0%, transparent 60%)',
            }}
          />

          <div className="relative space-y-5">

            <div className="inline-flex items-center gap-2 text-[#C4B5FD] text-sm font-semibold">
              <Sparkles size={15} />
              Compliance Updates
            </div>

            <h2
              className="text-4xl md:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Stay ahead of
              <br />
              compliance changes.
            </h2>

            <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
              Get feature releases, regulatory insights and SOA quality updates
              delivered directly to your inbox.
            </p>

            <NewsletterForm />

            <p className="text-xs text-slate-600 pt-2">
              Astute Business Partners · ISO 27001 certified · Internal use only
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}