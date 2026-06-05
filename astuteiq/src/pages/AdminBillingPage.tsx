/**
 * AdminBillingPage.tsx
 * Professional billing & subscription management with full payment flow.
 * Design: Financial-grade dark luxury — obsidian surfaces, gold/emerald accents,
 * razor-sharp typography, live card preview, multi-step checkout.
 */
import {
  useMemo, useState, useCallback,
  type ReactNode, type ChangeEvent,
} from 'react'
import {
  ArrowUpRight, BadgePercent, Building2, CalendarDays,
  CheckCircle2, ChevronRight, CreditCard, DollarSign,
  Download, Lock, Receipt, ShieldCheck, Sparkles,
  TrendingUp, Users, Wifi, AlertCircle, CheckCircle,
  XCircle, BarChart3, Crown, Star,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingCycle = 'Monthly' | 'Yearly'
type CardBrand    = 'Visa' | 'Mastercard' | 'Amex'
type CheckoutStep = 'plan' | 'payment' | 'review' | 'success'
type TxStatus     = 'Paid' | 'Pending' | 'Refunded' | 'Failed'

interface Plan {
  id:           string
  name:         string
  tagline:      string
  monthlyPrice: number | null
  yearlyPrice:  number | null
  users:        string
  reviews:      string
  badge?:       string
  badgeColor?:  string
  tier:         number   // 0=starter … 3=enterprise
}

interface Transaction {
  id:       string
  customer: string
  plan:     string
  amount:   string
  status:   TxStatus
  method:   CardBrand
  date:     string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'starter', name: 'Starter', tagline: 'For solo advisers',
    monthlyPrice: 49,  yearlyPrice: 470,
    users: '1 User', reviews: '5 Reviews / mo', tier: 0,
  },
  {
    id: 'pro', name: 'Professional', tagline: 'Most popular choice',
    monthlyPrice: 199, yearlyPrice: 1_910,
    users: '5 Users', reviews: '100 Reviews / mo',
    badge: 'Popular', badgeColor: 'violet', tier: 1,
  },
  {
    id: 'business', name: 'Business', tagline: 'Scale your practice',
    monthlyPrice: 499, yearlyPrice: 4_790,
    users: '25 Users', reviews: '500 Reviews / mo',
    badge: 'Best Value', badgeColor: 'emerald', tier: 2,
  },
  {
    id: 'enterprise', name: 'Enterprise', tagline: 'Custom for large firms',
    monthlyPrice: null, yearlyPrice: null,
    users: 'Unlimited', reviews: 'Unlimited',
    badge: 'Custom', badgeColor: 'amber', tier: 3,
  },
]

const TRANSACTIONS: Transaction[] = [
  { id: 't1', customer: 'ABC Financial',     plan: 'Business',      amount: '$499',   status: 'Paid',     method: 'Visa',       date: '2 Jun 2025' },
  { id: 't2', customer: 'Smith Advisory',    plan: 'Professional',  amount: '$199',   status: 'Paid',     method: 'Mastercard', date: '1 Jun 2025' },
  { id: 't3', customer: 'Future Wealth',     plan: 'Starter',       amount: '$49',    status: 'Pending',  method: 'Amex',       date: '31 May 2025' },
  { id: 't4', customer: 'North Star Cap.',   plan: 'Enterprise',    amount: 'Custom', status: 'Refunded', method: 'Visa',       date: '30 May 2025' },
  { id: 't5', customer: 'Pinnacle Wealth',   plan: 'Business',      amount: '$499',   status: 'Paid',     method: 'Mastercard', date: '29 May 2025' },
  { id: 't6', customer: 'Blue Ridge Fin.',   plan: 'Professional',  amount: '$199',   status: 'Failed',   method: 'Amex',       date: '28 May 2025' },
]

const DISTRIBUTION = [
  { label: 'Starter',      count: 14,  pct: 16,  color: '#64748b' },
  { label: 'Professional', count: 38,  pct: 44,  color: '#8b5cf6' },
  { label: 'Business',     count: 24,  pct: 28,  color: '#10b981' },
  { label: 'Enterprise',   count: 8,   pct: 9,   color: '#f59e0b' },
]

// ─── Card brand config ────────────────────────────────────────────────────────

