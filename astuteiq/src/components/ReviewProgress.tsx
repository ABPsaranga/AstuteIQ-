import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { useReviewStore } from '../store/reviewStore'

const STEPS = [
  'Uploading documents',
  'Extracting text',
  'Running AI analysis',
  'Generating findings',
  'Finalising report',
]

function stepFromProgress(progress: number): number {
  if (progress < 20)  return 0
  if (progress < 40)  return 1
  if (progress < 60)  return 2
  if (progress < 80)  return 3
  if (progress < 100) return 4
  return 5
}

export default function ReviewProgress() {
  const { progress, loading } = useReviewStore()
  const currentStep = stepFromProgress(progress)

  return (
    <div className="card animate-fade-in space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white">Processing your document…</h3>
        <p className="text-sm text-slate-400 mt-0.5">This takes 20–60 seconds depending on document length.</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-surface-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <ul className="space-y-3">
        {STEPS.map((step, i) => {
          const done    = i < currentStep
          const active  = i === currentStep && loading
          const pending = i > currentStep

          return (
            <li key={step} className="flex items-center gap-3">
              {done ? (
                <CheckCircle size={16} className="text-green-500 shrink-0" />
              ) : active ? (
                <Loader2 size={16} className="text-brand-400 animate-spin shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-600 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  done    ? 'text-slate-400 line-through' :
                  active  ? 'text-white font-medium' :
                  pending ? 'text-slate-600' : ''
                }`}
              >
                {step}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
