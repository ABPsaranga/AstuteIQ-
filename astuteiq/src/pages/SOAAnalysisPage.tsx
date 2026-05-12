// src/pages/SOAAnalysisPage.tsx
// Logic ported from HTML prototype: two-stage review, token budget management,
// full system prompt (C1-C29, P1-P10, calibration), JSON repair, mergeResults,
// feedbackStore with localStorage, elapsed timer.

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  AlertTriangle, AlertCircle, Upload, X, Play, Zap,
  CheckCircle, XCircle, Minus, RotateCcw, FileText,
  Clock, Flag, Download, ChevronDown, ChevronUp,
} from 'lucide-react'

import StatusBadge from '../components/ui/StatusBadge'
import type { ReviewStatus } from '../features/reviews/types'
import supabase from '../lib/supabase'
import { useReviewStore } from '../store/liveReviewStore'

/* ============================================================================
   TYPES
============================================================================ */

interface UploadedDoc {
  id:      string
  name:    string
  size:    number
  type:    'pdf' | 'docx' | 'xlsx' | 'other'
  content: string
  docType: 'pdf_b64' | 'text'
  label:   string
}

interface CheckResult {
  id:     string
  area:   'consistency' | 'structure' | 'personalisation' | 'compliance' | 'regulatory'
  label:  string
  status: 'pass' | 'fail' | 'warning' | 'na'
  note:   string
}

interface FeedbackEntry {
  flagged?:        boolean
  overrideStatus?: string
  comment?:        string
}

interface Override {
  originalStatus: CheckResult['status']
  newStatus:      CheckResult['status']
  comment:        string
}

interface ReviewResult {
  assessment: any
  id?:                 string
  client_name:         string
  adviser_name:        string
  practice_name:       string
  advice_type:         string
  date:                string
  summary:             string
  risk_level:          'LOW' | 'MEDIUM' | 'HIGH'
  docs_reviewed:       string[]
  mode:                'quick' | 'full'
  checks:              CheckResult[]
  score?:              number
  stage?:              number
  additional_summary?: string
}

/* ============================================================================
   CONSTANTS
============================================================================ */

const STATUS_MAP: Record<string, ReviewStatus> = {
  pass: 'PASS', fail: 'FAIL', warning: 'WARNING', na: 'NA',
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
    'Running compliance checklist (C1-C29)',
    'Running personalisation checks (P1-P10)',
    'Compiling final report',
  ],
}

function normaliseArea(area: string): string {
  return (area || '').toLowerCase().replace(/z/g, 's').trim()
}

/* ============================================================================
   TOKEN BUDGET
============================================================================ */

function estimateTokens(content: string, type: 'pdf_b64' | 'text'): number {
  if (type === 'pdf_b64') return Math.round((content.length * 0.75) / 3.5)
  return Math.round(content.length / 4)
}

function getStage1SuppCount(
  soaDoc: UploadedDoc,
  refDoc: UploadedDoc | null,
  suppDocs: UploadedDoc[]
): number {
  const BUDGET  = 170_000
  const sysCost = 4_000
  const soaCost = estimateTokens(soaDoc.content, soaDoc.docType)
  const refCost = refDoc ? Math.min(estimateTokens(refDoc.content, refDoc.docType), 10_000) : 0
  let total = sysCost + soaCost + refCost
  let count = 0
  for (const doc of suppDocs) {
    const t = Math.min(estimateTokens(doc.content, doc.docType), 30_000)
    if (total + t > BUDGET) break
    total += t
    count++
  }
  return count
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.substring(0, maxChars) + '\n\n[Document truncated to stay within token limits.]'
}

function truncateRefSoa(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const lines   = text.split('\n')
  const result: string[] = []
  let charCount = 0
  let sectionLines = 0
  for (const line of lines) {
    const trimmed = line.trim()
    const isHeading =
      trimmed.length > 0 && trimmed.length < 80 &&
      (/^[0-9]+[.\s]/.test(trimmed) || /^[A-Z\s]{5,}$/.test(trimmed) ||
        trimmed.endsWith(':') || /^(Section|Part|Chapter|Appendix|Schedule)/i.test(trimmed))
    if (isHeading) { result.push(line); sectionLines = 0; charCount += line.length }
    else if (sectionLines < 3 && trimmed.length > 0) { result.push(line); sectionLines++; charCount += line.length }
    if (charCount > maxChars) break
  }
  const out = result.join('\n')
  return out.length > 100
    ? out + '\n\n[Structure extracted from reference SOA.]'
    : truncateText(text, maxChars)
}

/* ============================================================================
   SYSTEM PROMPTS (ported verbatim from HTML prototype)
============================================================================ */

const _CALIBRATION = `CALIBRATION FROM REAL REVIEWED SOAs:

C-EX1 FAIL: Salary sacrifice stated $52,000pa — correct was $5,200pa (tenfold error). Always cross-check salary sacrifice, contribution amounts, and pension income figures. Any variance over 5% between SOA and supporting documents is a FAIL. Variance of 5% or less is within valuation tolerance — note the variance amount and percentage but rate as PASS. C1 FAIL.
C-EX2 WARNING: SOA stated eligibility conditions after they were already confirmed. Flag conditional language post-confirmation. WARNING.
C-EX3 P8 FAIL: Better position stated "your super will grow over time with minimal management" — no client-specific figures. Fail any better position without specific client numbers.
C-EX4 FAIL: Age Pension shown $29,868 in cashflow table — correct figure was $35,246 — a variance of 18%. This exceeds the 5% tolerance and is a FAIL.
C-EX5 WARNING: Scope included ongoing adviser service promotion. Flag inside advice body. WARNING.
C-EX6 WARNING: Systematic lowercase "you" at sentence starts. Flag systematic capitalisation errors. WARNING.
C-EX7 P7 WARNING: Rationale filler phrases without client outcome — "help to increase savings in the concessionally taxed environment." P7 WARNING.
C-EX8 WARNING: Systematic hyphens instead of en dash in table headers. WARNING.
C-EX9 FAIL: Risk profile change discussed but SOA still used old profile. FAIL.
C-EX10 WARNING: Cashflow table labelled "Current Savings" when it should be "Surplus Cash". WARNING.
C-EX11 WARNING: CGT capital loss decimal truncated. WARNING.
C-EX12 P9 FAIL: Recommendations not linked to named client goals. P9 FAIL.
C-EX13 WARNING: Pension payment as percentage only — dollar amount required. WARNING.
C-EX14 WARNING: Strategy missing projected end balance where modelling exists. WARNING.
C-EX15 WARNING: Existing Family Trust not addressed as discounted alternative. WARNING.
C-EX16 WARNING: TTR missing dollar amount, FY, or transition point. WARNING.
C-EX17 WARNING: Debt reduction better position missing interest saving or payoff date. WARNING.
C-EX18 FAIL: Pension refresh used instead of pension recommence — distinct strategies. FAIL.
C-EX19 FAIL: Future strategies embedded in current advice without disclaimer. FAIL.
C-EX20 FAIL: "We do not have sufficient information" — replace with "refer to tax accountant". FAIL.
C-EX21 WARNING: Ongoing fee table present but upfront fee table missing. WARNING.
C-EX22 WARNING: Strategy changes cashflow but no before/after cashflow table. WARNING.
C-EX23 FAIL: Balance in strategy $83,596 vs $93,481 in current situation. Always FAIL.
C-EX24 FAIL: 20% AA variance unexplained. FAIL above 15%, WARNING 10-15%.
C-EX25 WARNING: Inspecie from pension to investment — tax implications not compared. WARNING.
C-EX26 WARNING: Client over 75 — must disclose super restriction and pension irreversibility. WARNING.
C-EX27 WARNING: Narrative says "in line with risk profile" but allocation table shows otherwise. WARNING.
C-EX28 FAIL: Projection figures in exec summary not verified against modelling system output. FAIL.
C-EX29 WARNING: Charts/graphs with no explanatory commentary beneath them. WARNING.
C-EX30 WARNING: Salary sacrifice in scope but not addressed in strategy or out of scope. WARNING.
C-EX31 WARNING: Surplus cashflow in table but destination not addressed. WARNING.
C-EX32 WARNING: Inspecie transfer with no before/after fee comparison. WARNING.
C-EX33 FAIL: Projections show outcome outside scope of advice. FAIL.
C-EX34 WARNING: Tax-effective strategy with no estimated tax saving. WARNING.
C-EX35 WARNING: Rebalancing with no fee impact disclosed. WARNING.
C-EX36 WARNING: Cash account or term deposit with no interest rate stated. WARNING.
C-EX37 WARNING: Strategy with no implementation date or financial year. WARNING.
C-EX38 FAIL: Goal in exec summary not in scope and not noted out of scope. FAIL.
C-EX39 WARNING: PDC strategy for future FY present but current FY PDC missing. WARNING.
C-EX40 WARNING: Product replacement with no features comparison table. WARNING.
C-EX41 WARNING: Platform recommendation for couple/family — family linking not addressed. WARNING.
C-EX42 WARNING: Lower-income partner — spouse contribution not addressed. WARNING.
C-EX43 WARNING: Negative figures in tables missing minus sign or brackets. WARNING.

`

