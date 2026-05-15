import { useState, useCallback, useEffect } from 'react'
import apiClient from '../../lib/api'
import { getReviewStats } from './api'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type ReviewMode =
  | 'quick'
  | 'full'

export type ReviewStatus =
  | 'pending'
  | 'processing'
  | 'complete'
  | 'failed'
  | 'error'

export type FindingStatus =
  | 'PASS'
  | 'FAIL'
  | 'WARN'
  | 'WARNING'
  | 'NA'

export interface ReviewFinding {
  id: string

  checkId: string

  title: string

  category: string

  status: FindingStatus

  severity?: string

  message: string

  excerpt?: string

  recommendation?: string

  pages: number[]
}

export interface FindingOverride {
  id: string

  checkId: string

  originalStatus: string

  newStatus: string

  comment: string

  overriddenBy: string

  overriddenAt: string
}

export interface ReviewResult {
  summary?: string

  checks?: unknown[]

  findings?: unknown[]
}

export interface ReviewRecord {
  id: string

  userId: string

  fileName: string

  fileSize: number

  mode: ReviewMode

  status: ReviewStatus

  score: number

  findings: ReviewFinding[]

  checks?: unknown[]

  overrides: FindingOverride[]

  createdAt: string

  completedAt?: string

  clientName?: string

  adviserName?: string

  practiceName?: string

  riskLevel?: string

  result?: ReviewResult
}

interface HistoryResponse {
  reviews: ReviewRecord[]

  total: number

  page: number

  limit: number
}

// ─────────────────────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────────────────────

function normalizeMode(
  mode?: string
): ReviewMode {
  return mode === 'quick'
    ? 'quick'
    : 'full'
}

function normalizeStatus(
  status?: string
): ReviewStatus {
  const value = String(status).toLowerCase()

  if (value === 'pending')
    return 'pending'

  if (value === 'processing')
    return 'processing'

  if (value === 'complete')
    return 'complete'

  if (value === 'failed')
    return 'failed'

  if (value === 'error')
    return 'error'

  return 'processing'
}

function normalizeFindingStatus(
  status?: string
): FindingStatus {
  const value = String(
    status ?? ''
  ).toUpperCase()

  if (value === 'PASS')
    return 'PASS'

  if (value === 'FAIL')
    return 'FAIL'

  if (
    value === 'WARN' ||
    value === 'WARNING'
  )
    return 'WARN'

  if (value === 'NA')
    return 'NA'

  return 'WARN'
}

function normalizeFindings(
  raw: unknown
): ReviewFinding[] {
  if (!Array.isArray(raw))
    return []

  return raw.map(
    (
      item: any,
      index: number
    ): ReviewFinding => ({
      id:
        item.id ??
        `finding-${index}`,

      checkId:
        item.checkId ??
        item.id ??
        `check-${index}`,

      title:
        item.title ??
        item.label ??
        'Untitled Finding',

      category:
        item.category ??
        item.area ??
        'General',

      status:
        normalizeFindingStatus(
          item.status
        ),

      severity:
        item.severity ??
        'medium',

      message:
        item.message ??
        item.note ??
        '',

      excerpt:
        item.excerpt ??
        '',

      recommendation:
        item.recommendation ??
        '',

      pages: Array.isArray(
        item.pages
      )
        ? item.pages
        : [],
    })
  )
}

function normalizeOverrides(
  overrides: unknown
): FindingOverride[] {
  if (!Array.isArray(overrides))
    return []

  return overrides.map(
    (o: any): FindingOverride => ({
      id:
        o.id ??
        crypto.randomUUID(),

      checkId:
        o.checkId ??
        o.findingId ??
        o.check_id ??
        '',

      originalStatus:
        o.originalStatus ??
        o.original_status ??
        'WARN',

      newStatus:
        o.newStatus ??
        o.new_status ??
        'WARN',

      comment:
        o.comment ?? '',

      overriddenBy:
        o.overriddenBy ??
        o.user_id ??
        'system',

      overriddenAt:
        o.overriddenAt ??
        o.createdAt ??
        new Date().toISOString(),
    })
  )
}

