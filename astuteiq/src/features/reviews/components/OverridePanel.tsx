import { useState } from 'react'
import { Edit3, X } from 'lucide-react'
import type { ReviewFinding, ReviewStatus } from '../../../features/reviews/types'
import StatusBadge from '../../../components/ui/StatusBadge'
import { useSubmitOverride } from '../../../features/reviews/hooks'

interface Props {
  finding:  ReviewFinding
  reviewId: string
  onClose?: () => void
}

const STATUSES: ReviewStatus[] = ['PASS', 'FAIL', 'WARNING', 'NA']

export default function OverridePanel({ finding, reviewId, onClose }: Props) {
  const [status, setStatus]   = useState<ReviewStatus>(finding.status)
  const [comment, setComment] = useState('')
  const { submit, loading }   = useSubmitOverride(reviewId)

  async function handleSubmit() {
    if (!comment.trim()) return
    const ok = await submit(finding.checkId, status, comment)
    if (ok) onClose?.()
  }

  return (
    <div className="card border-brand-500/30 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Edit3 size={14} className="text-brand-400" />
            <span className="text-xs font-medium text-brand-400 uppercase tracking-wide">Override Finding</span>
          </div>
          <h3 className="text-sm font-semibold text-white">{finding.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{finding.category}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Current */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Current:</span>
        <StatusBadge status={finding.status} size="sm" />
        <span className="text-slate-600">{finding.confidence}% confidence</span>
      </div>

      {/* New status */}
      <div>
        <label className="label">Override status</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                status === s
                  ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                  : 'border-surface-border text-slate-500 hover:border-slate-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="label">
          Reason for override <span className="text-red-500">*</span>
        </label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Explain why you are overriding this finding…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onClose && (
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!comment.trim() || loading || status === finding.status}
          className="btn-primary"
        >
          {loading ? 'Saving…' : 'Save override'}
        </button>
      </div>
    </div>
  )
}
