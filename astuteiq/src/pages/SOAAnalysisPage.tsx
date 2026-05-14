import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  AlertTriangle, AlertCircle, Upload, X, Play, Zap,
  CheckCircle, XCircle, Minus, RotateCcw, FileText,
  Clock, Flag, Download, ChevronDown, ChevronUp, FileDown,
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

export interface FeedbackEntry {
  checkId:        string
  checkLabel:     string
  originalStatus: string
  flagged:        boolean
  overrideStatus?: 'pass' | 'fail' | 'warning' | 'na'
  comment?:       string
  updatedAt:      string
}

interface Override {
  originalStatus: CheckResult['status']
  newStatus:      CheckResult['status']
  comment:        string
}

interface ReviewResult {
  assessment?:         any
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
   BACKEND RESPONSE NORMALISER
   Maps any backend shape → ReviewResult flat shape.
   Shape A (flat):   { client_name, checks: [...] }
   Shape B (nested): { review_metadata, compliance_checks, critical_issues, ... }
============================================================================ */

/**
 * Flatten any backend summary shape into a plain string.
 * The backend sometimes returns an object like:
 *   { critical_findings: '...', overall_assessment: '...', ... }
 * React cannot render objects as children, so we convert here.
 */
function normaliseSummary(raw: unknown): string {
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object') {
    // Merge all string values in a sensible order
    const obj = raw as Record<string, unknown>
    const parts: string[] = []
    // Known preferred keys first
    const order = ['overall_assessment', 'critical_findings', 'critical_issues_summary',
                   'positive_observations', 'summary', 'description']
    order.forEach(k => { if (typeof obj[k] === 'string' && obj[k]) parts.push(obj[k] as string) })
    // Any remaining string values
    Object.entries(obj).forEach(([k, v]) => {
      if (!order.includes(k) && typeof v === 'string' && v) parts.push(v)
    })
    return parts.join('\n\n')
  }
  return String(raw)
}

function normaliseBackendResult(raw: any): ReviewResult {
  if (!raw || typeof raw !== 'object') {
    return { client_name: '', adviser_name: '', practice_name: '', advice_type: '',
             date: '', summary: '', risk_level: 'LOW', docs_reviewed: [], mode: 'full', checks: [] }
  }

  // Shape A
  if (Array.isArray(raw.checks)) {
    return {
      client_name:   raw.client_name   || '',
      adviser_name:  raw.adviser_name  || '',
      practice_name: raw.practice_name || '',
      advice_type:   raw.advice_type   || '',
      date:          raw.date          || '',
      summary:       normaliseSummary(raw.summary),
      risk_level:    (['LOW','MEDIUM','HIGH'].includes((raw.risk_level||'').toUpperCase())
                       ? raw.risk_level.toUpperCase() : 'LOW') as 'LOW'|'MEDIUM'|'HIGH',
      docs_reviewed: Array.isArray(raw.docs_reviewed) ? raw.docs_reviewed : [],
      mode:          raw.mode === 'quick' ? 'quick' : 'full',
      checks:        raw.checks ?? [],
      assessment:    raw.assessment,
      additional_summary: normaliseSummary(raw.additional_summary),
    }
  }

  // Shape B (nested)
  const meta    = raw.review_metadata           || {}
  const profile = raw.client_profile            || {}
  const rating  = raw.overall_compliance_rating || {}

  const client_name   = profile.client_name   || meta.client_names?.[0] || raw.client_name   || ''
  const adviser_name  = profile.adviser_name  || meta.adviser_name       || raw.adviser_name  || ''
  const practice_name = profile.practice_name || meta.practice_name      || raw.practice_name || ''
  const advice_type   = meta.advice_type      || raw.advice_type         || ''
  const date          = meta.soa_date         || meta.review_date        || raw.date          || ''
  const rawRisk       = (rating.risk_level || raw.risk_level || 'LOW').toUpperCase()
  const risk_level    = (['LOW','MEDIUM','HIGH'].includes(rawRisk) ? rawRisk : 'LOW') as 'LOW'|'MEDIUM'|'HIGH'
  const docs_reviewed = Array.isArray(raw.docs_reviewed) ? raw.docs_reviewed
                        : Array.isArray(meta.soa_scope)  ? meta.soa_scope : []

  const checks: CheckResult[] = []
  let checkCounter = 0

  function pushCheck(id: string, area: CheckResult['area'], label: string, status: string, note: string) {
    const s = (['pass','fail','warning','na'].includes((status||'').toLowerCase())
      ? status.toLowerCase() : 'na') as CheckResult['status']
    checks.push({ id: id || `CHK-${++checkCounter}`, area, label: label || id, status: s, note: note || '' })
  }

  // compliance_checks: array-of-sections or flat array or object
  const cc = raw.compliance_checks
  if (Array.isArray(cc)) {
    cc.forEach((section: any) => {
      if (Array.isArray(section.checks)) {
        section.checks.forEach((c: any, i: number) =>
          pushCheck(c.id || `${section.category}-${i}`, 'compliance',
                    c.item || c.label || '', c.status || c.result || '', c.detail || c.note || ''))
      } else if (section.id || section.label) {
        pushCheck(section.id || '', section.area || 'compliance',
                  section.label || '', section.status || '', section.note || '')
      }
    })
  } else if (cc && typeof cc === 'object') {
    Object.entries(cc).forEach(([key, val]: [string, any]) => {
      if (val && typeof val === 'object')
        pushCheck(key, 'compliance', val.label || val.description || key,
                  val.status || val.result || '', val.note || val.finding || '')
    })
  }

  // critical_issues → fail checks
  if (Array.isArray(raw.critical_issues)) {
    raw.critical_issues.forEach((issue: any, i: number) => {
      const id = issue.id || issue.check_id || `CI-${i + 1}`
      if (!checks.find(c => c.id === id))
        pushCheck(id, issue.area || 'consistency',
                  issue.label || issue.title || issue.description || id,
                  'fail', issue.note || issue.details || issue.finding || '')
    })
  }

  // personalisation_checks
  const pc = raw.personalisation_checks
  if (Array.isArray(pc))
    pc.forEach((c: any) => pushCheck(c.id || '', 'personalisation', c.label || '', c.status || '', c.note || ''))
  else if (pc && typeof pc === 'object')
    Object.entries(pc).forEach(([key, val]: [string, any]) => {
      if (val && typeof val === 'object')
        pushCheck(key, 'personalisation', val.label || key, val.status || '', val.note || val.finding || '')
    })

  // consistency_checks
  if (Array.isArray(raw.consistency_checks))
    raw.consistency_checks.forEach((c: any) =>
      pushCheck(c.id || '', 'consistency', c.label || '', c.status || '', c.note || ''))

  // structure_checks
  if (Array.isArray(raw.structure_checks))
    raw.structure_checks.forEach((c: any) =>
      pushCheck(c.id || '', 'structure', c.label || '', c.status || '', c.note || ''))

  // Fallback: flatten any top-level arrays of check-objects
  if (checks.length === 0) {
    Object.values(raw).forEach((val: any) => {
      if (Array.isArray(val))
        val.forEach((item: any) => {
          if (item && typeof item === 'object' && 'status' in item && ('label' in item || 'id' in item))
            pushCheck(item.id || '', item.area || 'compliance',
                      item.label || item.description || '', item.status || '', item.note || item.details || '')
        })
    })
  }

  const summary = normaliseSummary(raw.summary || rating.summary || raw.overall_assessment || rating.description)

  return {
    client_name, adviser_name, practice_name, advice_type, date,
    summary, risk_level, docs_reviewed,
    mode:       raw.mode === 'quick' ? 'quick' : 'full',
    checks,
    assessment: raw.assessment,
  }
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
    'Checking consistency across documents',
    'Running key compliance checks',
    'Running personalisation checks',
    'Generating report',
  ],
  full: [
    'Reading all documents',
    'Checking consistency across all figures',
    'Comparing structure to reference SOA',
    'Reviewing personalisation and compliance',
    'Generating report',
  ],
}

const AREA_ORDER = ['consistency', 'structure', 'compliance', 'personalisation', 'regulatory']

