import type {
  ReviewRecord,
  ReviewFinding,
  ReviewStatus,
  ReviewSummary,
  ReviewHistoryResponse,
} from '../types'

// ─── Transform raw API shape → UI-ready shape ─────────────────────────────────

export function normalizeReview(raw: ReviewRecord): ReviewRecord {
  return {
    ...raw,
    findings:  (raw.findings ?? []).map(normalizeFinding),
    overrides: raw.overrides ?? [],
  }
}

function normalizeFinding(raw: ReviewFinding): ReviewFinding {
  return {
    ...raw,
    confidence: Math.min(100, Math.max(0, raw.confidence ?? 0)),
    pages:      raw.pages   ?? [],
    excerpt:    raw.excerpt ?? '',
  }
}

// ─── Compute summary counts from findings ─────────────────────────────────────

export function summariseFindings(findings: ReviewFinding[]): ReviewSummary {
  return findings.reduce<ReviewSummary>(
    (acc, f) => {
      acc.total++
      if (f.status === 'PASS')    acc.pass++
      if (f.status === 'FAIL')    acc.fail++
      if (f.status === 'WARNING') acc.warning++
      if (f.status === 'NA')      acc.na++
      return acc
    },
    { total: 0, pass: 0, fail: 0, warning: 0, na: 0 }
  )
}