function normalizeReview(
  raw: any
): ReviewRecord {
  const findings =
    normalizeFindings(
      raw?.findings ??
        raw?.checks ??
        raw?.result?.checks ??
        []
    )

  return {
    id:
      raw?.id ?? '',

    userId:
      raw?.userId ??
      raw?.user_id ??
      '',

    fileName:
      raw?.fileName ??
      raw?.file_name ??
      'Untitled Review',

    fileSize:
      Number(
        raw?.fileSize ??
          raw?.file_size ??
          0
      ),

    mode: normalizeMode(
      raw?.mode
    ),

    status: normalizeStatus(
      raw?.status
    ),

    score: Number(
      raw?.score ?? 0
    ),

    findings,

    checks:
      raw?.checks ?? [],

    overrides:
      normalizeOverrides(
        raw?.overrides
      ),

    createdAt:
      raw?.createdAt ??
      raw?.created_at ??
      new Date().toISOString(),

    completedAt:
      raw?.completedAt ??
      raw?.completed_at,

    clientName:
      raw?.clientName ??
      raw?.client_name ??
      raw?.result?.client_name ??
      '',

    adviserName:
      raw?.adviserName ??
      raw?.adviser_name ??
      raw?.result?.adviser_name ??
      '',

    practiceName:
      raw?.practiceName ??
      raw?.practice_name ??
      raw?.result?.practice_name ??
      '',

    riskLevel:
      raw?.riskLevel ??
      raw?.risk_level ??
      raw?.result?.risk_level ??
      'MEDIUM',

    result:
      raw?.result ?? {},
  }
}

// ─────────────────────────────────────────────────────────────
// REVIEW HISTORY
// ─────────────────────────────────────────────────────────────

export function useReviewHistory() {
  const [data, setData] =
    useState<HistoryResponse | null>(
      null
    )

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const fetch = useCallback(
    async (
      page = 1,
      limit = 20
    ) => {
      setLoading(true)

      setError(null)

      try {
        const res =
          await apiClient.get<HistoryResponse>(
            `/reviews/history?page=${page}&limit=${limit}`
          )

        const normalizedReviews =
          (
            res.data.reviews ??
            []
          ).map(normalizeReview)

        setData({
          ...res.data,

          reviews:
            normalizedReviews,
        })
      } catch (err: any) {
        const message =
          err?.response?.data
            ?.detail ??
          err?.message ??
          'Failed to load history.'

        setError(message)

        console.error(
          '[useReviewHistory]',
          message
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    data,
    loading,
    error,
    fetch,
  }
}

// ─────────────────────────────────────────────────────────────
// SINGLE REVIEW
// ─────────────────────────────────────────────────────────────

export function useFetchReview(
  reviewId?: string
) {
  const [review, setReview] =
    useState<ReviewRecord | null>(
      null
    )

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const fetch = useCallback(
    async () => {
      if (!reviewId) return

      setLoading(true)

      setError(null)

      try {
        const res =
          await apiClient.get(
            `/reviews/${reviewId}`
          )

        const normalized =
          normalizeReview(
            res.data
          )

        setReview(normalized)
      } catch (err: any) {
        const message =
          err?.response?.data
            ?.detail ??
          err?.message ??
          'Failed to load review.'

        setError(message)

        console.error(
          '[useFetchReview]',
          message
        )
      } finally {
        setLoading(false)
      }
    },
    [reviewId]
  )

  return {
    review,
    loading,
    error,
    fetch,
  }
}

// ─────────────────────────────────────────────────────────────
// RUN REVIEW
// ─────────────────────────────────────────────────────────────

export function useRunReview() {
  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function run(
    fileIds: string[],
    mode: ReviewMode = 'full'
  ) {
    setLoading(true)

    setError(null)

    try {
      const res =
        await apiClient.post(
          '/reviews/run',
          {
            fileIds,
            mode,
          }
        )

      return normalizeReview(
        res.data
      )
    } catch (err: any) {
      const message =
        err?.response?.data
          ?.detail ??
        err?.message ??
        'Review failed.'

      setError(message)

      console.error(
        '[useRunReview]',
        message
      )

      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    run,
    loading,
    error,
  }
}

// ─────────────────────────────────────────────────────────────
// SUBMIT OVERRIDE
// ─────────────────────────────────────────────────────────────

export function useSubmitOverride(
  reviewId: string
) {
  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function submit(
    checkId: string,
    newStatus: string,
    comment: string
  ) {
    setLoading(true)

    setError(null)

    try {
      await apiClient.post(
        `/reviews/${reviewId}/override`,
        {
          checkId,
          newStatus,
          comment,
        }
      )

      return true
    } catch (err: any) {
      const message =
        err?.response?.data
          ?.detail ??
        err?.message ??
        'Override failed.'

      setError(message)

      console.error(
        '[useSubmitOverride]',
        message
      )

      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    submit,
    loading,
    error,
  }
}

// ─────────────────────────────────────────────────────────────
// REVIEW STATS
// ─────────────────────────────────────────────────────────────

export function useReviewStats() {
  const [data, setData] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    getReviewStats()
      .then(setData)
      .catch((err: any) => {
        const message =
          err?.response?.data
            ?.detail ??
          err?.message ??
          'Failed to load stats.'

        setError(message)

        console.error(
          '[useReviewStats]',
          message
        )
      })
      .finally(() =>
        setLoading(false)
      )
  }, [])

  return {
    data,
    loading,
    error,
  }
}