function buildSystemPrompt(mode: 'quick' | 'full', hasRef: boolean): string {
  if (mode === 'quick') {
    return (
      'You are a senior Australian financial planning compliance expert at AstuteIQ. ' +
      'Run a focused QUICK CHECK on this SOA covering consistency across documents and key compliance items only.\n\n' +
      'SCOPE: Check only the items listed below.\n\n' +
      'BALANCE VARIANCE RULE: Variance 5% or less = acceptable, do not flag. Above 5% = FAIL with exact figures.\n\n' +
      'AREA 1 - CONSISTENCY: Cross-check every monetary figure. Flag mismatch above 5% as FAIL with exact values and locations.\n\n' +
      'AREA 2 - KEY COMPLIANCE (FAIL or WARNING only):\n' +
      'C1. Numbers match throughout. C2. Balances consistent (5% tolerance). C3. Better position with specific figures. ' +
      'C6. Basis of advice. C9. Platform cost justified. C10. PDS dates accurate. C11. AA variances above 10% explained. ' +
      'C12. CGT addressed. C14. Fee changes with dollar amounts. C16. Fee breakdowns correct. ' +
      'C19. Required warnings present. C21. Like-for-like comparison. C25. Upfront and ongoing fees disclosed.\n\n' +
      'AREA 3 - PERSONALISATION (two checks only):\n' +
      'P7. Generic template language? FAIL and quote phrases. P8. Better position with client dollar figures? FAIL if boilerplate.\n\n' +
      'OUTPUT RULES: Only return fail and warning. Omit any PASS. Note: issue + figures + fix in 2-3 sentences.\n\n' +
      _CALIBRATION +
      'Return ONLY valid JSON:\n' +
      '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",' +
      '"summary":"CONSISTENCY: [...].\\nCOMPLIANCE: [...].\\nPERSONALISATION: [...].\\nPriority fixes: [top 3].",' +
      '"risk_level":"LOW|MEDIUM|HIGH","docs_reviewed":["..."],"mode":"quick",' +
      '"checks":[{"id":"...","area":"consistency|compliance|personalisation","label":"...","status":"fail|warning","note":"..."}]}'
    )
  }

  const refSection = hasRef
    ? 'REVIEW AREA 2 - STRUCTURE: Compare every section against the reference SOA. Check same sections in same order, all tables and checklists present.\n\n'
    : 'REVIEW AREA 2 - STRUCTURE: Check all critical sections present: exec summary, personal circumstances, goals, advice scope, strategy rationale, product recommendations, fee disclosures, alternatives, implementation, appendices.\n\n'

  return (
    'You are a senior Australian financial planning compliance expert at AstuteIQ. ' +
    'Produce a highly detailed, specific compliance report. Return structured JSON.\n\n' +
    'CRITICAL: You MUST produce a separate check for EVERY item C1-C29 (29 checks) and EVERY item P1-P10 (10 checks). ' +
    'Fewer than 39 checks = incomplete review. Include consistency checks for every mismatch found.\n\n' +
    'BALANCE VARIANCE RULE: Variance <=5% = PASS (note it). Variance >5% = FAIL with exact figures and percentage.\n\n' +
    'REVIEW AREA 1 - CONSISTENCY: Cross-check all figures across every document. State exact conflicting values, page/section location, and what to resolve.\n\n' +
    refSection +
    'REVIEW AREA 3 - PERSONALISATION (P1-P10, quote actual phrases):\n' +
    'P1. Age/life stage in rationale. P2. Family situation in rationale. P3. Occupation/income contextualised. ' +
    'P4. Goals with timeframes and dollar amounts. P5. Risk profile in every strategy section. ' +
    'P6. Existing position with specific figures. P7. Strategy rationale specificity — quote generic phrases. ' +
    'P8. Better position with client dollar figures — quote what exists and what is missing. ' +
    'P9. Recommendations linked to named goals. P10. Template language — quote all instances.\n\n' +
    'REVIEW AREA 4 - COMPLIANCE (C1-C29, PASS with page ref, FAIL with exact issue, N/A with reason):\n' +
    'C1.Numbers match C2.Balances consistent C3.Better position with figures C4.Goals mapped C5.No repeated points ' +
    'C6.Basis of advice C7.Reasons/advantages/disadvantages/alternatives C8.Numbers strategy=product ' +
    'C9.Platform cost justified C10.PDS dates accurate C11.AA variances addressed C12.CGT addressed ' +
    'C13.No other client names C14.Fee changes with dollar amounts C15.Cashflow assumptions disclosed ' +
    'C16.Fee breakdowns correct C17.FSG version present C18.TOC accurate C19.Required disclosures present ' +
    'C20.Alternatives documented C21.Like-for-like comparison C22.Replacement benefits quantified ' +
    'C23.Overall better position C24.Cashflow projections C25.Upfront and ongoing fees C26.Insurance affordability ' +
    'C27.Required warnings C28.Client preferred name consistent C29.No previous client content\n\n' +
    _CALIBRATION +
    'Return ONLY valid JSON:\n' +
    '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",' +
    '"summary":"CONSISTENCY: [...].\\nSTRUCTURE: [...].\\nPERSONALISATION: [...].\\nCOMPLIANCE: [...].",' +
    '"risk_level":"LOW|MEDIUM|HIGH","docs_reviewed":["..."],"mode":"full",' +
    '"checks":[{"id":"C1","area":"consistency|structure|personalisation|compliance","label":"...","status":"pass|fail|warning|na","note":"..."}]}\n\n' +
    'REMINDER: checks array MUST contain all C1-C29, all P1-P10, and all consistency checks.'
  )
}

