// ─── Status ───────────────────────────────────────────────────────────────────

export type ReviewStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NA'

export type ReviewMode = 'quick' | 'full'

// ─── Individual Finding ───────────────────────────────────────────────────────

export interface ReviewFinding {
  checkId:    string
  category:   string
  title:      string
  status:     ReviewStatus
  confidence: number          // 0–100
  message:    string
  pages:      number[]        // page numbers referenced
  excerpt?:   string          // quoted text from document
  section?:   string          // e.g. "Risk Profile", "Fees Disclosure"
}

// ─── Override ─────────────────────────────────────────────────────────────────

export interface FindingOverride {
  checkId:      string
  newStatus:    ReviewStatus
  comment:      string
  overriddenBy: string        // user id
  overriddenAt: string        // ISO date
}

// ─── Review Record ────────────────────────────────────────────────────────────

export interface ReviewRecord {
  id:          string
  userId:      string
  fileName:    string
  fileSize:    number
  mode:        ReviewMode
  status:      'pending' | 'processing' | 'complete' | 'error'
  score:       number          // overall 0–100
  findings:    ReviewFinding[]
  overrides:   FindingOverride[]
  createdAt:   string          // ISO date
  completedAt: string | null
  error?:      string
}

// ─── Summary Counts ───────────────────────────────────────────────────────────

export interface ReviewSummary {
  total:   number
  pass:    number
  fail:    number
  warning: number
  na:      number
}

// ─── Upload File ──────────────────────────────────────────────────────────────

export interface UploadedFile {
  id:       string
  file:     File
  name:     string
  size:     number
  mimeType: string
  status:   'pending' | 'uploading' | 'done' | 'error'
  progress: number
}

// ─── API DTO ──────────────────────────────────────────────────────────────────

export interface RunReviewPayload {
  fileIds: string[]
  mode:    ReviewMode
}

export interface ReviewHistoryResponse {
  reviews: ReviewRecord[]
  total:   number
  page:    number
  limit:   number
}
