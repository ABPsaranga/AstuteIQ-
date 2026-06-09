import apiClient from '../../lib/api'
import type { ReviewRecord, ReviewHistoryResponse, RunReviewPayload } from './types'

// ─── Run a review ─────────────────────────────────────────────────────────────

export async function runReviewApi(payload: RunReviewPayload): Promise<ReviewRecord> {
  const res = await apiClient.post<ReviewRecord>('/reviews/run', payload)
  return res.data
}

// ─── Fetch a single review ────────────────────────────────────────────────────

export async function getReviewApi(id: string): Promise<ReviewRecord> {
  const res = await apiClient.get<ReviewRecord>(`/reviews/${id}`)
  return res.data
}

// ─── Review history ───────────────────────────────────────────────────────────

export async function getReviewHistoryApi(page = 1, limit = 20): Promise<ReviewHistoryResponse> {
  const res = await apiClient.get<ReviewHistoryResponse>('/reviews/history', {
    params: { page, limit },
  })
  return res.data
}

// ─── Submit override ──────────────────────────────────────────────────────────

export async function submitOverrideApi(
  reviewId:  string,
  checkId:   string,
  newStatus: string,
  comment:   string,
): Promise<void> {
  await apiClient.post(`/reviews/${reviewId}/override`, { checkId, newStatus, comment })
}

// ─── Upload file ──────────────────────────────────────────────────────────────

export async function uploadFileApi(
  file:        File,
  onProgress?: (pct: number) => void,
): Promise<{ fileId: string }> {
  const form = new FormData()
  form.append('file', file)

  const res = await apiClient.post<{ fileId: string }>('/reviews/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
    },
  })
  return res.data
}

// ─── Review stats ─────────────────────────────────────────────────────────────

export async function getReviewStats() {
  const res = await apiClient.get('/reviews/stats')
  return res.data
}