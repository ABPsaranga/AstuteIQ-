import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Edit3 } from 'lucide-react'
import { useFetchReview } from '../features/reviews/hooks'
import { summariseFindings } from '../features/reviews/utils/normalize'
import SummaryCard from '../components/ui/SummaryCard'
import ResultsTable from '../features/reviews/components/ResultsTable'
import OverridePanel from '../features/reviews/components/OverridePanel'
import PDFHighlighterViewer from '../features/reviews/components/PDFHighlighterViewer'
import RiskHeatmap from '../components/RiskHeatmap'
import { exportDocx } from '../features/reviews/exportPdf'
import type { FindingOverride, ReviewFinding, ReviewRecord } from '../features/reviews/types'
import { format } from 'date-fns'

export default function ReviewResultsPage() {
  const { id } = useParams<{ id: string }>()

  const { review, loading, fetch } = useFetchReview(id ?? '')

  const [selectedFinding, setSelectedFinding] = useState<ReviewFinding | null>(null)
  const [showOverride, setShowOverride] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch().catch(() => setError('Failed to load review'))
  }, [fetch])

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  // ================= ERROR =================
  if (error || !review) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p>{error ?? 'Review not found.'}</p>
        <Link to="/history" className="btn-secondary mt-4 inline-flex">
          ← Back to history
        </Link>
      </div>
    )
  }

  // ================= NORMALIZERS =================
  const normalizeMode = (mode: string): 'quick' | 'full' =>
  mode === 'full' ? 'full' : 'quick'

  const normalizeStatus = (
  status: string
): 'pending' | 'processing' | 'complete' | 'error' => {
  if (status === 'pending') return 'pending'
  if (status === 'processing') return 'processing'
  if (status === 'complete') return 'complete'
  if (status === 'error') return 'error'
  return 'pending'
}

const normalizeOverrides = (overrides: unknown[]): FindingOverride[] => {
  return overrides.map((o: any) => ({
    id: o.id ?? crypto.randomUUID(),

    // ✅ FIX: correct field name
    checkId: o.checkId ?? o.findingId ?? o.check_id ?? '',

    originalStatus: o.originalStatus ?? o.original_status ?? 'UNKNOWN',
    newStatus: o.newStatus ?? o.new_status ?? 'UNKNOWN',

    comment: o.comment ?? '',

    // ✅ REQUIRED FIELDS (missing before)
    overriddenBy: o.overriddenBy ?? o.user_id ?? 'system',
    overriddenAt: o.overriddenAt ?? o.createdAt ?? new Date().toISOString(),
  }))
}


  // ================= SAFE REVIEW =================
  const safeReview: ReviewRecord = {
  ...review,
  mode: normalizeMode(review.mode),
  status: normalizeStatus(review.status),
  findings: (review.findings ?? []) as ReviewFinding[],

  // ✅ FIXED HERE
  overrides: normalizeOverrides(review.overrides ?? []),
}

  const findings: ReviewFinding[] = safeReview.findings

  const summary = summariseFindings(findings)

  // ================= EXPORT =================
  function handleExport() {
    exportDocx({
      clientName: safeReview.fileName || 'Client',
      adviser: 'Adviser',
      reviewer: 'AstuteIQ Engine',
      date: safeReview.completedAt
        ? format(new Date(safeReview.completedAt), 'dd MMM yyyy')
        : 'N/A',

      findings: findings.map((f) => ({
        section: f.category || 'General',
        title: f.title,
        status:
          f.status === 'PASS'
            ? 'PASS'
            : f.status === 'FAIL'
            ? 'FAIL'
            : 'WARN',
        issue: f.message,
        recommendation:
          'Review and update to meet ASIC compliance requirements',
      })),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/history"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-2"
          >
            <ArrowLeft size={12} /> History
          </Link>

          <h1 className="page-header">{safeReview.fileName}</h1>

          <p className="page-sub">
            {safeReview.mode === 'quick' ? 'Quick check' : 'Full review'} ·{' '}
            {safeReview.completedAt
              ? format(new Date(safeReview.completedAt), 'dd MMM yyyy, h:mm a')
              : 'Pending'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedFinding && (
            <button
              onClick={() => setShowOverride(true)}
              className="btn-secondary"
            >
              <Edit3 size={14} />
              Override finding
            </button>
          )}

          <button onClick={handleExport} className="btn-secondary">
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SummaryCard summary={summary} score={safeReview.score} />

        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">
            Risk by category
          </h3>
          <RiskHeatmap findings={findings} />
        </div>
      </div>

      {/* RESULTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white">
            Detailed findings
          </h2>

          <ResultsTable
            findings={findings}
            onSelectFinding={(f: ReviewFinding) => {
              setSelectedFinding(f)
              setShowOverride(false)
            }}
            selectedId={selectedFinding?.checkId}
          />

          {showOverride && selectedFinding && (
            <OverridePanel
              finding={selectedFinding}
              reviewId={safeReview.id}
              onClose={() => setShowOverride(false)}
            />
          )}

          {selectedFinding && !showOverride && (
            <div className="card space-y-3 animate-slide-up">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                    {selectedFinding.category}
                  </p>
                  <h3 className="text-sm font-semibold text-white mt-0.5">
                    {selectedFinding.title}
                  </h3>
                </div>

                <button
                  onClick={() => setShowOverride(true)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  <Edit3 size={12} />
                  Override
                </button>
              </div>

              <p className="text-sm text-slate-400">
                {selectedFinding.message}
              </p>

              {selectedFinding.excerpt && (
                <blockquote className="border-l-2 border-brand-500/40 pl-3 text-xs text-slate-500 italic">
                  {selectedFinding.excerpt}
                </blockquote>
              )}

              <p className="text-xs text-slate-600">
                Referenced pages: {selectedFinding.pages.join(', ')}
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white mb-3">
            Document viewer
          </h2>

          <PDFHighlighterViewer
            findings={findings}
            selectedFinding={selectedFinding}
          />
        </div>
      </div>
    </div>
  )
}