const AREA_LABELS: Record<string, string> = {
  consistency:     'CONSISTENCY ACROSS ALL DOCUMENTS',
  structure:       'STRUCTURE',
  compliance:      'COMPLIANCE CHECKLIST',
  personalisation: 'PERSONALISATION',
  regulatory:      'REGULATORY',
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

function getStage1SuppCount(soaDoc: UploadedDoc, refDoc: UploadedDoc | null, suppDocs: UploadedDoc[]): number {
  const BUDGET = 170_000, sysCost = 4_000
  const soaCost = estimateTokens(soaDoc.content, soaDoc.docType)
  const refCost = refDoc ? Math.min(estimateTokens(refDoc.content, refDoc.docType), 10_000) : 0
  let total = sysCost + soaCost + refCost, count = 0
  for (const doc of suppDocs) {
    const t = Math.min(estimateTokens(doc.content, doc.docType), 30_000)
    if (total + t > BUDGET) break
    total += t; count++
  }
  return count
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.substring(0, maxChars) + '\n\n[Document truncated to stay within token limits.]'
}

function truncateRefSoa(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const lines = text.split('\n')
  const result: string[] = []
  let charCount = 0, sectionLines = 0
  for (const line of lines) {
    const trimmed = line.trim()
    const isHeading = trimmed.length > 0 && trimmed.length < 80 &&
      (/^[0-9]+[.\s]/.test(trimmed) || /^[A-Z\s]{5,}$/.test(trimmed) ||
        trimmed.endsWith(':') || /^(Section|Part|Chapter|Appendix|Schedule)/i.test(trimmed))
    if (isHeading) { result.push(line); sectionLines = 0; charCount += line.length }
    else if (sectionLines < 3 && trimmed.length > 0) { result.push(line); sectionLines++; charCount += line.length }
    if (charCount > maxChars) break
  }
  const out = result.join('\n')
  return out.length > 100 ? out + '\n\n[Structure extracted from reference SOA.]' : truncateText(text, maxChars)
}

/* ============================================================================
   CALIBRATION + SYSTEM PROMPTS
============================================================================ */

const _CALIBRATION = `CALIBRATION FROM REAL REVIEWED SOAs:

C-EX1 FAIL: Salary sacrifice stated $52,000pa — correct was $5,200pa (tenfold error). Always cross-check salary sacrifice, contribution amounts, and pension income figures. Any variance over 5% between SOA and supporting documents is a FAIL. Variance of 5% or less is within valuation tolerance — note the variance amount and percentage but rate as PASS. C1 FAIL.
C-EX2 WARNING: SOA stated eligibility conditions after they were already confirmed. Flag conditional language post-confirmation. WARNING.
C-EX3 P8 FAIL: Better position stated "your super will grow over time with minimal management" — no client-specific figures. Fail any better position without specific client numbers.
C-EX4 FAIL: Age Pension shown $29,868 in cashflow table — correct figure was $35,246 — a variance of 18%. This exceeds the 5% tolerance and is a FAIL. Verify all cashflow table figures add up correctly.
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
      'SCOPE: Check only the items listed below. Do not run all 29 compliance items or all 10 personalisation checks.\n\n' +
      'BALANCE VARIANCE RULE: Variance 5% or less between SOA and supporting documents = acceptable, do not flag. Above 5% = FAIL with exact figures stated.\n\n' +
      'AREA 1 - CONSISTENCY (check all):\n' +
      'Cross-check every monetary figure across all documents: balances, contributions, premiums, fees, income, expenses. ' +
      'Flag any mismatch above 5% tolerance as FAIL with exact conflicting values and document locations.\n\n' +
      'AREA 2 - KEY COMPLIANCE (check only these, flag FAIL or WARNING only):\n' +
      'C1. All numbers match throughout. C2. Balances consistent (5% tolerance). C3. Better position with client-specific figures. ' +
      'C6. Basis of advice included. C9. Platform cost justified. C10. PDS dates accurate. C11. AA variances above 10% explained. ' +
      'C12. CGT addressed. C14. Fee changes disclosed with dollar amounts. C16. Fee breakdowns correct. ' +
      'C19. Required warnings present. C21. Like-for-like comparison. C25. Upfront and ongoing fees disclosed.\n\n' +
      'AREA 3 - PERSONALISATION (two checks only):\n' +
      'P7. Strategy rationale predominantly generic? FAIL if yes — quote specific phrases.\n' +
      'P8. Better position statements quantify with client dollar figures? FAIL if boilerplate.\n\n' +
      'OUTPUT RULES: Only return fail and warning checks. Omit PASS. 2-3 sentences per note: issue, figures, fix.\n\n' +
      _CALIBRATION +
      'Return ONLY valid JSON:\n' +
      '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",' +
      '"summary":"CONSISTENCY: [...].\\nCOMPLIANCE: [...].\\nPERSONALISATION: [...].\\nPriority fixes: [top 3].",' +
      '"risk_level":"LOW|MEDIUM|HIGH","docs_reviewed":["..."],"mode":"quick",' +
      '"checks":[{"id":"...","area":"consistency|compliance|personalisation","label":"short label","status":"fail|warning","note":"2-3 sentences."}]}'
    )
  }

  const refSection = hasRef
    ? 'REVIEW AREA 2 - STRUCTURE: Compare every section against the reference SOA. Check same sections in same order, all structural elements present.\n\n'
    : 'REVIEW AREA 2 - STRUCTURE: Check all critical sections present: executive summary, personal circumstances, goals and objectives, advice scope, strategy rationale, product recommendations, fee disclosures, alternatives, implementation, appendices.\n\n'

  return (
    'You are a senior Australian financial planning compliance expert at AstuteIQ. ' +
    'Produce a highly detailed, specific compliance report. Return structured JSON.\n\n' +
    'CRITICAL: Produce a separate check for EVERY item C1-C29 (29 checks) and EVERY item P1-P10 (10 checks). ' +
    'Fewer than 39 checks = incomplete review.\n\n' +
    'BALANCE VARIANCE RULE: Variance <=5% = PASS (note it). Variance >5% = FAIL with exact figures and percentage.\n\n' +
    'REVIEW AREA 1 - CONSISTENCY: Cross-check all monetary figures across every document. State exact conflicting values, location, and resolution needed.\n\n' +
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
    'Return ONLY JSON: {"stage":2,"docs_reviewed":[],"additional_summary":"2-3 sentences","checks":[{"id":"...","area":"consistency","label":"...","status":"fail|warning","note":"..."}]}'
  )
}

/* ============================================================================
   CONTENT BUILDERS
============================================================================ */

function buildContentParts(soaDoc: UploadedDoc, refDoc: UploadedDoc | null, suppDocs: UploadedDoc[], suppCount: number): object[] {
  const parts: object[] = [{ type: 'text', text: 'Please conduct Stage 1 of a comprehensive compliance review:' }]
  if (soaDoc.docType === 'pdf_b64') {
    parts.push({ type: 'text', text: '--- NEW SOA BEING REVIEWED ---' })
    parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: soaDoc.content } })
  } else {
    parts.push({ type: 'text', text: `--- NEW SOA BEING REVIEWED ---\n${truncateText(soaDoc.content, 120_000)}` })
  }
  if (refDoc) {
    if (refDoc.docType === 'pdf_b64') {
      parts.push({ type: 'text', text: '--- REFERENCE SOA (compare structure against this) ---' })
      parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: refDoc.content } })
    } else {
      parts.push({ type: 'text', text: `--- REFERENCE SOA (structure) ---\n${truncateRefSoa(refDoc.content, 40_000)}` })
    }
  }
  suppDocs.slice(0, suppCount).forEach((doc, i) => {
    const label = `--- SUPPORTING DOCUMENT ${i + 1}: ${doc.name} ---`
    if (doc.docType === 'pdf_b64') { parts.push({ type: 'text', text: label }); parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.content } }) }
    else parts.push({ type: 'text', text: `${label}\n${truncateText(doc.content, 30_000)}` })
  })
  return parts
}

function buildStage2Parts(soaDoc: UploadedDoc, remainingSupp: UploadedDoc[]): object[] {
  const parts: object[] = [{ type: 'text', text: 'Stage 2: Cross-check the SOA against these additional supporting documents:' }]
  if (soaDoc.docType === 'pdf_b64') { parts.push({ type: 'text', text: '--- SOA BEING REVIEWED ---' }); parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: soaDoc.content } }) }
  else parts.push({ type: 'text', text: `--- SOA BEING REVIEWED ---\n${truncateText(soaDoc.content, 120_000)}` })
  remainingSupp.forEach((doc, i) => {
    const label = `--- SUPPORTING DOCUMENT ${i + 4}: ${doc.name} ---`
    if (doc.docType === 'pdf_b64') { parts.push({ type: 'text', text: label }); parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.content } }) }
    else parts.push({ type: 'text', text: `${label}\n${truncateText(doc.content, 30_000)}` })
  })
  return parts
}

/* ============================================================================
   JSON REPAIR
============================================================================ */

function repairAndParseJSON(text: string): any | null {
  const jStart = text.indexOf('{'), jEnd = text.lastIndexOf('}')
  if (jStart === -1) return null
  let jsonStr = text.substring(jStart, jEnd + 1).replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
  try { return JSON.parse(jsonStr) } catch { /* continue */ }
  try {
    let fixed = jsonStr
    const lastComplete = fixed.lastIndexOf('},\n')
    let opens = (fixed.match(/{/g)||[]).length - (fixed.match(/}/g)||[]).length
    if (lastComplete > 0 && opens > 0) fixed = fixed.substring(0, lastComplete + 1)
    opens = (fixed.match(/{/g)||[]).length - (fixed.match(/}/g)||[]).length
    const fa = (fixed.match(/\[/g)||[]).length - (fixed.match(/]/g)||[]).length
    for (let i = 0; i < fa; i++) fixed += ']'
    for (let i = 0; i < opens; i++) fixed += '}'
    const parsed = JSON.parse(fixed.replace(/,\s*}/g,'}').replace(/,\s*]/g,']'))
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
      let arrStr = jsonStr.substring(arrStart, arrEnd + 1).replace(/,\s*]/g,']').replace(/,\s*}/g,'}')
      const lb = arrStr.lastIndexOf('}')
      if (lb > 0) arrStr = arrStr.substring(0, lb + 1) + ']'
      const checks = JSON.parse(arrStr)
      if (!checks.length) return null
      const r: any = { checks }
      ;['client_name','adviser_name','practice_name','advice_type','date','summary','risk_level'].forEach(k => {
        const m = jsonStr.match(new RegExp(`"${k}"\\s*:\\s*"([^"]+)"`))
        if (m) r[k] = m[1]
      })
      const dm = jsonStr.match(/"docs_reviewed"\s*:\s*(\[[^\]]*\])/)
      if (dm) try { r.docs_reviewed = JSON.parse(dm[1]) } catch { /* ignore */ }
      return r
    }
  } catch { /* give up */ }
  return null
}