const CARD_BRANDS: Record<CardBrand, {
  label: string; bg: string; text: string;
  chipColor: string; logo: string;
  digitGroups: number[]; cvvLen: number;
  placeholder: string; cvvPlaceholder: string;
}> = {
  Visa: {
    label: 'Visa', text: 'text-white',
    bg: 'from-[#1a237e] via-[#283593] to-[#1565c0]',
    chipColor: '#ffd54f',
    logo: 'VISA',
    digitGroups: [4, 4, 4, 4], cvvLen: 3,
    placeholder: '4111 1111 1111 1111', cvvPlaceholder: '123',
  },
  Mastercard: {
    label: 'Mastercard', text: 'text-white',
    bg: 'from-[#1b0000] via-[#3e0000] to-[#880000]',
    chipColor: '#ffd54f',
    logo: 'MC',
    digitGroups: [4, 4, 4, 4], cvvLen: 3,
    placeholder: '5500 0000 0000 0004', cvvPlaceholder: '123',
  },
  Amex: {
    label: 'American Express', text: 'text-white',
    bg: 'from-[#004d40] via-[#00695c] to-[#00897b]',
    chipColor: '#ffd54f',
    logo: 'AMEX',
    digitGroups: [4, 6, 5], cvvLen: 4,
    placeholder: '3782 822463 10005', cvvPlaceholder: '1234',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function maskCard(raw: string, brand: CardBrand): string {
  const digits = raw.replace(/\D/g, '')
  const groups = CARD_BRANDS[brand].digitGroups
  const parts: string[] = []
  let cursor = 0
  for (const size of groups) {
    const chunk = digits.slice(cursor, cursor + size)
    if (chunk) parts.push(chunk)
    cursor += size
  }
  return parts.join(' ')
}

function formatExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

function luhnValid(num: string): boolean {
  const digits = num.replace(/\s/g, '')
  if (!digits || digits.length < 13) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

const TX_STATUS_STYLE: Record<TxStatus, string> = {
  Paid:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Pending:  'bg-amber-500/10   text-amber-400   border-amber-500/20',
  Refunded: 'bg-slate-700/50   text-slate-400   border-slate-600/30',
  Failed:   'bg-red-500/10     text-red-400     border-red-500/20',
}

const TX_STATUS_ICON: Record<TxStatus, ReactNode> = {
  Paid:     <CheckCircle  size={11} />,
  Pending:  <AlertCircle  size={11} />,
  Refunded: <XCircle      size={11} />,
  Failed:   <XCircle      size={11} />,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, color, glow,
}: {
  icon: ReactNode; label: string; value: string
  sub?: string; color: string; glow: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-5
                 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10 group"
      style={{ background: 'rgba(15,20,40,0.7)', backdropFilter: 'blur(12px)' }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
           style={{ background: `radial-gradient(ellipse at 20% 20%, ${glow} 0%, transparent 60%)` }} />
      <div className={`inline-flex p-2.5 rounded-xl mb-4 ${color} bg-current/10`}
           style={{ background: `${glow.replace('0.12', '0.12')}` }}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-semibold mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${color}`}>{sub}</p>}
    </div>
  )
}

function LiveCard({
  brand, number, holder, expiry, flipped,
}: {
  brand: CardBrand; number: string; holder: string; expiry: string; flipped: boolean
}) {
  const cfg = CARD_BRANDS[brand]
  const displayNum = maskCard(number || cfg.placeholder.replace(/\s/g, ''), brand) || cfg.placeholder
  const isValid = luhnValid(number)

  return (
    <div className="perspective-1000 w-full" style={{ perspective: '1000px' }}>
      <div
        className="relative w-full transition-all duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          height: '200px',
        }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cfg.bg} p-6 shadow-2xl`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="absolute left-20 top-12 w-64 h-1 rounded-full opacity-10"
                 style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} />
          </div>

          {/* Contactless icon */}
          <div className="absolute top-5 right-16">
            <Wifi size={18} className="text-white/30 rotate-90" />
          </div>

          {/* Brand logo */}
          <div className="absolute top-5 right-5">
            <span className="text-sm font-black text-white/90 tracking-widest">{cfg.logo}</span>
          </div>

          {/* Chip */}
          <div className="absolute top-5 left-6">
            <div className="w-10 h-7 rounded-md border border-white/20"
                 style={{ background: `linear-gradient(135deg, ${cfg.chipColor}cc, ${cfg.chipColor}44)` }}>
              <div className="absolute inset-0 grid grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border border-white/10 rounded-sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Card number */}
          <div className="absolute bottom-14 left-6 right-6">
            <p className="text-lg font-mono font-semibold text-white tracking-[0.18em] truncate"
               style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {displayNum}
            </p>
          </div>

          {/* Holder & expiry */}
          <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/50 mb-0.5">Card Holder</p>
              <p className="text-xs font-semibold text-white uppercase tracking-wide truncate max-w-[130px]">
                {holder || 'YOUR NAME'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/50 mb-0.5">Expires</p>
              <p className="text-xs font-semibold text-white">{expiry || 'MM/YY'}</p>
            </div>
          </div>

          {/* Luhn indicator */}
          {number.replace(/\s/g, '').length >= 13 && (
            <div className="absolute top-14 right-5">
              {isValid
                ? <CheckCircle size={12} className="text-emerald-400" />
                : <AlertCircle size={12} className="text-red-400" />}
            </div>
          )}
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cfg.bg} shadow-2xl`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Magnetic stripe */}
          <div className="w-full h-12 mt-10"
               style={{ background: 'rgba(0,0,0,0.7)' }} />

          {/* CVV strip */}
          <div className="mx-6 mt-4">
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/50 mb-1">Security Code</p>
            <div className="rounded-md px-4 py-2 text-right"
                 style={{ background: 'rgba(255,255,255,0.9)' }}>
              <span className="font-mono text-sm font-bold text-slate-800 tracking-widest">
                {'•'.repeat(CARD_BRANDS[brand].cvvLen)}
              </span>
            </div>
          </div>

          {/* Logo on back */}
          <div className="absolute bottom-5 right-6">
            <span className="text-sm font-black text-white/60 tracking-widest">{cfg.logo}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  plan, selected, cycle, onSelect,
}: {
  plan: Plan; selected: boolean; cycle: BillingCycle; onSelect: () => void
}) {
  const price = cycle === 'Monthly' ? plan.monthlyPrice : plan.yearlyPrice
  const saving = plan.monthlyPrice && plan.yearlyPrice
    ? plan.monthlyPrice * 12 - plan.yearlyPrice : 0

  const TIER_ACCENT = ['#64748b', '#8b5cf6', '#10b981', '#f59e0b']
  const accent = TIER_ACCENT[plan.tier]

  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative text-left rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 p-5 w-full"
      style={{
        background: selected
          ? `linear-gradient(135deg, ${accent}15, ${accent}08)`
          : 'rgba(12,16,32,0.8)',
        borderColor: selected ? `${accent}60` : 'rgba(255,255,255,0.06)',
        boxShadow: selected ? `0 0 0 1px ${accent}40, 0 8px 32px ${accent}15` : 'none',
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className="absolute -top-2.5 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
          style={{
            background: `${accent}20`,
            color: accent,
            border: `1px solid ${accent}40`,
          }}
        >
          {plan.badge}
        </div>
      )}

      {/* Selected ring */}
      {selected && (
        <div
          className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: accent }}
        >
          <CheckCircle2 size={12} className="text-white" />
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-1"
         style={{ color: accent }}>
        {plan.tagline}
      </p>
      <h3 className="text-base font-bold text-white mb-3">{plan.name}</h3>

      <div className="mb-4">
        <span className="text-3xl font-black text-white">
          {price ? fmt(price) : 'Custom'}
        </span>
        {price && (
          <span className="text-xs text-slate-500 ml-1">
            / {cycle === 'Monthly' ? 'mo' : 'yr'}
          </span>
        )}
      </div>

      {cycle === 'Yearly' && saving > 0 && (
        <div className="text-[11px] font-semibold mb-3 px-2 py-1 rounded-lg inline-block"
             style={{ background: '#10b98115', color: '#10b981' }}>
          Save {fmt(saving)} / year
        </div>
      )}

      <div className="space-y-1.5 text-xs text-slate-400">
        {[plan.users, plan.reviews, 'SOA Analysis', 'Compliance Reports', 'Priority Support',
          ...(plan.tier >= 2 ? ['Custom Integrations'] : []),
          ...(plan.tier === 3 ? ['Dedicated Account Manager', 'Custom SLA'] : []),
        ].map((f) => (
          <div key={f} className="flex items-center gap-2">
            <CheckCircle2 size={11} style={{ color: accent }} className="shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </button>
  )
}

function Field({
  label, value, onChange, placeholder, icon, type = 'text', maxLen, hint, error,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; icon?: ReactNode; type?: string
  maxLen?: number; hint?: string; error?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[10px] text-slate-600">{hint}</span>}
      </div>
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200
                   focus-within:border-violet-500/60 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
        style={{
          background: 'rgba(8,12,28,0.8)',
          borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)',
        }}
      >
        {icon && <span className="text-slate-600 shrink-0">{icon}</span>}
        <input
          type={type}
          value={value}
          maxLength={maxLen}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-700
                     font-mono tracking-wide"
        />
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

function StepIndicator({ step }: { step: CheckoutStep }) {
  const steps: { id: CheckoutStep; label: string }[] = [
    { id: 'plan',    label: 'Plan'    },
    { id: 'payment', label: 'Payment' },
    { id: 'review',  label: 'Review'  },
    { id: 'success', label: 'Done'    },
  ]
  const idx = steps.findIndex((s) => s.id === step)

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: i < idx ? '#8b5cf6' : i === idx ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.06)',
                color:      i <= idx ? '#fff' : '#475569',
                boxShadow:  i === idx ? '0 0 16px rgba(139,92,246,0.5)' : 'none',
              }}
            >
              {i < idx ? <CheckCircle2 size={13} /> : i + 1}
            </div>
            <p className="text-[9px] mt-1 uppercase tracking-wider font-semibold"
               style={{ color: i === idx ? '#a78bfa' : i < idx ? '#7c3aed' : '#475569' }}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px mx-2 mb-4 transition-all duration-300"
                 style={{ background: i < idx ? '#7c3aed' : 'rgba(255,255,255,0.06)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBillingPage() {
  // Plan
  const [cycle,       setCycle]       = useState<BillingCycle>('Monthly')
  const [plan,        setPlan]        = useState<Plan>(PLANS[1])

  // Payment
  const [brand,       setBrand]       = useState<CardBrand>('Visa')
  const [holder,      setHolder]      = useState('')
  const [cardNum,     setCardNum]     = useState('')
  const [expiry,      setExpiry]      = useState('')
  const [cvv,         setCvv]         = useState('')
  const [company,     setCompany]     = useState('')
  const [billingEmail,setBillingEmail]= useState('')
  const [billingAddr, setBillingAddr] = useState('')
  const [postcode,    setPostcode]    = useState('')
  const [country,     setCountry]     = useState('')

  // UX
  const [step,        setStep]        = useState<CheckoutStep>('plan')
  const [cardFlipped, setCardFlipped] = useState(false)
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [processing,  setProcessing]  = useState(false)
  const [txFilter,    setTxFilter]    = useState<TxStatus | 'All'>('All')

  const price   = cycle === 'Monthly' ? plan.monthlyPrice : plan.yearlyPrice
  const saving  = plan.monthlyPrice && plan.yearlyPrice ? plan.monthlyPrice * 12 - plan.yearlyPrice : 0
  const fee     = price ? Math.max(3, Math.round(price * 0.029)) : 0
  const tax     = price ? Math.round(price * 0.08) : 0
  const total   = price ? price + fee + tax : null

  const brandCfg = CARD_BRANDS[brand]

  const filteredTx = useMemo(
    () => txFilter === 'All' ? TRANSACTIONS : TRANSACTIONS.filter((t) => t.status === txFilter),
    [txFilter],
  )

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!holder.trim())            e.holder  = 'Cardholder name is required'
    if (!luhnValid(cardNum))       e.cardNum = 'Invalid card number'
    if (!/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = 'Use MM/YY format'
    if (cvv.length < brandCfg.cvvLen)   e.cvv    = `Must be ${brandCfg.cvvLen} digits`
    if (!company.trim())           e.company = 'Company name is required'
    if (!/\S+@\S+\.\S+/.test(billingEmail)) e.billingEmail = 'Valid email required'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [holder, cardNum, expiry, cvv, company, billingEmail, brandCfg.cvvLen])

  const handleNext = () => {
    if (step === 'plan') {
      if (!plan.monthlyPrice) {
        window.alert('Enterprise requires a custom quote. Please contact sales.')
        return
      }
      setStep('payment')
    } else if (step === 'payment') {
      if (validate()) setStep('review')
    } else if (step === 'review') {
      setProcessing(true)
      setTimeout(() => { setProcessing(false); setStep('success') }, 1800)
    }
  }

  const handleBack = () => {
    if (step === 'payment') setStep('plan')
    if (step === 'review')  setStep('payment')
  }

  const resetFlow = () => {
    setStep('plan'); setHolder(''); setCardNum('')
    setExpiry(''); setCvv(''); setErrors({})
  }

  return (
    <div className="min-h-screen text-slate-300"
         style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(109,40,217,0.12) 0%, transparent 50%), #070b18' }}>
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-3"
                 style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Sparkles size={12} />
              Billing Control Centre
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Subscriptions &amp; Payments
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-lg">
              Manage subscription tiers, monitor revenue, and process secure card payments
              across Visa, Mastercard, and American Express.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white
                       transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Download size={15} />
            Export Report
          </button>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<DollarSign size={16}  />} label="Monthly Revenue"       value="$12,480" sub="+9.6% vs last mo"   color="text-emerald-400" glow="rgba(16,185,129,0.12)" />
          <KpiCard icon={<CreditCard size={16}  />} label="Active Subscriptions"  value="84"      sub="+12 this month"    color="text-violet-400"  glow="rgba(139,92,246,0.12)" />
          <KpiCard icon={<Receipt    size={16}  />} label="Invoices Issued"       value="241"     sub="18 outstanding"    color="text-sky-400"     glow="rgba(14,165,233,0.12)" />
          <KpiCard icon={<TrendingUp size={16}  />} label="Revenue Growth"        value="+18%"    sub="Quarter on quarter" color="text-amber-400"   glow="rgba(245,158,11,0.12)" />
        </div>

        {/* ── Main 2-col grid ── */}
        <div className="grid xl:grid-cols-[1fr_420px] gap-8">

          {/* ── Left: Plan grid + Distribution + Transactions ── */}
          <div className="space-y-8">

            {/* Plan selector */}
            <div className="rounded-2xl border border-white/[0.06] p-6"
                 style={{ background: 'rgba(10,14,30,0.7)', backdropFilter: 'blur(16px)' }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white">Subscription Packages</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Select a plan then complete checkout</p>
                </div>
                {/* Billing toggle */}
                <div className="inline-flex rounded-xl border border-white/[0.06] p-1"
                     style={{ background: 'rgba(8,12,24,0.8)' }}>
                  {(['Monthly', 'Yearly'] as BillingCycle[]).map((c) => (
                    <button
                      key={c} type="button" onClick={() => setCycle(c)}
                      className="rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200"
                      style={{
                        background: cycle === c ? '#7c3aed' : 'transparent',
                        color:      cycle === c ? '#fff' : '#64748b',
                        boxShadow:  cycle === c ? '0 2px 12px rgba(124,58,237,0.4)' : 'none',
                      }}
                    >
                      {c} {c === 'Yearly' && <span className="ml-1 text-[10px] text-emerald-400">−15%</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {PLANS.map((p) => (
                  <PlanCard
                    key={p.id} plan={p} cycle={cycle}
                    selected={plan.id === p.id}
                    onSelect={() => { setPlan(p); setStep('plan') }}
                  />
                ))}
              </div>
            </div>

            {/* Distribution */}
            <div className="rounded-2xl border border-white/[0.06] p-6"
                 style={{ background: 'rgba(10,14,30,0.7)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={16} className="text-violet-400" />
                <h2 className="text-sm font-bold text-white">Customer Distribution</h2>
                <span className="ml-auto text-xs text-slate-600">84 total customers</span>
              </div>
              <div className="space-y-4">
                {DISTRIBUTION.map((d) => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300">{d.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{d.count} users</span>
                        <span className="text-xs font-bold" style={{ color: d.color }}>{d.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${d.pct}%`, background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div className="rounded-2xl border border-white/[0.06] p-6"
                 style={{ background: 'rgba(10,14,30,0.7)', backdropFilter: 'blur(16px)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-violet-400" />
                  <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
                </div>
                {/* Filter pills */}
                <div className="flex gap-2 flex-wrap">
                  {(['All', 'Paid', 'Pending', 'Refunded', 'Failed'] as const).map((f) => (
                    <button
                      key={f} type="button" onClick={() => setTxFilter(f)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
                      style={{
                        background: txFilter === f ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                        color:      txFilter === f ? '#a78bfa' : '#475569',
                        border:     `1px solid ${txFilter === f ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      {['Customer', 'Plan', 'Amount', 'Method', 'Date', 'Status'].map((h) => (
                        <th key={h} className="pb-3 text-left text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((tx) => (
                      <tr key={tx.id}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 font-semibold text-white text-xs">{tx.customer}</td>
                        <td className="py-3.5 text-xs text-slate-400">{tx.plan}</td>
                        <td className="py-3.5 text-xs font-mono text-white">{tx.amount}</td>
                        <td className="py-3.5">
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-md"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                            {tx.method}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-slate-600">{tx.date}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border ${TX_STATUS_STYLE[tx.status]}`}>
                            {TX_STATUS_ICON[tx.status]}
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTx.length === 0 && (
                  <p className="text-center text-xs text-slate-600 py-8">No transactions match this filter.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Checkout panel ── */}
          <div>
            <div className="rounded-2xl border border-white/[0.06] p-6 sticky top-6"
                 style={{ background: 'rgba(10,14,30,0.85)', backdropFilter: 'blur(20px)' }}>

              <StepIndicator step={step} />

              {/* ── STEP: plan summary ── */}
              {step === 'plan' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Selected Plan</h3>
                    <p className="text-xs text-slate-500">Review your selection before adding payment</p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] p-4"
                       style={{ background: 'rgba(139,92,246,0.06)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider">{plan.tagline}</p>
                        <h4 className="text-lg font-black text-white">{plan.name}</h4>
                      </div>
                      <Crown size={18} className="text-amber-400 mt-1" />
                    </div>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-3xl font-black text-white">
                        {price ? fmt(price) : 'Custom'}
                      </span>
                      {price && <span className="text-xs text-slate-500 mb-1">/ {cycle === 'Monthly' ? 'month' : 'year'}</span>}
                    </div>
                    {cycle === 'Yearly' && saving > 0 && (
                      <p className="text-xs text-emerald-400 font-semibold mb-3">
                        You save {fmt(saving)} per year vs monthly billing
                      </p>
                    )}
                    <div className="space-y-1.5 text-xs text-slate-400">
                      {[plan.users, plan.reviews].map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle2 size={11} className="text-violet-400" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing cycle toggle (duplicate for convenience) */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 mb-2">Billing Cycle</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Monthly', 'Yearly'] as BillingCycle[]).map((c) => (
                        <button
                          key={c} type="button" onClick={() => setCycle(c)}
                          className="rounded-xl py-2.5 text-xs font-semibold transition-all"
                          style={{
                            background: cycle === c ? '#7c3aed' : 'rgba(255,255,255,0.04)',
                            color:      cycle === c ? '#fff' : '#64748b',
                            border:     `1px solid ${cycle === c ? '#7c3aed' : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          {c}
                          {c === 'Yearly' && saving > 0 && (
                            <span className="block text-[9px] text-emerald-400 mt-0.5">Save {fmt(saving)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button" onClick={handleNext}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
                               transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
                    disabled={!plan.monthlyPrice}
                  >
                    Continue to Payment <ChevronRight size={15} />
                  </button>
                  {!plan.monthlyPrice && (
                    <p className="text-xs text-center text-slate-600">Contact sales for enterprise pricing</p>
                  )}
                </div>
              )}

              {/* ── STEP: payment ── */}
              {step === 'payment' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Payment Details</h3>
                    <p className="text-xs text-slate-500">Enter your card and billing information</p>
                  </div>

                  {/* Card brand selector */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 mb-2">Card Network</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(CARD_BRANDS) as CardBrand[]).map((b) => (
                        <button
                          key={b} type="button"
                          onClick={() => { setBrand(b); setCardNum(''); setCvv('') }}
                          className="rounded-xl py-2.5 text-[11px] font-bold transition-all"
                          style={{
                            background: brand === b ? `rgba(139,92,246,0.15)` : 'rgba(255,255,255,0.03)',
                            color:      brand === b ? '#a78bfa' : '#475569',
                            border:     `1px solid ${brand === b ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
                          }}
                        >
                          {CARD_BRANDS[b].logo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live card preview */}
                  <LiveCard
                    brand={brand} number={cardNum}
                    holder={holder} expiry={expiry}
                    flipped={cardFlipped}
                  />

                  {/* Card fields */}
                  <Field
                    label="Cardholder Name" value={holder}
                    onChange={setHolder} placeholder="Sarah Johnson"
                    icon={<Users size={14} />}
                    error={errors.holder}
                  />
                  <Field
                    label="Card Number" value={cardNum}
                    onChange={(v) => setCardNum(maskCard(v, brand))}
                    placeholder={brandCfg.placeholder}
                    icon={<CreditCard size={14} />}
                    maxLen={brand === 'Amex' ? 17 : 19}
                    hint={luhnValid(cardNum) ? '✓ Valid' : undefined}
                    error={errors.cardNum}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Expiry" value={expiry}
                      onChange={(v) => setExpiry(formatExpiry(v))}
                      placeholder="MM/YY"
                      icon={<CalendarDays size={14} />}
                      maxLen={5} error={errors.expiry}
                    />
                    <Field
                      label={`CVV (${brandCfg.cvvLen} digits)`} value={cvv}
                      onChange={(v) => setCvv(v.replace(/\D/g, '').slice(0, brandCfg.cvvLen))}
                      placeholder={brandCfg.cvvPlaceholder}
                      icon={<Lock size={14} />}
                      type="password"
                      maxLen={brandCfg.cvvLen} error={errors.cvv}
                    />
                  </div>

                  {/* Billing info */}
                  <div className="pt-3 border-t border-white/[0.05] space-y-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">Billing Information</p>
                    <Field
                      label="Company" value={company}
                      onChange={setCompany} placeholder="Northwind Advisory"
                      icon={<Building2 size={14} />} error={errors.company}
                    />
                    <Field
                      label="Billing Email" value={billingEmail}
                      onChange={setBillingEmail} placeholder="billing@company.com"
                      type="email" error={errors.billingEmail}
                    />
                    <Field
                      label="Billing Address" value={billingAddr}
                      onChange={setBillingAddr} placeholder="123 Collins St"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Postcode" value={postcode} onChange={setPostcode} placeholder="3000" />
                      <Field label="Country"  value={country}  onChange={setCountry}  placeholder="Australia" />
                    </div>
                  </div>

                  {/* CVV flip hint */}
                  <button
                    type="button"
                    onMouseEnter={() => setCardFlipped(true)}
                    onMouseLeave={() => setCardFlipped(false)}
                    className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
                  >
                    <Lock size={10} /> Hover to preview CVV position
                  </button>

                  <div className="flex gap-3">
                    <button type="button" onClick={handleBack}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 transition-all
                                       hover:text-white hover:bg-white/[0.05] border border-white/[0.06]">
                      Back
                    </button>
                    <button type="button" onClick={handleNext}
                            className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
                                       transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
                      Review Order <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: review ── */}
              {step === 'review' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Order Review</h3>
                    <p className="text-xs text-slate-500">Confirm everything before paying</p>
                  </div>

                  {/* Masked card */}
                  <div className="rounded-xl border border-white/[0.06] p-4 flex items-center gap-3"
                       style={{ background: 'rgba(139,92,246,0.06)' }}>
                    <div className="w-10 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                         style={{ background: `linear-gradient(135deg, ${brandCfg.bg.split(' ')[1]}, ${brandCfg.bg.split(' ')[3]})` }}>
                      {brandCfg.logo}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">
                        {brandCfg.label} •••• {cardNum.replace(/\s/g, '').slice(-4)}
                      </p>
                      <p className="text-[10px] text-slate-500">{holder} · Expires {expiry}</p>
                    </div>
                    <ShieldCheck size={14} className="text-emerald-400" />
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl border border-white/[0.06] p-4 space-y-2.5"
                       style={{ background: 'rgba(8,12,24,0.6)' }}>
                    {[
                      { l: `${plan.name} plan (${cycle})`, v: price ? fmt(price) : 'Custom', bold: false },
                      { l: 'Card processing fee (2.9%)',   v: price ? fmt(fee) : '—',         bold: false },
                      { l: 'Estimated GST (8%)',            v: price ? fmt(tax) : '—',         bold: false },
                      ...(cycle === 'Yearly' && saving > 0
                        ? [{ l: 'Annual billing discount', v: `-${fmt(saving)}`, bold: false }]
                        : []),
                    ].map(({ l, v, bold }) => (
                      <div key={l} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{l}</span>
                        <span className={bold ? 'text-white font-bold' : 'text-slate-300 font-mono'}>{v}</span>
                      </div>
                    ))}
                    <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Total due today</span>
                      <span className="text-lg font-black text-white">{total ? fmt(total) : 'Contact sales'}</span>
                    </div>
                  </div>

                  {/* Billing to */}
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p><span className="text-slate-400 font-semibold">Billing to:</span> {company}</p>
                    <p>{billingEmail}</p>
                  </div>

                  {/* PCI badge */}
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/15"
                       style={{ background: 'rgba(16,185,129,0.05)' }}>
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <p className="text-[11px] text-emerald-300">
                      256-bit TLS encrypted · PCI-DSS compliant · Card details never stored
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={handleBack}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 transition-all
                                       hover:text-white hover:bg-white/[0.05] border border-white/[0.06]">
                      Back
                    </button>
                    <button type="button" onClick={handleNext} disabled={processing}
                            className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
                                       transition-all hover:opacity-90 disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
                      {processing
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                        : <><Lock size={13} /> Confirm &amp; Pay {total ? fmt(total) : ''}</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: success ── */}
              {step === 'success' && (
                <div className="space-y-5 text-center py-4">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                       style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)' }}>
                    <CheckCircle size={28} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Payment Successful</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {company} is now subscribed to the {plan.name} plan via {brandCfg.label}.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/15 p-4 text-left space-y-2"
                       style={{ background: 'rgba(16,185,129,0.05)' }}>
                    <Row l="Plan"     v={plan.name} />
                    <Row l="Cycle"    v={cycle} />
                    <Row l="Amount"   v={total ? fmt(total) : '—'} />
                    <Row l="Card"     v={`${brandCfg.label} ···· ${cardNum.replace(/\s/g,'').slice(-4)}`} />
                    <Row l="Billing"  v={billingEmail} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={resetFlow}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/[0.06]
                                       text-slate-400 hover:text-white hover:bg-white/[0.05]">
                      New Payment
                    </button>
                    <button type="button"
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
                                       transition-all hover:opacity-90"
                            style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                      <Download size={13} /> Receipt
                    </button>
                  </div>
                </div>
              )}

              {/* Payment security footer */}
              {step !== 'success' && (
                <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center gap-2">
                  <Lock size={11} className="text-slate-700" />
                  <p className="text-[10px] text-slate-700">Secured by 256-bit TLS · PCI-DSS compliant</p>
                  <Star size={10} className="text-slate-700 ml-auto" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Payment advantages ── */}
        <div className="rounded-2xl border border-white/[0.06] p-6"
             style={{ background: 'rgba(10,14,30,0.7)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2 mb-5">
            <BadgePercent size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white">Payment Advantages</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Multi-network Support',    desc: 'Accept Visa, Mastercard, and American Express — covering 99% of global cardholders with no extra configuration.', icon: <CreditCard size={15} /> },
              { title: 'Flexible Billing Cycles',  desc: 'Monthly or yearly billing with instant price comparison and transparent annual savings displayed before checkout.', icon: <CalendarDays size={15} /> },
              { title: 'Enterprise-grade Security',desc: 'PCI-DSS compliant flow, Luhn validation, TLS 1.3 in transit, and zero card-detail storage on our infrastructure.', icon: <ShieldCheck size={15} /> },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="rounded-xl border border-white/[0.05] p-4"
                   style={{ background: 'rgba(8,12,24,0.6)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-violet-400">{icon}</span>
                  <h3 className="text-xs font-bold text-white">{title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{l}</span>
      <span className="text-slate-200 font-medium">{v}</span>
    </div>
  )
}