function buildStage2SystemPrompt(): string {
  return (
    'You are a financial planning compliance reviewer at AstuteIQ. Stage 2 cross-check only. ' +
    'Check the SOA against supporting documents for figure discrepancies, product mismatches, inconsistent risk profiles. ' +
    'Return ONLY JSON: {"stage":2,"docs_reviewed":[],"additional_summary":"...","checks":[{"id":"...","area":"consistency","label":"...","status":"fail|warning","note":"..."}]}'
  )
}

/* ============================================================================
   CONTENT BUILDERS
============================================================================ */

function buildContentParts(
  soaDoc: UploadedDoc,
  refDoc: UploadedDoc | null,
  suppDocs: UploadedDoc[],
  suppCount: number
): object[] {
  const parts: object[] = [{ type: 'text', text: 'Please conduct Stage 1 of a comprehensive compliance review:' }]

  if (soaDoc.docType === 'pdf_b64') {
    parts.push({ type: 'text', text: '--- NEW SOA BEING REVIEWED ---' })
    parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: soaDoc.content } })
  } else {
    parts.push({ type: 'text', text: `--- NEW SOA BEING REVIEWED ---\n${truncateText(soaDoc.content, 120_000)}` })
  }

  if (refDoc) {
    if (refDoc.docType === 'pdf_b64') {
      parts.push({ type: 'text', text: '--- REFERENCE SOA ---' })
      parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: refDoc.content } })
    } else {
      parts.push({ type: 'text', text: `--- REFERENCE SOA ---\n${truncateRefSoa(refDoc.content, 40_000)}` })
    }
  }

  suppDocs.slice(0, suppCount).forEach((doc, i) => {
    const label = `--- SUPPORTING DOCUMENT ${i + 1}: ${doc.name} ---`
    if (doc.docType === 'pdf_b64') {
      parts.push({ type: 'text', text: label })
      parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.content } })
    } else {
      parts.push({ type: 'text', text: `${label}\n${truncateText(doc.content, 30_000)}` })
    }
  })

  return parts
}

function buildStage2Parts(soaDoc: UploadedDoc, remainingSupp: UploadedDoc[]): object[] {
  const parts: object[] = [{ type: 'text', text: 'Stage 2: Cross-check the SOA against these additional supporting documents:' }]

  if (soaDoc.docType === 'pdf_b64') {
    parts.push({ type: 'text', text: '--- SOA BEING REVIEWED ---' })
    parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: soaDoc.content } })
  } else {
    parts.push({ type: 'text', text: `--- SOA BEING REVIEWED ---\n${truncateText(soaDoc.content, 120_000)}` })
  }

  remainingSupp.forEach((doc, i) => {
    const label = `--- SUPPORTING DOCUMENT ${i + 4}: ${doc.name} ---`
    if (doc.docType === 'pdf_b64') {
      parts.push({ type: 'text', text: label })
      parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.content } })
    } else {
      parts.push({ type: 'text', text: `${label}\n${truncateText(doc.content, 30_000)}` })
    }
  })

  return parts
}

/* ============================================================================
   JSON REPAIR (ported from HTML prototype)
============================================================================ */

function repairAndParseJSON(text: string): ReviewResult | null {
  const jStart = text.indexOf('{')
  const jEnd   = text.lastIndexOf('}')
  if (jStart === -1) return null

  let jsonStr = text.substring(jStart, jEnd + 1)
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')

  try { return JSON.parse(jsonStr) as ReviewResult } catch { /* continue */ }

  try {
    let fixed          = jsonStr
    const lastComplete = fixed.lastIndexOf('},\n')
    const opens        = (fixed.match(/{/g) || []).length - (fixed.match(/}/g) || []).length
    if (lastComplete > 0 && opens > 0) fixed = fixed.substring(0, lastComplete + 1)
    const fo = (fixed.match(/{/g) || []).length - (fixed.match(/}/g) || []).length
    const fa = (fixed.match(/\[/g) || []).length - (fixed.match(/]/g) || []).length
    for (let i = 0; i < fa; i++) fixed += ']'
    for (let i = 0; i < fo; i++) fixed += '}'
    const parsed = JSON.parse(fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')) as ReviewResult
    if (parsed.checks?.length) return parsed
  } catch { /* continue */ }

  try {
    const sm = jsonStr.match(/"checks"\s*:\s*(\[)/)
    if (sm) {
      const arrStart = sm.index! + sm[0].length - 1
      let depth = 0, arrEnd = arrStart
      for (let i = arrStart; i < jsonStr.length; i++) {
        if (jsonStr[i] === '[') depth++
        else if (jsonStr[i] === ']') { depth--; if (depth === 0) { arrEnd = i; break } }
      }
      let arrStr = jsonStr.substring(arrStart, arrEnd + 1).replace(/,\s*]/g, ']').replace(/,\s*}/g, '}')
      const lb = arrStr.lastIndexOf('}')
      if (lb > 0) arrStr = arrStr.substring(0, lb + 1) + ']'
      const checks = JSON.parse(arrStr) as CheckResult[]
      if (!checks.length) return null
      const r: Partial<ReviewResult> = { checks }
      ;(['client_name','adviser_name','practice_name','advice_type','date','summary','risk_level'] as const).forEach((k) => {
        const m = jsonStr.match(new RegExp(`"${k}"\\s*:\\s*"([^"]+)"`))
        if (m) (r as any)[k] = m[1]
      })
      const dm = jsonStr.match(/"docs_reviewed"\s*:\s*(\[[^\]]*\])/)
      if (dm) try { r.docs_reviewed = JSON.parse(dm[1]) } catch { /* ignore */ }
      return r as ReviewResult
    }
  } catch { /* give up */ }

  return null
}

/* ============================================================================
   MERGE RESULTS
============================================================================ */