/* ============================================================================
   MERGE RESULTS
============================================================================ */

function mergeResults(r1: ReviewResult, r2: ReviewResult | null): ReviewResult {
  r1 = { ...r1, checks: r1.checks ?? [] }
  if (!r2) return r1
  r2 = { ...r2, checks: r2.checks ?? [] }
  const allChecks = [...r1.checks, ...r2.checks]
  const byId: Record<string, CheckResult> = {}
  allChecks.forEach(c => {
    const key = (c.id || '').toUpperCase().trim()
    if (!key) return
    if (!byId[key] || (c.note||'').length > (byId[key].note||'').length) byId[key] = c
  })
  const noId = allChecks.filter(c => !(c.id||'').trim())
  const byLabel: Record<string, CheckResult> = {}
  noId.forEach(c => {
    const key = (c.label||'').toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,40)
    if (!key) return
    if (!byLabel[key] || (c.note||'').length > (byLabel[key].note||'').length) byLabel[key] = c
  })
  const deduped: CheckResult[] = [], seen = new Set<string>()
  AREA_ORDER.forEach(area => {
    Object.values(byId).filter(c => normaliseArea(c.area) === area).forEach(c => {
      const key = (c.id||'').toUpperCase().trim()
      if (seen.has(key)) return
      seen.add(key); c.area = area as CheckResult['area']; deduped.push(c)
    })
    Object.values(byLabel).filter(c => normaliseArea(c.area) === area).forEach(c => {
      const key = 'lbl_' + (c.label||'').toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,40)
      if (seen.has(key)) return
      seen.add(key); c.area = area as CheckResult['area']; deduped.push(c)
    })
  })
  Object.values(byId).forEach(c => {
    const key = (c.id||'').toUpperCase().trim()
    if (!seen.has(key)) { seen.add(key); c.area = normaliseArea(c.area) as CheckResult['area']; deduped.push(c) }
  })
  const merged: ReviewResult = {
    ...r1, checks: deduped,
    docs_reviewed: [...(r1.docs_reviewed||[]), ...(r2.docs_reviewed||[]).filter(d => !(r1.docs_reviewed||[]).includes(d))],
  }
  if (r2.additional_summary && r2.additional_summary.trim().length > 20)
    merged.summary = `${(r1.summary||'').trim()} ${r2.additional_summary.trim()}`
  const riskOrder: Record<string,number> = { LOW:1, MEDIUM:2, HIGH:3 }
  if ((riskOrder[(r2.risk_level||'LOW').toUpperCase()]||0) > (riskOrder[(r1.risk_level||'LOW').toUpperCase()]||0))
    merged.risk_level = r2.risk_level
  return merged
}

/* SCORE*/
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

/*FEEDBACK — SERVER-SIDE (Supabase) + localStorage fallback */

const FEEDBACK_LS_KEY = 'astuteiq_feedback'

function loadFeedbackFromLS(): Record<string, FeedbackEntry> {
  try { const s = localStorage.getItem(FEEDBACK_LS_KEY); return s ? JSON.parse(s) : {} } catch { return {} }
}
function saveToLS(store: Record<string, FeedbackEntry>) {
  try { localStorage.setItem(FEEDBACK_LS_KEY, JSON.stringify(store)) } catch { /* ignore */ }
}

async function loadFeedbackFromServer(reviewId: string): Promise<Record<string, FeedbackEntry>> {
  try {
    const { data, error } = await supabase
      .from('soa_review_feedback')
      .select('*')
      .eq('review_id', reviewId)
    if (error || !data) return {}
    const store: Record<string, FeedbackEntry> = {}
    data.forEach((row: any) => { store[row.check_id] = row.feedback as FeedbackEntry })
    return store
  } catch { return {} }
}

async function saveFeedbackToServer(reviewId: string, checkId: string, entry: FeedbackEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('soa_review_feedback').upsert({
      review_id: reviewId,
      check_id:  checkId,
      user_id:   user?.id,
      feedback:  entry,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'review_id,check_id' })
  } catch (e) { console.warn('[AstuteIQ] Feedback save failed:', e) }
}

async function deleteFeedbackFromServer(reviewId: string, checkId: string) {
  try {
    await supabase.from('soa_review_feedback').delete()
      .eq('review_id', reviewId).eq('check_id', checkId)
  } catch { /* ignore */ }
}

/* ============================================================================
   CSV EXPORT
============================================================================ */

