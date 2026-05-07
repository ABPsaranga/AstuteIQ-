import type { ReviewFinding } from '../features/reviews/types'

const CATEGORIES = [
  'Risk Profile',
  'Fees & Costs',
  'Best Interests Duty',
  'Client Objectives',
  'Replacement Product',
  'Scope of Advice',
  'Insurance Adequacy',
  'Projections & Modelling',
]

const STATUS_BG: Record<string, string> = {
  PASS:    'bg-green-500/20  text-green-400  border-green-500/30',
  FAIL:    'bg-red-500/20    text-red-400    border-red-500/30',
  WARNING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NA:      'bg-slate-500/10  text-slate-500  border-slate-600/30',
}

interface Props {
  findings: ReviewFinding[]
}

export default function RiskHeatmap({ findings }: Props) {
  const byCategory = new Map<string, ReviewFinding[]>()
  for (const cat of CATEGORIES) {
    byCategory.set(cat, findings.filter((f) => f.category === cat))
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {CATEGORIES.map((cat) => {
        const items = byCategory.get(cat) ?? []
        // Worst status in category
        const hassFail    = items.some((f) => f.status === 'FAIL')
        const hasWarning  = items.some((f) => f.status === 'WARNING')
        const hasPass     = items.some((f) => f.status === 'PASS')
        const status = hassFail ? 'FAIL' : hasWarning ? 'WARNING' : hasPass ? 'PASS' : 'NA'

        return (
          <div
            key={cat}
            className={`border rounded-lg p-3 text-center ${STATUS_BG[status]}`}
          >
            <p className="text-xs font-medium leading-tight">{cat}</p>
            <p className="text-xs mt-1 opacity-70">{items.length} check{items.length !== 1 ? 's' : ''}</p>
            <p className="text-xs font-bold mt-1">{status}</p>
          </div>
        )
      })}
    </div>
  )
}
