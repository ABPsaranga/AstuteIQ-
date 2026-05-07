import { useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, X, FileText } from 'lucide-react'
import { useReviewStore } from '../../../store/reviewStore'
import type { UploadedFile } from '../../../features/reviews/types'
import toast from 'react-hot-toast'

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
}

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024)      return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

export default function FileDropzone() {
  const { files, addFiles, removeFile } = useReviewStore()

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      rejected.forEach(({ file, errors }) => {
        toast.error(`${file.name}: ${errors[0]?.message ?? 'Rejected'}`)
      })

      const mapped: UploadedFile[] = accepted.map((f) => ({
        id:       `${f.name}_${f.lastModified}`,
        file:     f,
        name:     f.name,
        size:     f.size,
        mimeType: f.type,
        status:   'pending',
        progress: 0,
      }))

      addFiles(mapped)
    },
    [addFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:  ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-surface-border hover:border-brand-500/50 hover:bg-surface-hover'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-brand-400' : 'text-slate-600'}`} />
        {isDragActive ? (
          <p className="text-brand-400 font-medium">Drop files here…</p>
        ) : (
          <>
            <p className="text-slate-300 font-medium">
              Drag & drop files, or{' '}
              <span className="text-brand-400 underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF or DOCX · Max 20 MB per file</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 bg-surface-hover border border-surface-border rounded-lg px-4 py-3">
              <FileText size={16} className="text-brand-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{f.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(f.size)}</p>
                {f.status === 'uploading' && (
                  <div className="h-1 bg-surface-border rounded mt-1.5">
                    <div className="h-full bg-brand-500 rounded transition-all" style={{ width: `${f.progress}%` }} />
                  </div>
                )}
              </div>
              <button onClick={() => removeFile(f.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}