function exportFeedbackCsv(feedback: Record<string, FeedbackEntry>, clientName: string) {
  const rows = [['Check ID', 'Check Label', 'Original Status', 'Override Status', 'Comment', 'Updated At']]
  Object.entries(feedback).forEach(([, entry]) => {
    if (!entry.flagged) return
    rows.push([
      entry.checkId,
      entry.checkLabel,
      entry.originalStatus,
      entry.overrideStatus || '',
      entry.comment || '',
      entry.updatedAt,
    ])
  })
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `AstuteIQ_Feedback_${(clientName||'Review').replace(/[^\w]/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ============================================================================
   SSE STREAM READER
============================================================================ */

async function readSseStream(
  response: Response,
  onChunk: (text: string) => void,
  onStep?: (step: number) => void,
): Promise<ReviewResult> {
  if (!response.body) throw new Error('Streaming response unavailable.')
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const events = buf.split('\n\n'); buf = events.pop() || ''
    for (const event of events) {
      const line = event.split('\n').find(l => l.startsWith('data: '))
      if (!line) continue
      let payload: any
      try { payload = JSON.parse(line.replace(/^data:\s*/, '')) } catch { continue }
      if (payload.chunk) onChunk(payload.chunk)
      if (payload.step && onStep) onStep(payload.step)
      if (payload.debug_raw) {
        console.warn('[AstuteIQ] RAW CLAUDE RESPONSE (first 2000 chars):', payload.debug_raw)
      }
      if (payload.done) {
        if (payload.error) throw new Error(`Backend: ${payload.error}`)
        if (payload.result) {
          console.debug('[AstuteIQ] raw result:', JSON.stringify(payload.result).slice(0, 500))
          const normalised = normaliseBackendResult(payload.result)
          console.debug('[AstuteIQ] checks count:', normalised.checks?.length ?? 0)
          if (!normalised.checks?.length) {
            throw new Error('Review completed but returned no checks. Please try again.')
          }
          return normalised
        }
        throw new Error('Backend sent done=true but no result.')
      }
      if (payload.result && !payload.done) {
        const nr = normaliseBackendResult(payload.result)
        if (nr.checks?.length) return nr
      }
      if (payload.error && !payload.done) throw new Error(`Backend: ${payload.error}`)
    }
  }
  throw new Error('SSE stream ended without a result. Try again or reduce document count.')
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
    const binary = Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join('')
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
    const binary = Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join('')
    return { id, name: file.name, size: file.size, type: 'xlsx', content: btoa(binary), docType: 'pdf_b64', label: labelPrefix }
  }
  const text = await file.text().catch(() => `[Could not read ${file.name}]`)
  return { id, name: file.name, size: file.size, type: 'other', content: text, docType: 'text', label: labelPrefix }
}

/* ============================================================================
   WORD EXPORT — matches document attached by user
============================================================================ */

async function exportToWord(result: ReviewResult, overrides: Record<string, Override>) {
  try {
    const checks = result?.checks ?? []
    if (!checks.length) { alert('No review data available.'); return }

    const {
      Document, Packer, Paragraph, Table, TableRow, TableCell,
      TextRun, HeadingLevel, WidthType, BorderStyle, AlignmentType, ShadingType,
    } = await import('docx')

    const safeClient = (result.client_name || 'Review').replace(/[^\w\s-]/g,'').replace(/\s+/g,'_')
    const effectiveChecks = checks.map(c => ({ ...c, status: overrides?.[c.id]?.newStatus ?? c.status }))
    const pass    = effectiveChecks.filter(c => c.status === 'pass').length
    const fail    = effectiveChecks.filter(c => c.status === 'fail').length
    const warning = effectiveChecks.filter(c => c.status === 'warning').length
    const na      = effectiveChecks.filter(c => c.status === 'na').length
    const overrideCount = Object.keys(overrides).length

    const noBorder    = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
    const rowBorder   = { style: BorderStyle.SINGLE, size: 4, color: 'E8E8F0' }
    const rowBorders  = { top: rowBorder, bottom: rowBorder, left: rowBorder, right: rowBorder }

    const STATUS_COLOURS: Record<string, string> = { pass:'1A7A45', fail:'B02020', warning:'9A5A00', na:'7070A0' }
    const STATUS_BG:      Record<string, string> = { pass:'EDFAF3', fail:'FFF0F0', warning:'FFF8EC', na:'F4F4F8' }

    function makeScoreCell(label: string, value: number, key: string) {
      return new TableCell({
        shading: { fill: STATUS_BG[key]||'F4F4F8', type: ShadingType.CLEAR },
        borders: cellBorders,
        margins: { top:120, bottom:120, left:140, right:140 },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(value), bold:true, size:48, color: STATUS_COLOURS[key]||'666688' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, bold:true, size:16, color: STATUS_COLOURS[key]||'666688' })] }),
        ],
      })
    }

    function makeHeaderCell(text: string, pct: number) {
      return new TableCell({
        shading: { fill:'0F0F1A', type: ShadingType.CLEAR },
        borders: cellBorders,
        width: { size: pct, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text, bold:true, color:'FFFFFF', size:18 })] })],
      })
    }

    function makeFindingRow(check: any) {
      const ov = overrides[check.id]
      const effectiveStatus = ov?.newStatus ?? check.status
      const noteRuns: InstanceType<typeof TextRun>[] = [new TextRun({ text: check.note || '—', size:18 })]
      if (ov) {
        noteRuns.push(new TextRun({ text: '\n\n[REVIEWER FLAGGED AS INCORRECT]', bold:true, color:'9A5A00', size:18 }))
        if (ov.newStatus !== ov.originalStatus)
          noteRuns.push(new TextRun({ text: `\nOverridden: ${ov.originalStatus.toUpperCase()} → ${ov.newStatus.toUpperCase()}`, bold:true, color:'9A5A00', size:18 }))
        if (ov.comment)
          noteRuns.push(new TextRun({ text: `\nReviewer Comment: ${ov.comment}`, italics:true, color:'9A5A00', size:18 }))
      }
      return new TableRow({ children: [
        new TableCell({ borders: rowBorders, width:{ size:25, type:WidthType.PERCENTAGE }, children:[
          new Paragraph({ children:[new TextRun({ text: check.label||'—', bold:true, size:18 })] })
        ]}),
        new TableCell({ borders: rowBorders, width:{ size:15, type:WidthType.PERCENTAGE }, children:[
          new Paragraph({ children:[new TextRun({ text: effectiveStatus.toUpperCase(), bold:true, size:18, color: STATUS_COLOURS[effectiveStatus]||'666688' })] })
        ]}),
        new TableCell({ borders: rowBorders, width:{ size:60, type:WidthType.PERCENTAGE }, children:[
          new Paragraph({ children: noteRuns })
        ]}),
      ]})
    }

    // Group checks by area
    const grouped: Record<string, typeof effectiveChecks> = {}
    effectiveChecks.forEach(c => {
      const area = normaliseArea(c.area) || 'general'
      if (!grouped[area]) grouped[area] = []
      grouped[area].push(c)
    })

    const findingsSections: any[] = []
    AREA_ORDER.forEach(area => {
      const areaChecks = grouped[area]
      if (!areaChecks?.length) return
      findingsSections.push(
        new Paragraph({ text: AREA_LABELS[area] || area.toUpperCase(), heading: HeadingLevel.HEADING_2, spacing:{ before:300, after:100 } }),
        new Table({
          width:{ size:100, type:WidthType.PERCENTAGE },
          rows:[
            new TableRow({ tableHeader:true, children:[makeHeaderCell('Finding',25), makeHeaderCell('Status',15), makeHeaderCell('Notes',60)] }),
            ...areaChecks.map(makeFindingRow),
          ],
        }),
        new Paragraph({ text:'' }),
      )
    })
    // Remaining areas not in AREA_ORDER
    Object.entries(grouped).forEach(([area, areaChecks]) => {
      if (AREA_ORDER.includes(area)) return
      findingsSections.push(
        new Paragraph({ text: area.toUpperCase(), heading: HeadingLevel.HEADING_2, spacing:{ before:300, after:100 } }),
        new Table({
          width:{ size:100, type:WidthType.PERCENTAGE },
          rows:[
            new TableRow({ tableHeader:true, children:[makeHeaderCell('Finding',25), makeHeaderCell('Status',15), makeHeaderCell('Notes',60)] }),
            ...areaChecks.map(makeFindingRow),
          ],
        }),
        new Paragraph({ text:'' }),
      )
    })

    // Parse summary into colour-coded sections
    const summaryText = result.summary || ''
    const summaryLabels = ['CONSISTENCY:','STRUCTURE:','PERSONALISATION:','COMPLIANCE:']
    const summaryColours: Record<string,string> = { 'CONSISTENCY:':'B02020','STRUCTURE:':'2A2A3C','PERSONALISATION:':'9A5A00','COMPLIANCE:':'6B2FD9' }
    const summaryParagraphs: any[] = []
    summaryLabels.forEach((label, idx) => {
      const start = summaryText.indexOf(label); if (start === -1) return
      const nextPositions = summaryLabels.slice(idx+1).map(l => summaryText.indexOf(l, start+1)).filter(p => p > -1)
      const end = nextPositions.length ? Math.min(...nextPositions) : summaryText.length
      const sText = summaryText.slice(start, end).trim()
      if (!sText) return
      summaryParagraphs.push(new Paragraph({
        spacing:{ before: idx===0?0:120, after:40 },
        border:{ left:{ style:BorderStyle.SINGLE, size:12, color: summaryColours[label]||'6B2FD9' } },
        indent:{ left:200 },
        children:[
          new TextRun({ text: label+' ', bold:true, size:20, color: summaryColours[label]||'6B2FD9' }),
          new TextRun({ text: sText.replace(label,'').trim(), size:20, color:'2A2A3C' }),
        ],
      }))
    })
    if (summaryParagraphs.length === 0 && summaryText)
      summaryParagraphs.push(new Paragraph({
        border:{ left:{ style:BorderStyle.SINGLE, size:12, color:'6B2FD9' } }, indent:{ left:200 },
        children:[new TextRun({ text: summaryText, size:20, color:'2A2A3C' })],
      }))

    const today = new Date().toLocaleDateString('en-AU', { day:'2-digit', month:'long', year:'numeric' })

    const doc = new Document({ sections:[{ children:[
      new Paragraph({ text:'AstuteIQ', heading:HeadingLevel.TITLE, spacing:{ after:120 } }),
      new Paragraph({ text:'SOA Compliance Review Report', heading:HeadingLevel.HEADING_1, spacing:{ after:300 } }),

      // Cover table
      new Table({
        width:{ size:100, type:WidthType.PERCENTAGE },
        rows: [
          ['Client', result.client_name],
          ['Adviser', result.adviser_name],
          ['Practice', result.practice_name],
          ['Advice Type', result.advice_type],
          ['Date', result.date],
          ['Risk Level', result.risk_level],
          ['Documents Reviewed', (result.docs_reviewed||[]).join(', ')||'SOA'],
          ['Review Mode', result.mode === 'quick' ? 'Quick Check' : 'Full Review'],
        ].map(([k,v]) => new TableRow({ children:[
          new TableCell({ borders: cellBorders, width:{ size:30, type:WidthType.PERCENTAGE }, children:[new Paragraph({ children:[new TextRun({ text:k, bold:true, size:18, color:'666688' })] })] }),
          new TableCell({ borders: cellBorders, width:{ size:70, type:WidthType.PERCENTAGE }, children:[new Paragraph({ children:[new TextRun({ text:String(v||'—'), size:18 })] })] }),
        ]})),
      }),

      new Paragraph({ text:'', spacing:{ after:200 } }),
      new Paragraph({ text:'Score Summary', heading:HeadingLevel.HEADING_1, spacing:{ before:280, after:80 } }),
      new Table({
        width:{ size:100, type:WidthType.PERCENTAGE },
        rows:[new TableRow({ children:[makeScoreCell('PASS',pass,'pass'), makeScoreCell('WARNING',warning,'warning'), makeScoreCell('FAIL',fail,'fail'), makeScoreCell('N/A',na,'na')] })],
      }),

      new Paragraph({ text:'Overall Assessment', heading:HeadingLevel.HEADING_1, spacing:{ before:280, after:80 } }),
      ...summaryParagraphs,
      new Paragraph({ text:'' }),

      ...(overrideCount > 0 ? [
        new Paragraph({ text:'Reviewer Feedback Summary', heading:HeadingLevel.HEADING_1, spacing:{ before:200, after:80 } }),
        new Paragraph({ children:[new TextRun({ text:`${overrideCount} reviewer override(s) applied. See flagged rows in Detailed Findings below.`, size:18, color:'9A5A00', italics:true })], spacing:{ after:200 } }),
      ] : []),

      new Paragraph({ text:'AI Disclaimer', heading:HeadingLevel.HEADING_1, spacing:{ before:200, after:80 } }),
      new Paragraph({ children:[new TextRun({ text:'AI-assisted review — all findings require human verification. FAIL and WARNING items must be reviewed in the original documents before the SOA is submitted.', italics:true, size:18, color:'B02020' })], spacing:{ after:200 } }),

      new Paragraph({ text:'Detailed Findings', heading:HeadingLevel.HEADING_1, spacing:{ before:200, after:80 } }),
      ...findingsSections,

      new Paragraph({ children:[new TextRun({ text:`Generated by AstuteIQ — ${today} — For internal use only`, size:16, color:'9090A8', italics:true })], spacing:{ before:400 } }),
    ]}]})

    const blob = await Packer.toBlob(doc)
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `AstuteIQ_Compliance_${safeClient}_${new Date().toISOString().slice(0,10)}.docx`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err: any) {
    console.error('[AstuteIQ] Export error:', err)
    alert('Export failed: ' + err.message)
  }
}

/* ============================================================================
   COLLAPSIBLE SUMMARY — compact expandable assessment block
============================================================================ */

function CollapsibleSummary({ summary, mode }: { summary: string; mode: 'quick' | 'full' }) {
  const [expanded, setExpanded] = useState(false)
  if (!summary) return null

  // For quick mode show just first 200 chars collapsed
  const isLong = summary.length > 200
  const displayText = expanded || !isLong ? summary : summary.slice(0, 200) + '…'

  return (
    <div className="bg-white/5 border-l-4 border-[#6B2FD9] rounded-r-xl overflow-hidden">
      <div className="px-4 py-3">
        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{displayText}</p>
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-[#A78BFA] hover:text-white tracking-wider uppercase border-t border-slate-800/60 transition-colors"
        >
          {expanded ? <><ChevronUp size={11} /> Collapse assessment</> : <><ChevronDown size={11} /> Read full assessment</>}
        </button>
      )}
    </div>
  )
}

/* ============================================================================
   RESULTS PANEL — unified display for both Quick Check and Full Review
============================================================================ */

interface ResultsPanelProps {
  result:          ReviewResult
  overrides:       Record<string, Override>
  feedback:        Record<string, FeedbackEntry>
  flaggedCount:    number
  overrideCount:   number
  groupedChecks:   Record<string, CheckResult[]>
  onSaveOverride:  (id: string, ov: Override) => void
  onClearOverride: (id: string) => void
  onExportWord:    () => void
  onExportCsv:     () => void
  onReset:         () => void
}

function ResultsPanel({
  result, overrides, feedback, flaggedCount, overrideCount,
  groupedChecks, onSaveOverride, onClearOverride,
  onExportWord, onExportCsv, onReset,
}: ResultsPanelProps) {
  const isQuick    = result.mode === 'quick'
  const checks     = result.checks ?? []
  const failCount  = checks.filter(c => (overrides[c.id]?.newStatus ?? c.status) === 'fail').length
  const warnCount  = checks.filter(c => (overrides[c.id]?.newStatus ?? c.status) === 'warning').length
  const totalIssues = failCount + warnCount

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Header bar */}
      <div className="bg-[#0F0F1A] rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div>
          <h2 className="text-base font-semibold text-white">{result.client_name || 'Client'}</h2>
          <p className="text-xs text-slate-500">
            {result.advice_type}
            {result.date         ? ` · ${result.date}`          : ''}
            {result.adviser_name ? ` · ${result.adviser_name}`  : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {result.risk_level && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              result.risk_level === 'HIGH'   ? 'bg-[#FFF0F0] text-[#B02020] border-[#FFBBBB]' :
              result.risk_level === 'MEDIUM' ? 'bg-[#FFF8EC] text-[#9A5A00] border-[#FFD98A]' :
                                               'bg-[#EDFAF3] text-[#1A7A45] border-[#B8EDCF]'
            }`}>{result.risk_level} RISK</span>
          )}
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {isQuick ? 'QUICK CHECK' : 'FULL REVIEW'}
          </span>
        </div>
      </div>

      {/* Docs reviewed */}
      {result.docs_reviewed?.length > 0 && (
        <p className="text-xs text-slate-500 px-1">
          Documents reviewed: {result.docs_reviewed.join(' · ')}
        </p>
      )}

      {/* Score tiles */}
      <ScoreTiles checks={checks} overrides={overrides} />

      {/* Quick Check issue callout — prominent headline before findings */}
      {isQuick && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          failCount > 0
            ? 'bg-[#FFF0F0] border-[#FFBBBB]'
            : warnCount > 0
              ? 'bg-[#FFF8EC] border-[#FFD98A]'
              : 'bg-[#EDFAF3] border-[#B8EDCF]'
        }`}>
          {failCount > 0
            ? <XCircle size={15} className="text-[#B02020] shrink-0" />
            : warnCount > 0
              ? <AlertTriangle size={15} className="text-[#9A5A00] shrink-0" />
              : <CheckCircle size={15} className="text-[#1A7A45] shrink-0" />
          }
          <p className={`text-sm font-semibold ${
            failCount > 0 ? 'text-[#B02020]' : warnCount > 0 ? 'text-[#9A5A00]' : 'text-[#1A7A45]'
          }`}>
            {totalIssues === 0
              ? 'No issues found in Quick Check.'
              : `${totalIssues} issue${totalIssues > 1 ? 's' : ''} found${failCount > 0 ? ` — ${failCount} FAIL${failCount > 1 ? 's' : ''}` : ''}${failCount > 0 && warnCount > 0 ? ', ' : ''}${warnCount > 0 ? `${warnCount} WARNING${warnCount > 1 ? 's' : ''}` : ''}.`
            }
          </p>
        </div>
      )}

      {/* Summary — collapsible for quick, full-width for full review */}
      {result.summary && (
        isQuick
          ? <CollapsibleSummary summary={result.summary} mode="quick" />
          : <div className="bg-white/5 border-l-4 border-[#6B2FD9] rounded-r-xl px-4 py-3 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              {result.summary}
            </div>
      )}

      {/* AI disclaimer banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FFF8EC] border border-[#FFD98A]">
        <AlertTriangle size={14} className="text-[#9A5A00] shrink-0 mt-0.5" />
        <p className="text-xs text-[#9A5A00] leading-relaxed">
          <strong>AI-assisted review — all findings require human verification.</strong>{' '}
          FAIL and WARNING items must be reviewed in the original documents before the SOA is submitted.
        </p>
      </div>

      {/* Reviewer feedback summary */}
      {flaggedCount > 0 && (
        <div className="px-4 py-3 rounded-xl bg-[#F0EAFF] border border-[#D8C8FF]">
          <p className="text-sm text-[#6B2FD9]">
            <strong>{flaggedCount} finding{flaggedCount > 1 ? 's' : ''} marked as incorrect</strong>
            {overrideCount > 0 ? ` — ${overrideCount} status override${overrideCount > 1 ? 's' : ''} applied` : ''}.
            {' '}These will be included in your Word report.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={onExportWord}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F0F1A] text-white text-xs font-semibold hover:opacity-85 transition-opacity border border-slate-700">
          <Download size={13} /> Export Word Report
        </button>
        {flaggedCount > 0 && (
          <button onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-medium hover:text-white hover:border-slate-500 transition-colors">
            <FileDown size={13} /> Export Feedback CSV
          </button>
        )}
        <button onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-xs font-medium hover:text-white transition-colors ml-auto">
          <RotateCcw size={13} /> New Review
        </button>
      </div>

      {/* Findings — grouped by area — same card UI for both Quick and Full */}
      {checks.length > 0 ? (
        <div className="card space-y-0 p-0 overflow-hidden">
          {AREA_ORDER.map(area => {
            const areaChecks = groupedChecks[area]
            if (!areaChecks?.length) return null
            return (
              <div key={area}>
                <div className="px-5 py-2 bg-slate-800/40 border-b border-slate-800">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                    {AREA_LABELS[area] || area.toUpperCase()}
                  </p>
                </div>
                <div className="px-5 divide-y divide-slate-800/50">
                  {areaChecks.map(check => (
                    <FindingRow
                      key={check.id || check.label}
                      check={check}
                      override={overrides[check.id]}
                      onSaveOverride={onSaveOverride}
                      onClearOverride={onClearOverride}
                    />
                  ))}
                </div>
              </div>
            )
          })}
          {/* Remaining areas not in AREA_ORDER */}
          {Object.entries(groupedChecks)
            .filter(([area]) => !AREA_ORDER.includes(area))
            .map(([area, areaChecks]) => (
              <div key={area}>
                <div className="px-5 py-2 bg-slate-800/40 border-b border-slate-800">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">{area.toUpperCase()}</p>
                </div>
                <div className="px-5 divide-y divide-slate-800/50">
                  {areaChecks.map(check => (
                    <FindingRow
                      key={check.id || check.label}
                      check={check}
                      override={overrides[check.id]}
                      onSaveOverride={onSaveOverride}
                      onClearOverride={onClearOverride}
                    />
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      ) : (
        /* No checks returned — show summary as primary content */
        result.summary && (
          <div className="bg-white/5 border-l-4 border-[#6B2FD9] rounded-r-xl px-4 py-3 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {result.summary}
          </div>
        )
      )}

    </div>
  )
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
      : 'border-slate-800 bg-[#0f0f1a] hover:border-[#6B2FD9]/40'}`}>
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
          {files.map(f => (
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
   INLINE OVERRIDE PANEL — matches screenshot UI exactly
   Shows below the finding note when "Mark as incorrect" is clicked.
   Dropdown: Override status… / PASS / WARNING / FAIL / N/A
   Input: Add comment…  Button: Save
============================================================================ */

interface OverridePanelProps {
  checkId:         string
  checkLabel:      string
  originalStatus:  CheckResult['status']
  currentOverride: Override | undefined
  onSave:   (id: string, ov: Override) => void
  onClear:  (id: string) => void
  onClose:  () => void
}

function OverridePanel({ checkId, checkLabel, originalStatus, currentOverride, onSave, onClear, onClose }: OverridePanelProps) {
  const [newStatus, setNewStatus] = useState<CheckResult['status'] | ''>(currentOverride?.newStatus ?? '')
  const [comment,   setComment]   = useState(currentOverride?.comment ?? '')

  function handleSave() {
    if (!newStatus) return
    onSave(checkId, { originalStatus, newStatus: newStatus as CheckResult['status'], comment })
    onClose()
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {/* "Marked incorrect" badge — shown once flagged */}
      <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#FFB347]/40 bg-[#FFB347]/10 text-[#FFB347]">
        Marked incorrect
      </span>

      {/* Status dropdown */}
      <select
        value={newStatus}
        onChange={e => setNewStatus(e.target.value as CheckResult['status'] | '')}
        className="px-2 py-1.5 rounded-lg text-xs bg-[#0B0B14] border border-slate-700 text-slate-200 focus:outline-none focus:border-[#6B2FD9] cursor-pointer"
      >
        <option value="">Override status…</option>
        <option value="pass">PASS</option>
        <option value="warning">WARNING</option>
        <option value="fail">FAIL</option>
        <option value="na">N/A</option>
      </select>

      {/* Comment input */}
      <input
        type="text"
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Add comment…"
        className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg text-xs bg-[#0B0B14] border border-slate-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#6B2FD9]"
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!newStatus}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#6B2FD9] hover:bg-[#5a27b8] disabled:opacity-40 transition-colors"
      >
        Save
      </button>

      {/* Clear button — only if already overridden */}
      {currentOverride && (
        <button onClick={() => { onClear(checkId); onClose() }}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Clear
        </button>
      )}
    </div>
  )
}

/* ============================================================================
   FINDING ROW — matches screenshot UI
   • FAIL/WARNING badge on left
   • Bold label + italic note
   • "Mark as incorrect" button
   • Inline override panel expands below note
   • Amber left border + background when flagged
============================================================================ */

interface FindingRowProps {
  check:           CheckResult
  override:        Override | undefined
  onSaveOverride:  (id: string, ov: Override) => void
  onClearOverride: (id: string) => void
}

function FindingRow({ check, override, onSaveOverride, onClearOverride }: FindingRowProps) {
  const [showOverride, setShowOverride] = useState(false)
  const effectiveStatus = override?.newStatus ?? check.status
  const isFlagged       = !!override

  // Status badge colours matching screenshot
  const badgeStyles: Record<string, string> = {
    pass:    'bg-[#EDFAF3] text-[#1A7A45] border-[#B8EDCF]',
    fail:    'bg-[#FFF0F0] text-[#B02020] border-[#FFBBBB]',
    warning: 'bg-[#FFF8EC] text-[#9A5A00] border-[#FFD98A]',
    na:      'bg-[#F4F4F8] text-[#7070A0] border-[#D0D0DC]',
  }

  return (
    <div className={`py-3 px-0 border-b border-slate-800/50 last:border-0 transition-colors ${
      isFlagged ? 'bg-[#FFFBF0] border-l-[3px] border-l-[#FFD98A] pl-3 rounded-r-lg -ml-3 pr-0' : ''
    }`}>
      <div className="flex items-start gap-3">
        {/* Status badge — left column, matches screenshot */}
        <span className={`shrink-0 mt-0.5 min-w-[68px] text-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${
          badgeStyles[effectiveStatus] || badgeStyles.na
        }`}>
          {effectiveStatus === 'na' ? 'N/A' : effectiveStatus.toUpperCase()}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 leading-snug mb-1">{check.label}</p>
          <p className="text-xs text-slate-400 leading-relaxed italic">{check.note}</p>

          {/* Override status badge — shown when overridden */}
          {isFlagged && override!.newStatus !== override!.originalStatus && (
            <p className="text-xs text-[#9A5A00] mt-1 font-medium">
              Overridden: {override!.originalStatus.toUpperCase()} → {override!.newStatus.toUpperCase()}
            </p>
          )}
          {isFlagged && override!.comment && (
            <p className="text-xs text-[#9A5A00] italic mt-0.5">Comment: {override!.comment}</p>
          )}

          {/* Override panel — expanded state */}
          {showOverride ? (
            <OverridePanel
              checkId={check.id}
              checkLabel={check.label}
              originalStatus={check.status}
              currentOverride={override}
              onSave={onSaveOverride}
              onClear={onClearOverride}
              onClose={() => setShowOverride(false)}
            />
          ) : (
            /* "Mark as incorrect" button — matches screenshot */
            <button
              onClick={() => setShowOverride(true)}
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border transition-colors ${
                isFlagged
                  ? 'border-[#FFD98A] text-[#9A5A00] bg-[#FFF8EC] hover:bg-[#FFD98A]/20'
                  : 'border-slate-700 text-slate-400 bg-transparent hover:border-[#FFB347] hover:text-[#9A5A00]'
              }`}
            >
              <Flag size={10} />
              {isFlagged ? 'Edit override' : 'Mark as incorrect'}
              {isFlagged ? <ChevronDown size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   SCORE TILES
============================================================================ */

const SCORE_TILES = [
  ['pass',    '#1A7A45', '#EDFAF3', '#B8EDCF', 'PASS'],
  ['warning', '#9A5A00', '#FFF8EC', '#FFD98A', 'WARNING'],
  ['fail',    '#B02020', '#FFF0F0', '#FFBBBB', 'FAIL'],
  ['na',      '#7070A0', '#F4F4F8', '#D0D0DC', 'N/A'],
] as const

function ScoreTiles({ checks, overrides }: { checks: CheckResult[]; overrides: Record<string, Override> }) {
  const effective = (checks ?? []).map(c => overrides[c.id]?.newStatus ?? c.status)
  const count = (s: string) => effective.filter(x => x === s).length
  return (
    <div className="grid grid-cols-4 gap-3">
      {SCORE_TILES.map(([key, color, bg, border, label]) => (
        <div key={key} className="rounded-xl p-4 text-center border" style={{ background: bg, borderColor: border }}>
          <p className="text-2xl font-bold font-mono" style={{ color }}>{count(key)}</p>
          <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ============================================================================
   DIRECT API CALL (fallback — no backend)
============================================================================ */

async function callAnthropicDirect(
  systemPrompt: string, contentParts: object[], maxTokens: number,
  signal: AbortSignal, onChunk: (chunk: string) => void,
): Promise<ReviewResult> {
  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ?? ''
  if (!apiKey) throw new Error('No API key configured.')
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', signal,
    headers: { 'Content-Type':'application/json', 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
    body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:maxTokens, system:systemPrompt, messages:[{ role:'user', content:contentParts }] }),
  })
  const data = await resp.json()
  if (data.error) throw new Error(data.error.message)
  const text = (data.content as { text?: string }[]).map(i => i.text || '').join('')
  onChunk(text)
  const raw = repairAndParseJSON(text)
  if (!raw) throw new Error('Could not parse response.')
  return normaliseBackendResult(raw)
}

/* ============================================================================
   MAIN PAGE
============================================================================ */

export default function SOAAnalysisPage() {
  const [soaDoc,     setSoaDoc]     = useState<UploadedDoc | null>(null)
  const [refDoc,     setRefDoc]     = useState<UploadedDoc | null>(null)
  const [suppDocs,   setSuppDocs]   = useState<UploadedDoc[]>([])
  const [loading,    setLoading]    = useState(false)
  const [mode,       setMode]       = useState<'quick' | 'full'>('full')
  const [step,       setStep]       = useState(0)
  const [elapsed,    setElapsed]    = useState(0)
  const [error,      setError]      = useState<string | null>(null)
  const [result,     setResult]     = useState<ReviewResult | null>(null)
  const [reviewId,   setReviewId]   = useState<string>('')
  const [streamText, setStreamText] = useState('')
  const [overrides,  setOverrides]  = useState<Record<string, Override>>({})
  const [feedback,   setFeedback]   = useState<Record<string, FeedbackEntry>>({})

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const addLiveReview    = useReviewStore(s => s.addReview)
  const updateLiveReview = useReviewStore(s => s.updateReview)

  // Mirror feedback to localStorage
  useEffect(() => { saveToLS(feedback) }, [feedback])

  // Save an override — both client state + server
  async function saveOverride(checkId: string, override: Override) {
    const check = result?.checks.find(c => c.id === checkId)
    const entry: FeedbackEntry = {
      checkId,
      checkLabel:     check?.label || checkId,
      originalStatus: override.originalStatus,
      flagged:        true,
      overrideStatus: override.newStatus,
      comment:        override.comment,
      updatedAt:      new Date().toISOString(),
    }
    setOverrides(prev => ({ ...prev, [checkId]: override }))
    setFeedback(prev => ({ ...prev, [checkId]: entry }))
    if (reviewId) await saveFeedbackToServer(reviewId, checkId, entry)
  }

  // Clear an override
  async function clearOverride(checkId: string) {
    setOverrides(prev => { const n = { ...prev }; delete n[checkId]; return n })
    setFeedback(prev  => { const n = { ...prev }; delete n[checkId]; return n })
    if (reviewId) await deleteFeedbackFromServer(reviewId, checkId)
  }

  const handleSoaDrop  = useCallback(async (files: File[]) => {
    if (!files[0]) return; setSoaDoc(await readFile(files[0], 'NEW SOA BEING REVIEWED'))
  }, [])
  const handleRefDrop  = useCallback(async (files: File[]) => {
    if (!files[0]) return; setRefDoc(await readFile(files[0], 'REFERENCE SOA'))
  }, [])
  const handleSuppDrop = useCallback(async (files: File[]) => {
    const existing = suppDocs.length
    const docs = await Promise.all(files.slice(0, 10 - existing).map((f, i) => readFile(f, `SUPPORTING DOCUMENT ${existing + i + 1}`)))
    setSuppDocs(prev => [...prev, ...docs])
  }, [suppDocs])

  async function runReview(reviewMode: 'quick' | 'full') {
    if (!soaDoc) { setError('Please upload an SOA.'); return }
    setLoading(true); setMode(reviewMode)
    setError(null); setResult(null); setOverrides({}); setFeedback({})
    setElapsed(0); setStep(1); setStreamText('')

    const newReviewId = crypto.randomUUID()
    setReviewId(newReviewId)
    const liveId = crypto.randomUUID()
    addLiveReview({ id: liveId, fileName: soaDoc.name, status:'processing', progress:5, createdAt: new Date().toISOString(), mode: reviewMode, score:0 })

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    const controller = new AbortController(); abortRef.current = controller
    const timeoutId  = setTimeout(() => controller.abort(), 300_000)

    try {
      if (!soaDoc.content || soaDoc.content.length < 50)
        throw new Error('SOA document appears empty or unreadable. Re-upload and try again.')

      const stage1SuppCount = getStage1SuppCount(soaDoc, refDoc, suppDocs)
      const remainingSupp   = suppDocs.slice(stage1SuppCount)
      const totalStages     = remainingSupp.length > 0 ? 2 : 1

      setStep(2); updateLiveReview(liveId, { progress:20 })

      const { data: sessionData } = await supabase.auth.getSession()
      const token      = sessionData.session?.access_token ?? ''
      const useBackend = true
      const BASE_URL   = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

      setStreamText(`${reviewMode === 'quick' ? 'Quick Check' : 'Full Review'} — Stage 1${totalStages > 1 ? ' of 2' : ''}: Analysing documents…\n`)
      setStep(3)

      let result1: ReviewResult

      if (useBackend) {
        const documents = [soaDoc, ...(refDoc ? [refDoc] : []), ...suppDocs.slice(0, stage1SuppCount)]
          .map(d => ({ type: d.docType, label: d.label, content: d.content }))
        const response = await fetch(`${BASE_URL}/api/soa/review/stream`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
          body: JSON.stringify({ mode: reviewMode, documents }),
          signal: controller.signal,
        })
        if (!response.ok) {
          let msg = `Server error ${response.status}`
          try { const e = await response.json(); msg = e.detail ?? msg } catch { /* ignore */ }
          throw new Error(msg)
        }
        result1 = await readSseStream(response,
          chunk => setStreamText(prev => prev + chunk),
          s => { setStep(s); updateLiveReview(liveId, { progress: Math.min(s * 18, 90) }) },
        )
      } else {
        const parts = buildContentParts(soaDoc, refDoc, suppDocs, stage1SuppCount)
        result1 = await callAnthropicDirect(buildSystemPrompt(reviewMode, !!refDoc), parts,
          reviewMode === 'quick' ? 4_000 : 10_000, controller.signal,
          chunk => setStreamText(prev => prev + chunk))
      }

      setStep(4); updateLiveReview(liveId, { progress:70 })

      let result2: ReviewResult | null = null
      if (remainingSupp.length > 0) {
        setStreamText(prev => prev + `\nStage 2 of 2: Cross-checking ${remainingSupp.length} remaining document${remainingSupp.length > 1 ? 's' : ''}…\n`)
        setStep(5)
        if (useBackend) {
          const documents = [soaDoc, ...remainingSupp].map(d => ({ type: d.docType, label: d.label, content: d.content }))
          const response = await fetch(`${BASE_URL}/api/soa/review/stream`, {
            method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
            body: JSON.stringify({ mode:'quick', documents }), signal: controller.signal,
          })
          if (response.ok) { try { result2 = await readSseStream(response, () => {}) } catch { /* stage 2 non-fatal */ } }
        } else {
          try { result2 = await callAnthropicDirect(buildStage2SystemPrompt(), buildStage2Parts(soaDoc, remainingSupp), 4_000, controller.signal, () => {}) }
          catch { /* stage 2 non-fatal */ }
        }
      }

      setStep(6); setStreamText('')
      const merged     = mergeResults(result1, result2)
      const finalScore = calculateScore(merged.checks ?? [])
      setResult({ ...merged, score: finalScore })
      updateLiveReview(liveId, { status:'complete', progress:100, score: finalScore })

    } catch (err: any) {
      const msg = err?.message ?? ''
      updateLiveReview(liveId, { status:'failed', progress:100 })
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

  // Load review from history (restores server-side feedback)
  async function loadReviewFromHistory(historicReviewId: string, historicResult: ReviewResult) {
    setResult(historicResult)
    setReviewId(historicReviewId)
    setOverrides({})
    setFeedback({})
    const serverFeedback = await loadFeedbackFromServer(historicReviewId)
    const lsFeedback     = loadFeedbackFromLS()
    const merged         = { ...lsFeedback, ...serverFeedback }
    setFeedback(merged)
    const rebuiltOverrides: Record<string, Override> = {}
    Object.entries(merged).forEach(([checkId, entry]) => {
      if (entry.flagged && entry.overrideStatus) {
        rebuiltOverrides[checkId] = {
          originalStatus: entry.originalStatus as CheckResult['status'],
          newStatus:      entry.overrideStatus,
          comment:        entry.comment || '',
        }
      }
    })
    setOverrides(rebuiltOverrides)
  }

  // Expose for parent/history components
  useEffect(() => {
    ;(window as any).__astuteiq_loadReview = loadReviewFromHistory
  }, [])

  function reset() {
    setSoaDoc(null); setRefDoc(null); setSuppDocs([])
    setResult(null); setError(null); setReviewId('')
    setOverrides({}); setFeedback({}); setStreamText(''); setElapsed(0)
  }

  const activeSteps   = STEPS[loading ? mode : 'full']
  const overrideCount = Object.keys(overrides).length
  const flaggedCount  = Object.values(feedback).filter(f => f.flagged).length

  // Group checks by area for display
  const groupedChecks: Record<string, CheckResult[]> = {}
  if (result?.checks) {
    result.checks.forEach(c => {
      const area = normaliseArea(c.area) || 'general'
      if (!groupedChecks[area]) groupedChecks[area] = []
      groupedChecks[area].push(c)
    })
  }

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
          onDrop={handleSuppDrop} onRemove={id => setSuppDocs(prev => prev.filter(d => d.id !== id))} />
      </div>

      {/* Run panel */}
      {!result && (
        <div className="card space-y-4 border border-slate-800/80 bg-gradient-to-b from-[#11111d] to-[#0B0B14] shadow-2xl shadow-black/30">
          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-sm text-[#FF6B6B]">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          {!loading ? (
            <div className="space-y-3">
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
              <p className="text-center text-xs text-slate-600">Quick: FAILs + WARNINGs &nbsp;|&nbsp; ~40s &nbsp;&nbsp; Full: All 39 checks with detailed notes &nbsp;|&nbsp; ~90s</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-[#6B2FD9] border-t-transparent rounded-full animate-spin" />
                <span>{mode === 'quick' ? 'Quick Check' : 'Full Review'} — Stage 1: Analysing documents… ({elapsed}s)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#6B2FD9] to-[#A78BFA] transition-all duration-500"
                  style={{ width: `${Math.min(step * 18, 100)}%` }} />
              </div>
              <div className="flex flex-col gap-1.5">
                {activeSteps.map((s, i) => {
                  const done = i + 1 < step, active = i + 1 === step
                  return (
                    <div key={s} className={`flex items-center gap-2 text-xs transition-all ${done ? 'text-[#2DD4A0]' : active ? 'text-[#A78BFA] font-medium' : 'text-slate-600'}`}>
                      {done ? <CheckCircle size={13} /> : active ? <span className="text-[#A78BFA]">○</span> : <span className="text-slate-600">○</span>}
                      {s}
                    </div>
                  )
                })}
              </div>
              {streamText && (
                <pre className="bg-[#0B0B14] border border-slate-800 rounded-xl p-3 text-xs text-slate-500 font-mono overflow-auto max-h-32 whitespace-pre-wrap">{streamText}</pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <ResultsPanel
          result={result}
          overrides={overrides}
          feedback={feedback}
          flaggedCount={flaggedCount}
          overrideCount={overrideCount}
          groupedChecks={groupedChecks}
          onSaveOverride={saveOverride}
          onClearOverride={clearOverride}
          onExportWord={() => exportToWord(result, overrides)}
          onExportCsv={() => exportFeedbackCsv(feedback, result.client_name)}
          onReset={reset}
        />
      )}
    </div>
  )
}