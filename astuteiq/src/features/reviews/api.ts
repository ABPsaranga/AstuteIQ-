import api from '../../lib/api'
import apiClient from '../../lib/api'
import type { ReviewRecord, ReviewHistoryResponse, RunReviewPayload } from './types'
import { generateMockReview, generateMockHistory } from './utils/normalize'



// ─── Run a review ─────────────────────────────────────────────────────────────

export async function runReviewApi(payload: RunReviewPayload): Promise<ReviewRecord> {
  try {
    const res = await apiClient.post<ReviewRecord>('/reviews/run', payload)
    return res.data
  } catch {
    // Simulate async processing with a mock result
    await new Promise((r) => setTimeout(r, 2500))
    return generateMockReview(payload.mode)
  }
}

// ─── Fetch a single review ────────────────────────────────────────────────────

export async function getReviewApi(id: string): Promise<ReviewRecord> {
  try {
    const res = await apiClient.get<ReviewRecord>(`/reviews/${id}`)
    return res.data
  } catch {
    // Return a consistent mock by seeding with the id
    return generateMockReview('full', id)
  }
}

// ─── Review history ───────────────────────────────────────────────────────────

export async function getReviewHistoryApi(page = 1, limit = 20): Promise<ReviewHistoryResponse> {
  try {
    const res = await apiClient.get<ReviewHistoryResponse>('/reviews/history', {
      params: { page, limit },
    })
    return res.data
  } catch {
    await new Promise((r) => setTimeout(r, 400))
    return generateMockHistory(page, limit)
  }
}

// ─── Submit override ──────────────────────────────────────────────────────────

export async function submitOverrideApi(
  reviewId: string,
  checkId:  string,
  newStatus: string,
  comment:  string
): Promise<void> {
  try {
    await apiClient.post(`/reviews/${reviewId}/override`, { checkId, newStatus, comment })
  } catch {
    await new Promise((r) => setTimeout(r, 300))
  }
}

// ─── Upload file ──────────────────────────────────────────────────────────────

export async function uploadFileApi(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ fileId: string }> {
  try {
    const form = new FormData()
    form.append('file', file)

    const res = await apiClient.post<{ fileId: string }>('/reviews/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
      },
    })
    return res.data
  } catch {
    // Simulate upload
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 150))
      onProgress?.(i)
    }
    return { fileId: `file_${Date.now()}` }
  }
}

export async function getReviewStats() {
  const res = await api.get("/reviews/stats")
  return res.data
}
