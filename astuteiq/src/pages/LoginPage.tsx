import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLogin } from '../features/auth/hooks'
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

// Floating "compliance tag" elements for the background
const FLOATING_TAGS = [
  { label: 'RG175', top: '12%', left: '18%', delay: 0, duration: 14 },
  { label: 'P1–P10', top: '68%', left: '12%', delay: 1.5, duration: 18 },
  { label: 'C1–C29', top: '24%', left: '72%', delay: 0.8, duration: 16 },
  { label: 'SOA', top: '78%', left: '68%', delay: 2.2, duration: 20 },
  { label: 'Personalisation', top: '46%', left: '8%', delay: 1, duration: 22 },
  { label: 'Compliance', top: '8%', left: '58%', delay: 2.6, duration: 19 },
  { label: 'AstuteIQ', top: '88%', left: '40%', delay: 0.4, duration: 17 },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  // captcha
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const { login, loading } = useLogin()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login(email, password)
  }

  return (
    <div
      className="min-h-screen w-full flex items-stretch overflow-hidden"
      style={{ background: '#0B0B14' }}
    >
      {/* ============ LEFT PANEL — animated brand side ============ */}
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden border-r border-slate-800/60">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute -top-40 -left-32 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6B2FD9 0%, transparent 70%)' }}
          animate={{
            x: [0, 60, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-160px] right-[-100px] w-[450px] h-[450px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2DD4A0 0%, transparent 70%)' }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#6B2FD9 1px, transparent 1px), linear-gradient(90deg, #6B2FD9 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Floating compliance tags */}
        {FLOATING_TAGS.map((tag) => (
          <motion.div
            key={tag.label}
            className="absolute rounded-full border border-slate-700/60 bg-white/[0.03] backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-slate-400"
            style={{ top: tag.top, left: tag.left }}
            animate={{
              y: [0, -18, 0],
              opacity: [0.4, 0.9, 0.4],
            }}
            transition={{
              duration: tag.duration,
              delay: tag.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {tag.label}
          </motion.div>
        ))}

        {/* Center brand content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 max-w-md px-10 text-center"
        >
          <div
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/60"
            style={{
              background:
                'linear-gradient(135deg, rgba(107,47,217,0.25), rgba(45,212,160,0.1))',
            }}
          >
            <ShieldCheck size={26} className="text-violet-300" />
          </div>

          <h2 className="text-2xl font-semibold text-white">
            Compliance review,
            <br />
            reimagined.
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            AstuteIQ helps paraplanners and advice practices review SOAs
            against RG175 and personalisation standards — faster, and with
            confidence.
          </p>
        </motion.div>
      </div>

      {/* ============ RIGHT PANEL — login form ============ */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
        {/* Mobile-only background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="rounded-2xl border border-slate-800 bg-[#0f0f1a] p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold text-white">AstuteIQ</h1>
              <p className="mt-2 text-sm text-slate-400">Sign in to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input transition-all duration-200 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60"
                  placeholder="your@practice.com.au"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-10 transition-all duration-200 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-slate-500 hover:text-violet-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 disabled:opacity-50 shadow-lg shadow-violet-900/30"
                style={{ background: '#6B2FD9' }}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={15} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[11px] uppercase tracking-wider text-slate-600">
                New here?
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Signup link */}
            <Link to="/register">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-white/[0.02] py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-violet-300 cursor-pointer"
              >
                Create an account
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </motion.div>
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-700">
            Astute Business Partners · ISO 27001 Certified
          </p>
        </motion.div>
      </div>
    </div>
  )
}