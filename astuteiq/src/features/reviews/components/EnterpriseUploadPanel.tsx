import { useState } from 'react'
import { Layers, Play, Trash2 } from 'lucide-react'
import FileDropzone from './FileDropzone'
import { useReviewStore } from '../../../store/reviewStore'
import { useRunReview } from '../hooks'
import ReviewProgress from '../../../components/ReviewProgress'
import toast from 'react-hot-toast'

export default function EnterpriseUploadPanel() {
  const { files, clearFiles, loading } = useReviewStore()
  const { run } = useRunReview()
  const [batchName, setBatchName] = useState('')

  async function handleBatchRun() {
    if (files.length === 0) {
      toast.error('Add at least one file.')
      return
    }
    await run([], 'full')
  }

  return (
    <div className="space-y-5">
      {/* Batch name */}
      <div>
        <label className="label flex items-center gap-1.5">
          <Layers size={13} />
          Batch name <span className="text-slate-600 font-normal">(optional)</span>
        </label>
        <input
          className="input"
          placeholder="e.g. Q1 2025 Annual Reviews"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
        />
      </div>

      <FileDropzone />

      {loading ? (
        <ReviewProgress />
      ) : (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            {files.length} file{files.length !== 1 ? 's' : ''} queued
          </p>
          <div className="flex gap-2">
            {files.length > 0 && (
              <button onClick={clearFiles} className="btn-secondary">
                <Trash2 size={14} />
                Clear
              </button>
            )}
            <button
              onClick={handleBatchRun}
              disabled={files.length === 0}
              className="btn-primary"
            >
              <Play size={14} />
              Run batch review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
