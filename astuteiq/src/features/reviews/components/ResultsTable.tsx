import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter, AlertTriangle } from 'lucide-react'
import type { ReviewFinding, ReviewStatus, FindingOverride } from '../../../features/reviews/types'
import StatusBadge from '../../../components/ui/StatusBadge'

interface Props {
  findings:        ReviewFinding[]
  overrides:       FindingOverride[]
  onSelectFinding: (f: ReviewFinding) => void
  onFlagFinding:   (f: ReviewFinding) => void
  selectedId?:     string
}

type SortField = 'title' | 'category' | 'status' | 'confidence'
type SortDir   = 'asc' | 'desc'

const ALL_STATUSES: ReviewStatus[] = ['PASS', 'FAIL', 'WARNING', 'NA']

export default function ResultsTable({ findings, overrides, onSelectFinding, onFlagFinding, selectedId }: Props) {
  const [sort, setSort]         = useState<{ field: SortField; dir: SortDir }>({ field: 'status', dir: 'asc' })
  const [statusFilter, setStatusFilter] = useState<ReviewStatus[]>([])
  const [search, setSearch]     = useState('')

  function isOverridden(finding: ReviewFinding): boolean {
    return overrides.some(o => o.checkId === finding.checkId)
  }

  function getOverride(finding: ReviewFinding): FindingOverride | undefined {
    return overrides.find(o => o.checkId === finding.checkId)
  }

  function toggleSort(field: SortField) {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    )
  }

  function toggleStatus(s: ReviewStatus) {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const STATUS_ORDER: Record<ReviewStatus, number> = { FAIL: 0, WARNING: 1, PASS: 2, NA: 3 }

  const filtered = findings
    .filter((f) => statusFilter.length === 0 || statusFilter.includes(f.status))
    .filter((f) =>
      search.trim() === '' ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0
      if (sort.field === 'status')     cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (sort.field === 'confidence') cmp = a.confidence - b.confidence
      if (sort.field === 'title')      cmp = a.title.localeCompare(b.title)
      if (sort.field === 'category')   cmp = a.category.localeCompare(b.category)
      return sort.dir === 'asc' ? cmp : -cmp
    })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronDown size={13} className="opacity-30" />
    return sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="input h-8 text-xs w-48"
          placeholder="Search checks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1 ml-1">
          <Filter size={13} className="text-slate-500" />
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                statusFilter.includes(s)
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                  : 'border-surface-border text-slate-500 hover:text-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide">
              {(
                [
                  { field: 'title',      label: 'Check'      },
                  { field: 'category',   label: 'Category'   },
                  { field: 'status',     label: 'Status'     },
                  { field: 'confidence', label: 'Confidence' },
                ] as const
              ).map(({ field, label }) => (
                <th
                  key={field}
                  className="text-left px-4 py-3 cursor-pointer hover:text-slate-300 select-none whitespace-nowrap"
                  onClick={() => toggleSort(field)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    <SortIcon field={field} />
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-3">Finding</th>
              <th className="px-4 py-3">Pages</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const overridden = isOverridden(f)
              const override = getOverride(f)
              return (
                <tr
                  key={f.checkId}
                  onClick={() => onSelectFinding(f)}
                  className={`border-b border-surface-border cursor-pointer transition-colors ${
                    selectedId === f.checkId
                      ? 'bg-brand-500/10'
                      : overridden
                      ? 'bg-amber-500/10 hover:bg-amber-500/20'
                      : 'hover:bg-surface-hover'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{f.title}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{f.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.status} size="sm" />
                    {overridden && override && (
                      <div className="text-xs text-amber-400 mt-1">
                        → {override.newStatus}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 bg-surface-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${f.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs">{f.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs">
                    <p className="truncate text-xs">{f.message}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">
                    {f.pages.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFlagFinding(f)
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        overridden
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      title={overridden ? 'Override this finding' : 'Flag as incorrect'}
                    >
                      <AlertTriangle size={12} />
                      {overridden ? 'Override' : 'Flag'}
                    </button>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No results match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