function mergeResults(r1: ReviewResult, r2: ReviewResult | null): ReviewResult {
  if (!r2) return r1

  const allChecks = [...(r1.checks || []), ...(r2.checks || [])]
  const byId: Record<string, CheckResult> = {}
  for (const c of allChecks) {
    const key = (c.id || '').toUpperCase().trim()
    if (!key) continue
    if (!byId[key] || (c.note || '').length > (byId[key].note || '').length) byId[key] = c
  }

  const areaOrder = ['consistency', 'structure', 'compliance', 'personalisation']
  const deduped: CheckResult[] = []
  const seen = new Set<string>()

  for (const area of areaOrder) {
    for (const c of Object.values(byId)) {
      if (normaliseArea(c.area) !== area) continue
      const key = (c.id || '').toUpperCase().trim()
      if (seen.has(key)) continue
      seen.add(key)
      c.area = area as CheckResult['area']
      deduped.push(c)
    }
  }
  for (const c of Object.values(byId)) {
    const key = (c.id || '').toUpperCase().trim()
    if (seen.has(key)) continue
    seen.add(key); deduped.push(c)
  }

  const merged: ReviewResult = {
    ...r1, checks: deduped,
    docs_reviewed: [
      ...(r1.docs_reviewed || []),
      ...(r2.docs_reviewed || []).filter((d) => !(r1.docs_reviewed || []).includes(d)),
    ],
  }
  if (r2.additional_summary && r2.additional_summary.trim().length > 20)
    merged.summary = `${(r1.summary || '').trim()} ${r2.additional_summary.trim()}`

  const riskOrder: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 }
  if ((riskOrder[(r2.risk_level || 'LOW').toUpperCase()] || 0) > (riskOrder[(r1.risk_level || 'LOW').toUpperCase()] || 0))
    merged.risk_level = r2.risk_level

  return merged
}

/* ============================================================================
   SCORE
============================================================================ */

function calculateScore(checks: CheckResult[]): number {
  if (!checks.length) return 0
  let total = 0
  for (const c of checks) {
    if      (c.status === 'pass')    total += 100
    else if (c.status === 'warning') total += 60
    else if (c.status === 'na')      total += 80
    else                             total += 20
  }
  return Math.round(total / checks.length)
}

/* ============================================================================
   FEEDBACK STORE (localStorage)
============================================================================ */

const FEEDBACK_LS_KEY = 'astuteiq_feedback'

function loadFeedbackStore(): Record<string, FeedbackEntry> {
  try { const s = localStorage.getItem(FEEDBACK_LS_KEY); return s ? JSON.parse(s) : {} } catch { return {} }
}
function saveFeedbackStore(store: Record<string, FeedbackEntry>) {
  try { localStorage.setItem(FEEDBACK_LS_KEY, JSON.stringify(store)) } catch { /* ignore */ }
}

/* ============================================================================
   FILE READER
============================================================================ */

function formatBytes(bytes: number): string {
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

async function readFile(file: File, labelPrefix: string): Promise<UploadedDoc> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const id  = `${file.name}_${file.lastModified}`

  if (ext === 'pdf') {
    const buffer = await file.arrayBuffer()
    const binary = Array.from(new Uint8Array(buffer)).map((b) => String.fromCharCode(b)).join('')
    return { id, name: file.name, size: file.size, type: 'pdf', content: btoa(binary), docType: 'pdf_b64', label: labelPrefix }
  }
  if (ext === 'docx' || ext === 'doc') {
    try {
      const mammoth = await import('mammoth')
      const buffer  = await file.arrayBuffer()
      const result  = await mammoth.extractRawText({ arrayBuffer: buffer })
      return { id, name: file.name, size: file.size, type: 'docx', content: result.value, docType: 'text', label: labelPrefix }
    } catch {
      const text = await file.text().catch(() => `[Could not read ${file.name}]`)
      return { id, name: file.name, size: file.size, type: 'docx', content: text, docType: 'text', label: labelPrefix }
    }
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const binary = Array.from(new Uint8Array(buffer)).map((b) => String.fromCharCode(b)).join('')
    return { id, name: file.name, size: file.size, type: 'xlsx', content: btoa(binary), docType: 'pdf_b64', label: labelPrefix }
  }
  const text = await file.text().catch(() => `[Could not read ${file.name}]`)
  return { id, name: file.name, size: file.size, type: 'other', content: text, docType: 'text', label: labelPrefix }
}

/* ============================================================================
   WORD EXPORT
============================================================================ */

