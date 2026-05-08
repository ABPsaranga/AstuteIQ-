// src/pages/SOAAnalysisPage.tsx

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  AlertTriangle,
  AlertCircle,
  Upload,
  X,
  Play,
  Zap,
  CheckCircle,
  XCircle,
  Minus,
  RotateCcw,
  FileText,
  Clock,
} from 'lucide-react'

import StatusBadge from '../components/ui/StatusBadge'
import type { ReviewStatus } from '../features/reviews/types'
import supabase from '../lib/supabase'
import { useLiveDashboardStore } from '../store/liveDashboardStore'

/* ============================================================================
   TYPES
============================================================================ */

interface UploadedDoc {
  id: string
  name: string
  size: number
  type: 'pdf' | 'docx' | 'xlsx' | 'other'
  content: string
  docType: 'pdf_b64' | 'text'
  label: string
}

interface CheckResult {
  id: string
  area:
    | 'consistency'
    | 'structure'
    | 'personalisation'
    | 'compliance'
    | 'regulatory'

  label: string
  status: 'pass' | 'fail' | 'warning' | 'na'
  note: string
}

interface ReviewResult {
  id?: string
  client_name: string
  adviser_name: string
  practice_name: string
  advice_type: string
  date: string
  summary: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  docs_reviewed: string[]
  mode: 'quick' | 'full'
  checks: CheckResult[]
  score?: number
}

/* ============================================================================
   HELPERS
============================================================================ */

function formatBytes(bytes: number): string {
  if (bytes < 1_048_576) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

const STATUS_MAP: Record<string, ReviewStatus> = {
  pass: 'PASS',
  fail: 'FAIL',
  warning: 'WARNING',
  na: 'NA',
}

const STEPS: Record<'quick' | 'full', string[]> = {
  quick: [
    'Reading all documents',
    'Checking figure consistency',
    'Running 13 key compliance checks',
    'Running 2 personalisation checks',
    'Compiling quick report',
  ],

  full: [
    'Reading all documents',
    'Checking consistency across all figures',
    'Checking structure & personalisation',
    'Running compliance checklist',
    'Running regulatory checks',
    'Compiling final report',
  ],
}

function calculateScore(checks: CheckResult[]) {
  if (!checks.length) return 0

  let total = 0

  for (const check of checks) {
    if (check.status === 'pass') total += 100
    else if (check.status === 'warning') total += 60
    else if (check.status === 'na') total += 80
    else total += 20
  }

  return Math.round(total / checks.length)
}

/* ============================================================================
   FILE READER
============================================================================ */

async function readFile(
  file: File,
  labelPrefix: string
): Promise<UploadedDoc> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  const id = `${file.name}_${file.lastModified}`

  // PDF
  if (ext === 'pdf') {
    const buffer = await file.arrayBuffer()

    const binary = Array.from(new Uint8Array(buffer))
      .map((b) => String.fromCharCode(b))
      .join('')

    const b64 = btoa(binary)

    return {
      id,
      name: file.name,
      size: file.size,
      type: 'pdf',
      content: b64,
      docType: 'pdf_b64',
      label: labelPrefix,
    }
  }

  // DOCX
  if (ext === 'docx' || ext === 'doc') {
    try {
      const mammoth = await import('mammoth')

      const buffer = await file.arrayBuffer()

      const result = await mammoth.extractRawText({
        arrayBuffer: buffer,
      })

      return {
        id,
        name: file.name,
        size: file.size,
        type: 'docx',
        content: result.value,
        docType: 'text',
        label: labelPrefix,
      }
    } catch {
      const text = await file.text().catch(() => {
        return `[Could not read ${file.name}]`
      })

      return {
        id,
        name: file.name,
        size: file.size,
        type: 'docx',
        content: text,
        docType: 'text',
        label: labelPrefix,
      }
    }
  }

  // XLSX
  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()

    const binary = Array.from(new Uint8Array(buffer))
      .map((b) => String.fromCharCode(b))
      .join('')

    const b64 = btoa(binary)

    return {
      id,
      name: file.name,
      size: file.size,
      type: 'xlsx',
      content: b64,
      docType: 'pdf_b64',
      label: labelPrefix,
    }
  }

  // fallback
  const text = await file.text().catch(() => {
    return `[Could not read ${file.name}]`
  })

  return {
    id,
    name: file.name,
    size: file.size,
    type: 'other',
    content: text,
    docType: 'text',
    label: labelPrefix,
  }
}

/* ============================================================================
   UPLOAD ZONE
============================================================================ */

interface ZoneProps {
  label: string
  num: number
  desc: string
  formats: string

  file: UploadedDoc | null

  multiple?: boolean
  files?: UploadedDoc[]