async function exportToWord(

  result: ReviewResult,
  overrides: Record<string, Override>
) {
  console.log('EXPORT RESULT >>>', result)
  console.log('CLIENT NAME >>>', result.client_name)
  try {
    if (!result?.checks?.length) {
      alert('No review data available.')
      return
    }

    const {
      Document,
      Packer,
      Paragraph,
      Table,
      TableRow,
      TableCell,
      TextRun,
      HeadingLevel,
      WidthType,
      BorderStyle,
      AlignmentType,
    } = await import('docx')

    const statusLabel = (s: string) => s.toUpperCase()

    const safeClient = (result.client_name || 'Review')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')

    const effectiveChecks = result.checks.map((c) => ({
      ...c,
      status: overrides[c.id]?.newStatus ?? c.status,
    }))

    const pass = effectiveChecks.filter((c) => c.status === 'pass').length
    const fail = effectiveChecks.filter((c) => c.status === 'fail').length
    const warning = effectiveChecks.filter((c) => c.status === 'warning').length
    const na = effectiveChecks.filter((c) => c.status === 'na').length

    const overrideCount = Object.keys(overrides).length

    const noBorder = {
      style: BorderStyle.NONE,
      size: 0,
      color: 'FFFFFF',
    }

    const cellBorders = {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
    }

    const STATUS_COLOURS: Record<string, string> = {
      pass: '15803D',
      fail: 'B91C1C',
      warning: 'B45309',
      na: '6B7280',
    }

    function makeSummaryCell(
      label: string,
      value: number,
      fill: string
    ) {
      return new TableCell({
        shading: { fill },
        borders: cellBorders,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 180 },
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 26,
              }),
              new TextRun({
                text: `\n${value}`,
                bold: true,
                size: 36,
              }),
            ],
          }),
        ],
      })
    }

    function makeHeaderCell(text: string) {
      return new TableCell({
        shading: { fill: '1E293B' },
        borders: cellBorders,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                color: 'FFFFFF',
              }),
            ],
          }),
        ],
      })
    }

    function makeFindingRow(check: any) {
      const ov = overrides[check.id]
      const effectiveStatus = ov?.newStatus ?? check.status

      const noteLines: InstanceType<typeof TextRun>[] = [
        new TextRun({
          text: check.note || '—',
        }),
      ]

      if (ov) {
        noteLines.push(
          new TextRun({
            text: '\n\n[REVIEWER FLAGGED AS INCORRECT]',
            bold: true,
            color: 'CC8800',
          })
        )

        if (ov.newStatus !== ov.originalStatus) {
          noteLines.push(
            new TextRun({
              text: `\nOverridden: ${statusLabel(
                ov.originalStatus
              )} → ${statusLabel(ov.newStatus)}`,
              bold: true,
              color: 'CC8800',
            })
          )
        }

        if (ov.comment) {
          noteLines.push(
            new TextRun({
              text: `\nComment: ${ov.comment}`,
              italics: true,
              color: 'CC8800',
            })
          )
        }
      }

      return new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: check.id,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),

          new TableCell({
            borders: cellBorders,
            width: {
              size: 12,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: statusLabel(effectiveStatus),
                    bold: true,
                    color:
                      STATUS_COLOURS[effectiveStatus] ||
                      STATUS_COLOURS.warning,
                  }),
                ],
              }),
            ],
          }),

          new TableCell({
            borders: cellBorders,
            width: {
              size: 28,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: check.label || '—',
                  }),
                ],
              }),
            ],
          }),

          new TableCell({
            borders: cellBorders,
            width: {
              size: 50,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                children: noteLines,
              }),
            ],
          }),
        ],
      })
    }

    const groupedChecks = effectiveChecks.reduce((acc, check) => {
      const area = check.area || 'General'

      if (!acc[area]) {
        acc[area] = []
      }

      acc[area].push(check)

      return acc
    }, {} as Record<string, typeof effectiveChecks>)

    const findingsSections = Object.entries(groupedChecks).flatMap(
      ([area, checks]) => [
        new Paragraph({
          text: area,
          heading: HeadingLevel.HEADING_3,
          spacing: {
            before: 300,
            after: 150,
          },
        }),

        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },

          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                makeHeaderCell('ID'),
                makeHeaderCell('Status'),
                makeHeaderCell('Check'),
                makeHeaderCell('Notes'),
              ],
            }),

            ...checks.map(makeFindingRow),
          ],
        }),

        new Paragraph({ text: '' }),
      ]
    )

    const overriddenChecks = effectiveChecks.filter(
      (c) => overrides[c.id]
    )

    const assessmentSections = [
      [
        'CONSISTENCY',
        result.assessment?.consistency ||
          result.summary ||
          'No assessment provided.',
      ],
      [
        'STRUCTURE',
        result.assessment?.structure ||
          'Structure assessment not available.',
      ],
      [
        'PERSONALISATION',
        result.assessment?.personalisation ||
          'Personalisation assessment not available.',
      ],
      [
        'COMPLIANCE',
        result.assessment?.compliance ||
          'Compliance assessment not available.',
      ],
    ]

    const doc = new Document({
      sections: [
        {
          children: [
            // COVER
            new Paragraph({
              text: 'AstuteIQ',
              heading: HeadingLevel.TITLE,
              spacing: { after: 120 },
            }),

            new Paragraph({
              text: 'SOA Compliance Review Report',
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            ...[
              ['Client', result.client_name],
              ['Adviser', result.adviser_name],
              ['Practice', result.practice_name],
              ['Advice type', result.advice_type],
              ['Date', result.date],
              ['Risk level', result.risk_level],
              [
                'Documents reviewed',
                result.docs_reviewed?.join(', ') || 'SOA',
              ],
              [
                'Review mode',
                result.mode === 'quick'
                  ? 'Quick Check'
                  : 'Full Review',
              ],
            ].map(
              ([k, v]) =>
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: `${k}: `,
                      bold: true,
                    }),
                    new TextRun({
                      text: String(v || '—'),
                    }),
                  ],
                })
            ),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '' }),

            // REVIEW SUMMARY
            new Paragraph({
              text: 'Review Summary',
              heading: HeadingLevel.HEADING_2,
            }),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },

              rows: [
                new TableRow({
                  children: [
                    makeSummaryCell('PASS', pass, 'DFF6E4'),
                    makeSummaryCell('WARNING', warning, 'FFF4D6'),
                    makeSummaryCell('FAIL', fail, 'FFE2E2'),
                    makeSummaryCell('N/A', na, 'EAEAEA'),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '' }),

            ...(overrideCount > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Reviewer overrides applied: ${overrideCount}`,
                        italics: true,
                        color: 'CC8800',
                      }),
                    ],
                  }),
                ]
              : []),

            new Paragraph({ text: '' }),

            // OVERALL ASSESSMENT
            new Paragraph({
              text: 'Overall Assessment',
              heading: HeadingLevel.HEADING_2,
            }),

            ...assessmentSections.flatMap(([title, body]) => [
              new Paragraph({
                spacing: { before: 180, after: 80 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    underline: {},
                  }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: String(body || '—'),
                  }),
                ],
              }),
            ]),

            new Paragraph({ text: '' }),

            // REVIEWER FEEDBACK
            ...(overriddenChecks.length > 0
              ? [
                  new Paragraph({
                    text: 'Reviewer Feedback Summary',
                    heading: HeadingLevel.HEADING_2,
                  }),

                  ...overriddenChecks.map((c) => {
                    const ov = overrides[c.id]

                    return new Paragraph({
                      spacing: { after: 120 },
                      children: [
                        new TextRun({
                          text: `${c.id}: `,
                          bold: true,
                        }),

                        new TextRun({
                          text:
                            ov?.comment ||
                            'Reviewer flagged this finding.',
                          italics: true,
                          color: 'CC8800',
                        }),
                      ],
                    })
                  }),

                  new Paragraph({ text: '' }),
                ]
              : []),

            // FINDINGS
            new Paragraph({
              text: 'Detailed Findings',
              heading: HeadingLevel.HEADING_2,
            }),

            ...findingsSections,

            // DISCLAIMER
            new Paragraph({
              text: 'Disclaimer',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text:
                    'This report was generated by AstuteIQ AI. It is a compliance assistance tool only and does not constitute legal or financial advice. All findings must be reviewed by a qualified compliance professional before the SOA is submitted.',
                  italics: true,
                }),
              ],
            }),

            new Paragraph({ text: '' }),

            // FOOTER NOTE
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 300 },
              children: [
                new TextRun({
                  text: `Generated by AstuteIQ AI • ${new Date().toLocaleString()}`,
                  size: 18,
                  color: '888888',
                }),
              ],
            }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)

    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')

    anchor.href = url

    anchor.download = `AstuteIQ_${safeClient}_${
      result.date || 'report'
    }.docx`

    document.body.appendChild(anchor)

    anchor.click()

    document.body.removeChild(anchor)

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  } catch (err) {
    console.error('[AstuteIQ] Export error:', err)

    alert('Export failed — check console for details.')
  }
}

/* ============================================================================
   UPLOAD ZONE
============================================================================ */

interface ZoneProps {
  label: string; num: number; desc: string; formats: string
  file: UploadedDoc | null; multiple?: boolean; files?: UploadedDoc[]
  onDrop: (files: File[]) => void; onRemove: (id?: string) => void
}

function UploadZone({ label, num, desc, formats, file, multiple, files, onDrop, onRemove }: ZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: multiple ?? false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  })
  const hasFile = multiple ? (files?.length ?? 0) > 0 : !!file

  return (
    <div className={`relative flex flex-col gap-3 border-2 border-dashed rounded-2xl p-4 min-h-[220px] transition-all duration-300 ${
      hasFile ? 'border-[#6B2FD9] bg-[#6B2FD9]/10 shadow-lg shadow-[#6B2FD9]/10'
      : isDragActive ? 'border-[#A78BFA] bg-[#6B2FD9]/10'
      : 'border-slate-800 bg-[#0f0f1a] hover:border-[#6B2FD9]/40'
    }`}>
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-[#6B2FD9] flex items-center justify-center text-white text-xs font-bold shrink-0">{num}</span>
        <span className={`text-sm font-semibold ${hasFile ? 'text-[#A78BFA]' : 'text-slate-200'}`}>{label}</span>
      </div>
      <p className="text-xs text-slate-500">{desc}</p>
      <p className="text-xs text-slate-600 italic">{formats}</p>

      {!multiple && file && (
        <div className="flex items-center gap-2 bg-[#141421] border border-slate-800 rounded-lg px-3 py-2 mt-auto">
          <FileText size={13} className="text-[#A78BFA]" />
          <span className="text-xs text-slate-200 flex-1 truncate">{file.name}</span>
          <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
          <button onClick={() => onRemove()} className="text-slate-600 hover:text-[#FF6B6B]"><X size={13} /></button>
        </div>
      )}
      {multiple && files && files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 bg-[#141421] border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-200 flex-1 truncate">{f.name}</span>
              <button onClick={() => onRemove(f.id)} className="text-slate-600 hover:text-[#FF6B6B]"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <div {...getRootProps()} className="flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer rounded-lg p-3 hover:bg-[#6B2FD9]/5 transition-colors">
        <input {...getInputProps()} />
        <Upload size={20} className={isDragActive ? 'text-[#A78BFA]' : 'text-slate-600'} />
        <p className="text-xs text-slate-500 text-center">{isDragActive ? 'Drop files here' : 'Click or drag to upload'}</p>
      </div>
    </div>
  )
}

/* ============================================================================
   OVERRIDE PANEL
============================================================================ */

function OverridePanel({
  checkId, currentOverride, onSave, onClear, onClose, originalStatus,
}: {
  checkId: string; currentOverride: Override | undefined
  onSave: (id: string, ov: Override) => void; onClear: (id: string) => void
  onClose: () => void; originalStatus: CheckResult['status']
}) {
  const [newStatus, setNewStatus] = useState<CheckResult['status']>(currentOverride?.newStatus ?? originalStatus)
  const [comment,   setComment]   = useState(currentOverride?.comment ?? '')
  const statuses = [
    { value: 'pass'    as const, label: 'PASS',    color: '#2DD4A0' },
    { value: 'warning' as const, label: 'WARNING', color: '#FFB347' },
    { value: 'fail'    as const, label: 'FAIL',    color: '#FF6B6B' },
    { value: 'na'      as const, label: 'N/A',     color: '#6b7280' },
  ]
  return (
    <div className="mt-3 p-4 rounded-xl border border-[#FFB347]/30 bg-[#FFB347]/5 space-y-3">
      <p className="text-xs font-semibold text-[#FFB347] uppercase tracking-wide flex items-center gap-1.5">
        <Flag size={11} /> Override finding
      </p>
      <div className="flex gap-2 flex-wrap">
        {statuses.map(({ value, label, color }) => (
          <button key={value} onClick={() => setNewStatus(value)}
            className="px-3 py-1 rounded-lg text-xs font-semibold border transition-all"
            style={{ borderColor: newStatus === value ? color : `${color}30`, background: newStatus === value ? `${color}20` : 'transparent', color: newStatus === value ? color : '#6b7280' }}>
            {label}
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)..." rows={2}
        className="w-full px-3 py-2 rounded-lg bg-[#0B0B14] border border-slate-700 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#FFB347]/50 resize-none" />
      <div className="flex gap-2">
        <button onClick={() => { onSave(checkId, { originalStatus, newStatus, comment }); onClose() }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#FFB347' }}>
          Save override
        </button>
        {currentOverride && (
          <button onClick={() => { onClear(checkId); onClose() }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 text-slate-400 hover:text-white transition-colors">
            Clear
          </button>
        )}
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ============================================================================
   FINDING ROW
============================================================================ */

function FindingRow({
  check, override, onSaveOverride, onClearOverride,
}: {
  check: CheckResult; override: Override | undefined
  onSaveOverride: (id: string, ov: Override) => void
  onClearOverride: (id: string) => void
}) {
  const [showOverride, setShowOverride] = useState(false)
  const effectiveStatus = override?.newStatus ?? check.status
  const isFlagged       = !!override

  return (
    <div className={`py-3 border-b border-slate-800/60 last:border-0 ${isFlagged ? 'bg-[#FFB347]/5 rounded-xl px-3 -mx-3' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {effectiveStatus === 'pass'    && <CheckCircle   size={15} className="text-[#2DD4A0]" />}
          {effectiveStatus === 'fail'    && <XCircle       size={15} className="text-[#FF6B6B]" />}
          {effectiveStatus === 'warning' && <AlertTriangle size={14} className="text-[#FFB347]" />}
          {effectiveStatus === 'na'      && <Minus         size={15} className="text-slate-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-slate-500">{check.id}</span>
            <StatusBadge status={STATUS_MAP[effectiveStatus] ?? 'NA'} size="sm" />
            {isFlagged && override!.newStatus !== override!.originalStatus && (
              <span className="text-xs text-slate-500 line-through font-mono">{override!.originalStatus.toUpperCase()}</span>
            )}
            <span className="text-sm font-medium text-slate-200">{check.label}</span>
            {isFlagged && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFB347] border border-[#FFB347]/30 bg-[#FFB347]/10 px-2 py-0.5 rounded-full">
                <Flag size={9} /> Flagged
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{check.note}</p>
          {isFlagged && override!.comment && (
            <p className="text-xs text-[#FFB347]/80 italic mt-1">Comment: {override!.comment}</p>
          )}
          <button
            onClick={() => setShowOverride((v) => !v)}
            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
              isFlagged ? 'text-[#FFB347] hover:text-[#FFB347]/70' : 'text-slate-500 hover:text-[#FFB347]'
            }`}
          >
            <Flag size={11} />
            {isFlagged ? 'Edit override' : 'Mark as incorrect'}
            {showOverride ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>
      {showOverride && (
        <OverridePanel checkId={check.id} originalStatus={check.status}
          currentOverride={override} onSave={onSaveOverride}
          onClear={onClearOverride} onClose={() => setShowOverride(false)} />
      )}
    </div>
  )
}

/* ============================================================================
   SCORE TILES
============================================================================ */

const SCORE_TILES = [
  ['pass',    '#2DD4A0', 'PASS'],
  ['warning', '#FFB347', 'WARN'],
  ['fail',    '#FF6B6B', 'FAIL'],
  ['na',      '#6b7280', 'N/A'],
] as const

function ScoreTiles({ checks, overrides }: { checks: CheckResult[]; overrides: Record<string, Override> }) {
  const effective = checks.map((c) => overrides[c.id]?.newStatus ?? c.status)
  const count     = (s: string) => effective.filter((x) => x === s).length
  return (
    <div className="grid grid-cols-4 gap-2">
      {SCORE_TILES.map(([key, color, label]) => (
        <div key={key} className="rounded-xl p-3 text-center border" style={{ background: `${color}10`, borderColor: `${color}25` }}>
          <p className="text-xl font-bold font-mono" style={{ color }}>{count(key)}</p>
          <p className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ============================================================================
   DIRECT API CALL (fallback when no backend session)
============================================================================ */

async function callAnthropicDirect(
  systemPrompt: string,
  contentParts: object[],
  maxTokens: number,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
): Promise<ReviewResult> {
  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ?? ''
  if (!apiKey) throw new Error('No API key. Log in to use the backend, or set VITE_ANTHROPIC_API_KEY in .env for dev direct mode.')

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: contentParts }] }),
  })
  const data = await resp.json()
  if (data.error) throw new Error(data.error.message)
  const text = (data.content as { text?: string }[]).map((i) => i.text || '').join('')
  onChunk(text)
  const parsed = repairAndParseJSON(text)
  if (!parsed) throw new Error('Could not parse response. Try removing supporting documents or switching PDFs to Word format.')
  return parsed
}

/* ============================================================================
   MAIN PAGE
============================================================================ */

export default function SOAAnalysisPage() {
  console.log('NEW SOAAnalysisPage LOADED')
  const [soaDoc,     setSoaDoc]     = useState<UploadedDoc | null>(null)
  const [refDoc,     setRefDoc]     = useState<UploadedDoc | null>(null)
  const [suppDocs,   setSuppDocs]   = useState<UploadedDoc[]>([])
  const [loading,    setLoading]    = useState(false)
  const [mode,       setMode]       = useState<'quick' | 'full'>('full')
  const [step,       setStep]       = useState(0)
  const [elapsed,    setElapsed]    = useState(0)
  const [error,      setError]      = useState<string | null>(null)
  const [result,     setResult]     = useState<ReviewResult | null>(null)
  const [streamText, setStreamText] = useState('')
  const [overrides,  setOverrides]  = useState<Record<string, Override>>({})
  const [feedback,   setFeedback]   = useState<Record<string, FeedbackEntry>>(() => loadFeedbackStore())

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const addLiveReview    = useReviewStore((s) => s.addReview)
  const updateLiveReview = useReviewStore((s) => s.updateReview)

  useEffect(() => { saveFeedbackStore(feedback) }, [feedback])

  function saveOverride(checkId: string, override: Override) {
    setOverrides((prev) => ({ ...prev, [checkId]: override }))
    setFeedback((prev) => ({
      ...prev,
      [checkId]: { ...prev[checkId], flagged: true, overrideStatus: override.newStatus, comment: override.comment },
    }))
  }

  function clearOverride(checkId: string) {
    setOverrides((prev) => { const n = { ...prev }; delete n[checkId]; return n })
    setFeedback((prev)  => { const n = { ...prev }; delete n[checkId]; return n })
  }

  const handleSoaDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    setSoaDoc(await readFile(files[0], 'NEW SOA BEING REVIEWED'))
  }, [])

  const handleRefDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    setRefDoc(await readFile(files[0], 'REFERENCE SOA'))
  }, [])

  const handleSuppDrop = useCallback(async (files: File[]) => {
    const existing = suppDocs.length
    const docs = await Promise.all(
      files.slice(0, 10 - existing).map((file, i) => readFile(file, `SUPPORTING DOCUMENT ${existing + i + 1}`))
    )
    setSuppDocs((prev) => [...prev, ...docs])
  }, [suppDocs])

  async function runReview(reviewMode: 'quick' | 'full') {
    if (!soaDoc) { setError('Please upload an SOA.'); return }

    setLoading(true); setMode(reviewMode)
    setError(null); setResult(null); setOverrides({})
    setElapsed(0); setStep(1); setStreamText('')

    const liveId = crypto.randomUUID()
    addLiveReview({ id: liveId, fileName: soaDoc.name, status: 'processing', progress: 5, createdAt: new Date().toISOString(), mode: reviewMode, score: 0 })

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId  = setTimeout(() => controller.abort(), 300_000)

    try {
      if (!soaDoc.content || soaDoc.content.length < 50)
        throw new Error('SOA document appears empty or unreadable. Re-upload and try again.')

      const stage1SuppCount = getStage1SuppCount(soaDoc, refDoc, suppDocs)
      const remainingSupp   = suppDocs.slice(stage1SuppCount)
      const totalStages     = remainingSupp.length > 0 ? 2 : 1

      setStep(2)
      updateLiveReview(liveId, { progress: 20 })

      const { data: sessionData } = await supabase.auth.getSession()
      const token      = sessionData.session?.access_token ?? ''
      const useBackend = true
      console.log('ENV URL >>>', import.meta.env.VITE_API_BASE_URL)
      console.log('ENV URL 2 >>>', import.meta.env.VITE_API_URL)
      const BASE_URL =
      import.meta.env.VITE_API_BASE_URL ??
      import.meta.env.VITE_API_URL ??
      'http://127.0.0.1:8000'

      console.log('FINAL BASE_URL >>>', BASE_URL)

      setStreamText(`${reviewMode === 'quick' ? 'Quick Check' : 'Full Review'} — Stage 1${totalStages > 1 ? ' of 2' : ''}: Analysing documents…\n`)
      setStep(3)

      let result1!: ReviewResult

      if (useBackend) {
        const documents = [soaDoc, ...(refDoc ? [refDoc] : []), ...suppDocs.slice(0, stage1SuppCount)]
          .map((d) => ({ type: d.docType, label: d.label, content: d.content }))
        
        // DEV LOG

        console.log('FETCH URL >>>', `${BASE_URL}/api/soa/review/stream`)
        const response = await fetch(`${BASE_URL}/api/soa/review/stream`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` },
          body:   JSON.stringify({ mode: reviewMode, documents }),
          signal: controller.signal,
        })
        if (!response.ok) {
          let msg = `Server error ${response.status}`
          try { const e = await response.json(); msg = e.detail ?? msg } catch { /* ignore */ }
          throw new Error(msg)
        }
        if (!response.body) throw new Error('Streaming response unavailable.')
          // Read SSE stream
          const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        outer: while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const events = buf.split('\n\n')
          buf = events.pop() || ''
          for (const event of events) {
            const line = event.split('\n').find((l) => l.startsWith('data: '))
            if (!line) continue
            try {
              const payload = JSON.parse(line.replace(/^data:\s*/, ''))

              console.log('STREAM EVENT >>>', payload)
              console.log('STREAM RESULT >>>', payload.result)

              if (payload.chunk) setStreamText((prev) => prev + payload.chunk)
              if (payload.step)  { setStep(payload.step); updateLiveReview(liveId, { progress: Math.min(payload.step * 18, 90) }) }
              if (payload.error) throw new Error(`Backend: ${payload.error}`)
              if (payload.result) { result1 = payload.result as ReviewResult; break outer }
            } catch (pe: any) {
              if (pe?.message?.startsWith('Backend:')) throw pe
              console.warn('[AstuteIQ] SSE parse:', pe)
            }
          }
        }
      } else {
        const parts = buildContentParts(soaDoc, refDoc, suppDocs, stage1SuppCount)
        result1 = await callAnthropicDirect(
          buildSystemPrompt(reviewMode, !!refDoc), parts,
          reviewMode === 'quick' ? 4_000 : 10_000,
          controller.signal,
          (chunk) => setStreamText((prev) => prev + chunk)
        )
      }

      setStep(4)
      updateLiveReview(liveId, { progress: 70 })

      // Stage 2
      let result2: ReviewResult | null = null
      if (remainingSupp.length > 0) {
        setStreamText((prev) => prev + `\nStage 2 of 2: Cross-checking ${remainingSupp.length} remaining supporting document${remainingSupp.length > 1 ? 's' : ''}…\n`)
        setStep(5)
        if (useBackend) {
          const documents = [soaDoc, ...remainingSupp].map((d) => ({ type: d.docType, label: d.label, content: d.content }))
          const response = await fetch(`${BASE_URL}/api/soa/review/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:   JSON.stringify({ mode: 'quick', documents }),
            signal: controller.signal,
          })
          if (response.ok && response.body) {
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buf = ''
            outer2: while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buf += decoder.decode(value, { stream: true })
              const events = buf.split('\n\n')
              buf = events.pop() || ''
              for (const event of events) {
                const line = event.split('\n').find((l) => l.startsWith('data: '))
                if (!line) continue
                try {
                  const payload = JSON.parse(line.replace(/^data:\s*/, ''))
                  if (payload.result) { result2 = payload.result as ReviewResult; break outer2 }
                } catch { /* ignore */ }
              }
            }
          }
        } else {
          try {
            result2 = await callAnthropicDirect(
              buildStage2SystemPrompt(),
              buildStage2Parts(soaDoc, remainingSupp),
              4_000, controller.signal, () => {}
            )
          } catch { /* stage 2 non-fatal */ }
        }
      }

      setStep(6); setStreamText('')
      const merged     = mergeResults(result1, result2)
      const finalScore = calculateScore(merged.checks ?? [])
      setResult({ ...merged, score: finalScore })
      updateLiveReview(liveId, { status: 'complete', progress: 100, score: finalScore })

      if (import.meta.env.DEV) {
        console.log('[AstuteIQ] client_name:', merged.client_name, '| checks:', merged.checks?.length)
      }

    } catch (err: any) {
      const msg = err?.message ?? ''
      updateLiveReview(liveId, { status: 'failed', progress: 100 })
      setError(
        msg === 'The operation was aborted.' || msg.includes('aborted')
          ? 'Review timed out after 5 minutes. Try removing 1-2 supporting documents or switching large PDFs to Word.'
          : msg || 'Review failed.'
      )
    } finally {
      clearTimeout(timeoutId)
      if (timerRef.current) clearInterval(timerRef.current)
      setLoading(false); setStep(0)
    }
  }

  function reset() {
    setSoaDoc(null); setRefDoc(null); setSuppDocs([])
    setResult(null); setError(null)
    setOverrides({}); setStreamText(''); setElapsed(0)
  }

  const activeSteps   = STEPS[loading ? mode : 'full']
  const overrideCount = Object.keys(overrides).length

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="page-header bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          SOA Analysis
        </h1>
        <p className="page-sub">AI-powered compliance review — C1-C29 · P1-P10 · Consistency · Structure.</p>
      </div>

      {/* Upload zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UploadZone num={1} label="New SOA *" desc="The SOA being reviewed" formats="DOCX or PDF"
          file={soaDoc} onDrop={handleSoaDrop} onRemove={() => setSoaDoc(null)} />
        <UploadZone num={2} label="Reference SOA" desc="Optional — compare structure against this" formats="DOCX or PDF"
          file={refDoc} onDrop={handleRefDrop} onRemove={() => setRefDoc(null)} />
        <UploadZone num={3} label="Supporting Documents" desc="Fact find, fee comparison, CGT workings, etc. Up to 10 files."
          formats="PDF, DOCX, XLSX" multiple files={suppDocs} file={null}
          onDrop={handleSuppDrop} onRemove={(id) => setSuppDocs((prev) => prev.filter((d) => d.id !== id))} />
      </div>

      {/* Run panel */}
      {!result && (
        <div className="card space-y-4 border border-slate-800/80 bg-gradient-to-b from-[#11111d] to-[#0B0B14] shadow-2xl shadow-black/30">
          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-sm text-[#FF6B6B]">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {!loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => runReview('quick')} disabled={!soaDoc}
                className="relative flex flex-col gap-2 p-5 rounded-2xl border-2 border-[#6B2FD9]/40 bg-[#6B2FD9]/5 hover:bg-[#6B2FD9]/10 transition-all hover:scale-[1.02] disabled:opacity-30">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[#A78BFA]" />
                  <span className="text-sm font-semibold text-white">Quick Check</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-400 text-left">
                  <li>• FAILs + WARNINGs only — ~40s</li>
                  <li>• Key consistency + 13 compliance items</li>
                  <li>• P7 + P8 personalisation checks</li>
                </ul>
              </button>
              <button onClick={() => runReview('full')} disabled={!soaDoc}
                className="relative flex flex-col gap-2 p-5 rounded-2xl border-2 border-[#6B2FD9] bg-[#6B2FD9]/10 hover:bg-[#6B2FD9]/15 transition-all hover:scale-[1.02] disabled:opacity-30">
                <div className="flex items-center gap-2">
                  <Play size={16} className="text-[#A78BFA]" />
                  <span className="text-sm font-semibold text-white">Full Review</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-400 text-left">
                  <li>• All 39+ checks — C1-C29 · P1-P10 — ~90s</li>
                  <li>• Full consistency + structure analysis</li>
                  <li>• Two-stage review for large document bundles</li>
                </ul>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-[#6B2FD9] border-t-transparent rounded-full animate-spin" />
                <span>{activeSteps[(step - 1) || 0]}</span>
                <span className="ml-auto text-xs text-slate-600 font-mono">{elapsed}s</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#6B2FD9] to-[#A78BFA] transition-all duration-500"
                  style={{ width: `${Math.min(step * 18, 100)}%` }} />
              </div>
              <div className="space-y-2">
                {activeSteps.map((s, i) => {
                  const done = i + 1 < step; const active = i + 1 === step
                  return (
                    <div key={s} className={`flex items-center gap-2 text-xs transition-all ${done ? 'text-[#2DD4A0]' : active ? 'text-[#A78BFA]' : 'text-slate-600'}`}>
                      {done ? <CheckCircle size={13} /> : active ? <Clock size={13} className="animate-pulse" /> : <Minus size={13} />}
                      {s}
                    </div>
                  )
                })}
              </div>
              {streamText && (
                <pre className="bg-[#0B0B14] border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                  {streamText}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card space-y-5 animate-slide-up">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {result.client_name || 'Client'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {result.advice_type}
                {result.adviser_name  ? ` · ${result.adviser_name}`  : ''}
                {result.practice_name ? ` · ${result.practice_name}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {overrideCount > 0 && (
                <span className="text-xs text-[#FFB347] border border-[#FFB347]/30 bg-[#FFB347]/10 px-2 py-1 rounded-full font-medium">
                  {overrideCount} override{overrideCount > 1 ? 's' : ''} applied
                </span>
              )}
              <button onClick={() => exportToWord(result, overrides)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-500 transition-colors">
                <Download size={12} /> Export Word
              </button>
              <button onClick={reset} className="btn-secondary text-sm">
                <RotateCcw size={13} /> New Review
              </button>
            </div>
          </div>

          <ScoreTiles checks={result.checks} overrides={overrides} />

          <div className="border-l-2 border-[#6B2FD9]/60 pl-4 text-sm text-slate-400 whitespace-pre-line">
            {result.summary}
          </div>

          <div className="space-y-0">
            {result.checks.map((check) => (
              <FindingRow key={check.id} check={check} override={overrides[check.id]}
                onSaveOverride={saveOverride} onClearOverride={clearOverride} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}