  onDrop: (files: File[]) => void
  onRemove: (id?: string) => void
}

function UploadZone({
  label,
  num,
  desc,
  formats,
  file,
  multiple,
  files,
  onDrop,
  onRemove,
}: ZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: multiple ?? false,

    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
  })

  const hasFile = multiple
    ? (files?.length ?? 0) > 0
    : !!file

  return (
    <div
      className={`relative flex flex-col gap-3 border-2 border-dashed rounded-2xl p-4 min-h-[220px] transition-all duration-300 ${
        hasFile
          ? 'border-[#6B2FD9] bg-[#6B2FD9]/10 shadow-lg shadow-[#6B2FD9]/10'
          : isDragActive
          ? 'border-[#A78BFA] bg-[#6B2FD9]/10'
          : 'border-slate-800 bg-[#0f0f1a] hover:border-[#6B2FD9]/40'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-[#6B2FD9] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {num}
        </span>

        <span
          className={`text-sm font-semibold ${
            hasFile ? 'text-[#A78BFA]' : 'text-slate-200'
          }`}
        >
          {label}
        </span>
      </div>

      <p className="text-xs text-slate-500">{desc}</p>

      <p className="text-xs text-slate-600 italic">{formats}</p>

      {!multiple && file && (
        <div className="flex items-center gap-2 bg-[#141421] border border-slate-800 rounded-lg px-3 py-2 mt-auto">
          <FileText size={13} className="text-[#A78BFA]" />

          <span className="text-xs text-slate-200 flex-1 truncate">
            {file.name}
          </span>

          <span className="text-xs text-slate-500">
            {formatBytes(file.size)}
          </span>

          <button
            onClick={() => onRemove()}
            className="text-slate-600 hover:text-[#FF6B6B]"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {multiple && files && files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 bg-[#141421] border border-slate-800 rounded-lg px-3 py-1.5"
            >
              <span className="text-xs text-slate-200 flex-1 truncate">
                {f.name}
              </span>

              <button
                onClick={() => onRemove(f.id)}
                className="text-slate-600 hover:text-[#FF6B6B]"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        {...getRootProps()}
        className="flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer rounded-lg p-3 hover:bg-[#6B2FD9]/5 transition-colors"
      >
        <input {...getInputProps()} />

        <Upload
          size={20}
          className={isDragActive ? 'text-[#A78BFA]' : 'text-slate-600'}
        />

        <p className="text-xs text-slate-500 text-center">
          {isDragActive
            ? 'Drop files here'
            : 'Click or drag to upload'}
        </p>
      </div>
    </div>
  )
}

/* ============================================================================
   MAIN PAGE
============================================================================ */

export default function SOAAnalysisPage() {
  const [soaDoc, setSoaDoc] = useState<UploadedDoc | null>(null)

  const [refDoc, setRefDoc] =
    useState<UploadedDoc | null>(null)

  const [suppDocs, setSuppDocs] = useState<UploadedDoc[]>([])

  const [loading, setLoading] = useState(false)

  const [mode, setMode] =
    useState<'quick' | 'full'>('full')

  const [step, setStep] = useState(0)

  const [elapsed, setElapsed] = useState(0)

  const [error, setError] = useState<string | null>(null)

  const [result, setResult] =
    useState<ReviewResult | null>(null)

  const [streamText, setStreamText] = useState('')

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  /* ==========================================================================
     LIVE DASHBOARD STORE
  ========================================================================== */

  const addLiveReview =
    useLiveDashboardStore((s) => s.addReview)

  const updateLiveReview =
    useLiveDashboardStore((s) => s.updateReview)

  /* ==========================================================================
     FILE DROPS
  ========================================================================== */

  const handleSoaDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return

    const doc = await readFile(
      files[0],
      'NEW SOA BEING REVIEWED'
    )

    setSoaDoc(doc)
  }, [])

  const handleRefDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return

    const doc = await readFile(files[0], 'REFERENCE SOA')

    setRefDoc(doc)
  }, [])

  const handleSuppDrop = useCallback(
    async (files: File[]) => {
      const existing = suppDocs.length

      const docs = await Promise.all(
        files
          .slice(0, 10 - existing)
          .map((file, index) =>
            readFile(
              file,
              `SUPPORTING DOCUMENT ${existing + index + 1}`
            )
          )
      )

      setSuppDocs((prev) => [...prev, ...docs])
    },
    [suppDocs]
  )

  /* ==========================================================================
     RUN REVIEW
  ========================================================================== */

  async function runReview(reviewMode: 'quick' | 'full') {
    if (!soaDoc) {
      setError('Please upload an SOA.')
      return
    }

    setLoading(true)
    setMode(reviewMode)

    setError(null)
    setResult(null)
    setElapsed(0)
    setStep(1)
    setStreamText('')

    /* ============================================================
       LIVE DASHBOARD REVIEW ENTRY
    ============================================================ */

    const liveReviewId = crypto.randomUUID()

    addLiveReview({
      id: liveReviewId,
      fileName: soaDoc.name,
      status: 'processing',
      progress: 5,
      createdAt: new Date().toISOString(),
      mode: reviewMode,
      score: 0,
    })

    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)

    const controller = new AbortController()

    abortRef.current = controller

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 180000)

    try {
      const documents = [
        soaDoc,
        ...(refDoc ? [refDoc] : []),
        ...suppDocs,
      ].map((d) => ({
        type: d.docType,
        label: d.label,
        content: d.content,
      }))

      setStep(2)

      updateLiveReview(liveReviewId, {
        progress: 20,
      })

      const { data } = await supabase.auth.getSession()

      const token = data.session?.access_token ?? ''

      const BASE_URL =
        import.meta.env.VITE_API_BASE_URL ??
        import.meta.env.VITE_API_URL ??
        'http://127.0.0.1:8001'

      const response = await fetch(
        `${BASE_URL}/api/soa/review/stream`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            mode: reviewMode,
            documents,
          }),

          signal: controller.signal,
        }
      )

      if (!response.ok) {
        let message = `Server error ${response.status}`

        try {
          const err = await response.json()

          message = err.detail ?? message
        } catch {
          //
        }

        throw new Error(message)
      }

      if (!response.body) {
        throw new Error('Streaming response unavailable.')
      }

      setStep(3)

      updateLiveReview(liveReviewId, {
        progress: 35,
      })

      const reader = response.body.getReader()

      const decoder = new TextDecoder()

      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, {
          stream: true,
        })

        fullText += chunk

        const events = fullText.split('\n\n')

        fullText = events.pop() || ''

        for (const event of events) {
          const line = event
            .split('\n')
            .find((l) => l.startsWith('data: '))

          if (!line) continue

          try {
            const payload = JSON.parse(
              line.replace(/^data:\s*/, '')
            )

            if (payload.chunk) {
              setStreamText((prev) => prev + payload.chunk)
            }

            if (payload.step) {
              setStep(payload.step)

              updateLiveReview(liveReviewId, {
                progress: Math.min(payload.step * 18, 90),
              })
            }

            if (payload.result) {
              const finalScore = calculateScore(
                payload.result.checks || []
              )

              setResult({
                ...payload.result,
                score: finalScore,
              })

              setStreamText('')

              setStep(6)

              /* ============================================
                 FINAL LIVE DASHBOARD UPDATE
              ============================================ */

              updateLiveReview(liveReviewId, {
                status: 'complete',
                progress: 100,
                score: finalScore,
              })
            }

            if (payload.error) {
              throw new Error(payload.error)
            }
          } catch (parseErr) {
            console.error('SSE parse error:', parseErr)
          }
        }
      }
    } catch (err: any) {
      console.error('Review error:', err)

      const message = err?.message ?? ''

      updateLiveReview(liveReviewId, {
        status: 'failed',
        progress: 100,
      })

      if (
        message === 'The operation was aborted.' ||
        message.includes('aborted')
      ) {
        setError(
          'Review timed out after 180 seconds.'
        )
      } else {
        setError(message || 'Review failed.')
      }
    } finally {
      clearTimeout(timeoutId)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      setLoading(false)
      setStep(0)
    }
  }

  /* ==========================================================================
     RESET
  ========================================================================== */

  function reset() {
    setSoaDoc(null)
    setRefDoc(null)
    setSuppDocs([])

    setResult(null)
    setError(null)
    setElapsed(0)
    setStreamText('')
  }

  /* ==========================================================================
     UI
  ========================================================================== */

  const activeSteps = STEPS[loading ? mode : 'full']

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="page-header bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          SOA Analysis
        </h1>

        <p className="page-sub">
          AI-powered SOA compliance review.
        </p>
      </div>

      {/* Uploads */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UploadZone
          num={1}
          label="New SOA *"
          desc="The SOA being reviewed"
          formats="DOCX or PDF"
          file={soaDoc}
          onDrop={handleSoaDrop}
          onRemove={() => setSoaDoc(null)}
        />

        <UploadZone
          num={2}
          label="Reference SOA"
          desc="Optional comparison document"
          formats="DOCX or PDF"
          file={refDoc}
          onDrop={handleRefDrop}
          onRemove={() => setRefDoc(null)}
        />

        <UploadZone
          num={3}
          label="Supporting Documents"
          desc="Fact find, fee comparison, CGT workings, etc."
          formats="PDF, DOCX, XLSX"
          multiple
          files={suppDocs}
          file={null}
          onDrop={handleSuppDrop}
          onRemove={(id) =>
            setSuppDocs((prev) =>
              prev.filter((d) => d.id !== id)
            )
          }
        />
      </div>

      {/* RUN */}

      {!result && (
        <div className="card space-y-4 border border-slate-800/80 bg-gradient-to-b from-[#11111d] to-[#0B0B14] shadow-2xl shadow-black/30">
          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-sm text-[#FF6B6B]">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {!loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => runReview('quick')}
                disabled={!soaDoc}
                className="relative flex flex-col gap-2 p-5 rounded-2xl border-2 border-[#6B2FD9]/40 bg-[#6B2FD9]/5 hover:bg-[#6B2FD9]/10 transition-all hover:scale-[1.02] disabled:opacity-30"
              >
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[#A78BFA]" />

                  <span className="text-sm font-semibold text-white">
                    Quick Check
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-slate-400 text-left">
                  <li>• Fast compliance review</li>
                  <li>• Key consistency checks</li>
                  <li>• FAIL + WARNING focus</li>
                </ul>
              </button>

              <button
                onClick={() => runReview('full')}
                disabled={!soaDoc}
                className="relative flex flex-col gap-2 p-5 rounded-2xl border-2 border-[#6B2FD9] bg-[#6B2FD9]/10 hover:bg-[#6B2FD9]/15 transition-all hover:scale-[1.02] disabled:opacity-30"
              >
                <div className="flex items-center gap-2">
                  <Play size={16} className="text-[#A78BFA]" />

                  <span className="text-sm font-semibold text-white">
                    Full Review
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-slate-400 text-left">
                  <li>• Full compliance analysis</li>
                  <li>• Regulatory validation</li>
                  <li>• Detailed findings</li>
                </ul>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-[#6B2FD9] border-t-transparent rounded-full animate-spin" />

                <span>{activeSteps[(step - 1) || 0]}</span>

                <span className="ml-auto text-xs text-slate-600 font-mono">
                  {elapsed}s
                </span>
              </div>

              {/* PREMIUM PROGRESS BAR */}

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6B2FD9] to-[#A78BFA] transition-all duration-500"
                  style={{
                    width: `${Math.min(step * 18, 100)}%`,
                  }}
                />
              </div>

              <div className="space-y-2">
                {activeSteps.map((s, i) => {
                  const done = i + 1 < step
                  const active = i + 1 === step

                  return (
                    <div
                      key={s}
                      className={`flex items-center gap-2 text-xs transition-all ${
                        done
                          ? 'text-[#2DD4A0]'
                          : active
                          ? 'text-[#A78BFA]'
                          : 'text-slate-600'
                      }`}
                    >
                      {done ? (
                        <CheckCircle size={13} />
                      ) : active ? (
                        <Clock
                          size={13}
                          className="animate-pulse"
                        />
                      ) : (
                        <Minus size={13} />
                      )}

                      {s}
                    </div>
                  )
                })}
              </div>

              {streamText && (
                <pre className="bg-[#0B0B14] border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-auto max-h-48 whitespace-pre-wrap animate-fade-in">
                  {streamText}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* RESULTS */}

      {result && (
        <div className="card space-y-4 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                className="text-lg font-bold text-white"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                }}
              >
                {result.client_name || 'Client'}
              </h2>

              <p className="text-xs text-slate-500">
                {result.advice_type}
              </p>
            </div>

            <button
              onClick={reset}
              className="btn-secondary text-sm"
            >
              <RotateCcw size={13} />
              New Review
            </button>
          </div>

          <div className="border-l-2 border-[#6B2FD9]/60 pl-4 text-sm text-slate-400 whitespace-pre-line">
            {result.summary}
          </div>

          {result.checks.map((check) => (
            <div
              key={check.id}
              className="py-3 border-b border-slate-800/60"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {check.status === 'pass' && (
                    <CheckCircle
                      size={15}
                      className="text-[#2DD4A0]"
                    />
                  )}

                  {check.status === 'fail' && (
                    <XCircle
                      size={15}
                      className="text-[#FF6B6B]"
                    />
                  )}

                  {check.status === 'warning' && (
                    <AlertTriangle
                      size={14}
                      className="text-[#FFB347]"
                    />
                  )}

                  {check.status === 'na' && (
                    <Minus
                      size={15}
                      className="text-slate-600"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-slate-500">
                      {check.id}
                    </span>

                    <StatusBadge
                      status={
                        STATUS_MAP[check.status] ?? 'NA'
                      }
                      size="sm"
                    />

                    <span className="text-sm font-medium text-slate-200">
                      {check.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {check.note}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}