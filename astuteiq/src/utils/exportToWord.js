import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, BorderStyle, AlignmentType,
  ShadingType, VerticalAlign, PageNumber, Footer, Header,
  TabStopType, TabStopPosition, PageBreak,
} from 'docx'
import { saveAs } from 'file-saver'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  brand:      '6B2FD9',
  brandMid:   '8B4FE8',
  brandLight: 'EDE9FF',
  brandDark:  '3D1A8A',
  white:      'FFFFFF',
  offWhite:   'F8F7FF',
  bodyText:   '1F2937',
  mutedText:  '6B7280',
  rowAlt:     'F9F8FF',
  border:     'E5E7EB',
  // Status colours — text / background / border
  pass:       { text: '059669', bg: 'D1FAE5', border: 'A7F3D0' },
  warning:    { text: 'D97706', bg: 'FEF3C7', border: 'FDE68A' },
  fail:       { text: 'DC2626', bg: 'FEE2E2', border: 'FECACA' },
  na:         { text: '6B7280', bg: 'F3F4F6', border: 'E5E7EB' },
  amber:      { text: '92400E', bg: 'FFFBEB', border: 'FCD34D' },
}

// ─── Border helpers ───────────────────────────────────────────────────────────
const NO_BORDER  = { style: BorderStyle.NIL, size: 0, color: C.white }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }

function thinBorder(color = C.border) {
  const b = { style: BorderStyle.SINGLE, size: 4, color }
  return { top: b, bottom: b, left: b, right: b }
}
function thickLeftBorder(color) {
  return {
    top: NO_BORDER, bottom: NO_BORDER, right: NO_BORDER,
    left: { style: BorderStyle.SINGLE, size: 16, color },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safe(v) { return v === null || v === undefined ? '' : String(v) }

function normalizeStatus(s) {
  const u = String(s || '').toUpperCase().trim()
  if (u === 'ISSUE' || u === 'WARN') return u === 'WARN' ? 'WARNING' : 'FAIL'
  return u || 'NA'
}

function statusPalette(status) {
  const s = normalizeStatus(status)
  if (s === 'PASS')    return C.pass
  if (s === 'WARNING') return C.warning
  if (s === 'FAIL')    return C.fail
  return C.na
}

function statusLabel(status) {
  const s = normalizeStatus(status)
  if (s === 'PASS')    return '✓  PASS'
  if (s === 'WARNING') return '⚠  WARNING'
  if (s === 'FAIL')    return '✗  FAIL'
  return '—  N/A'
}

function countStatuses(checks, overrides = {}) {
  const c = { PASS: 0, WARNING: 0, FAIL: 0, NA: 0 }
  checks.forEach(chk => {
    const ov = overrides[chk.id]
    const s  = normalizeStatus(ov?.newStatus || chk.status)
    if (s in c) c[s]++
  })
  return c
}

function spacer(ptsBefore = 8, ptsAfter = 0) {
  return new Paragraph({ children: [], spacing: { before: ptsBefore * 20, after: ptsAfter * 20 } })
}

function sectionRule(color = C.brand) {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 1 } },
    spacing: { before: 200, after: 200 },
  })
}

const AREA_ORDER  = ['consistency', 'structure', 'compliance', 'personalisation', 'regulatory']
const AREA_LABELS = {
  consistency:     'Consistency Across All Documents',
  structure:       'Structure',
  compliance:      'Compliance Checklist (C1–C29)',
  personalisation: 'Personalisation (P1–P10)',
  regulatory:      'Regulatory',
}
function normaliseArea(a) { return (a || '').toLowerCase().trim() }

// ─── Cover banner (full-width purple block) ───────────────────────────────────
function coverBanner(clientName, reviewDate) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: C.brand, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 520, bottom: 520, left: 480, right: 480 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'AstuteIQ', bold: true, size: 28, color: 'D4C8F8', font: 'Arial' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({ text: 'SOA Compliance Review Report', bold: true, size: 52, color: C.white, font: 'Arial' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 140 },
                children: [
                  new TextRun({ text: `${clientName}  ·  ${reviewDate}`, size: 22, color: 'C4B5FD', font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

// ─── Branded header (every page) ─────────────────────────────────────────────
function makeHeader(clientName) {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.brand, space: 4 } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'AstuteIQ  |  SOA Compliance Review', bold: true, size: 18, color: C.brand, font: 'Arial' }),
          new TextRun({ text: '\t', font: 'Arial' }),
          new TextRun({ text: safe(clientName), size: 18, color: C.mutedText, font: 'Arial' }),
        ],
      }),
    ],
  })
}

// ─── Footer with page numbers ─────────────────────────────────────────────────
function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: 80 },
        children: [
          new TextRun({ text: 'Confidential — AI-assisted. Must be verified by a qualified adviser.', size: 16, color: C.mutedText, italics: true, font: 'Arial' }),
          new TextRun({ text: '\tPage ', size: 16, color: C.mutedText, font: 'Arial' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.mutedText, font: 'Arial' }),
          new TextRun({ text: ' of ', size: 16, color: C.mutedText, font: 'Arial' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.mutedText, font: 'Arial' }),
        ],
      }),
    ],
  })
}

// ─── Metadata table (alternating label/value rows) ────────────────────────────
function metaTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2520, 6840],
    rows: rows.map(([label, value], i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2520, type: WidthType.DXA },
            borders: thinBorder(C.border),
            shading: { fill: C.brandLight, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [new Paragraph({
              children: [new TextRun({ text: safe(label), bold: true, size: 19, color: C.brandDark || '3D1A8A', font: 'Arial' })],
            })],
          }),
          new TableCell({
            width: { size: 6840, type: WidthType.DXA },
            borders: thinBorder(C.border),
            shading: { fill: i % 2 === 0 ? C.white : C.offWhite, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [new Paragraph({
              children: [new TextRun({ text: safe(value) || '—', size: 19, color: C.bodyText, font: 'Arial' })],
            })],
          }),
        ],
      })
    ),
  })
}

// ─── Score pill tiles ─────────────────────────────────────────────────────────
function scoreTable(pass, warning, fail, na) {
  const total    = pass + warning + fail + na
  const passRate = total ? Math.round((pass / total) * 100) : 0
  const rateColor = passRate >= 80 ? C.pass.text : passRate >= 60 ? C.warning.text : C.fail.text

  function pill(label, count, pal) {
    return new TableCell({
      width: { size: 2340, type: WidthType.DXA },
      borders: NO_BORDERS,
      shading: { fill: pal.bg, type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(count), bold: true, size: 56, color: pal.text, font: 'Arial' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: label, bold: true, size: 17, color: pal.text, font: 'Arial' })] }),
      ],
    })
  }

  return [
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 2340, 2340],
      rows: [
        new TableRow({ children: [pill('PASS', pass, C.pass), pill('WARNING', warning, C.warning), pill('FAIL', fail, C.fail), pill('N/A', na, C.na)] }),
      ],
    }),
    spacer(8),
    new Paragraph({
      spacing: { before: 60, after: 80 },
      children: [
        new TextRun({ text: 'Overall Pass Rate: ', size: 21, color: C.bodyText, font: 'Arial' }),
        new TextRun({ text: `${passRate}%`, bold: true, size: 28, color: rateColor, font: 'Arial' }),
        new TextRun({ text: `  (${pass} of ${total} checks passed)`, size: 19, color: C.mutedText, font: 'Arial' }),
      ],
    }),
  ]
}

// ─── AI Disclaimer callout ────────────────────────────────────────────────────
function disclaimerBox() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: C.amber.bg, type: ShadingType.CLEAR },
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 8, color: C.amber.border },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: C.amber.border },
              left:   { style: BorderStyle.SINGLE, size: 24, color: C.warning.text },
              right:  { style: BorderStyle.SINGLE, size: 8, color: C.amber.border },
            },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'AI Disclaimer', bold: true, size: 22, color: C.warning.text, font: 'Arial' })] }),
              new Paragraph({
                spacing: { before: 80 },
                children: [new TextRun({
                  text: 'This report was generated using AI-assisted analysis and must be reviewed and verified by a qualified human financial adviser before reliance or presentation to clients. FAIL and WARNING items must be reviewed in the original documents before the SOA is submitted. AstuteIQ does not accept liability for decisions made solely on the basis of this report.',
                  size: 19, italics: true, color: C.amber.text, font: 'Arial',
                })],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

// ─── Overrides summary table ──────────────────────────────────────────────────
function overridesTable(overrides) {
  const entries = Object.entries(overrides)
  if (!entries.length) {
    return new Paragraph({ children: [new TextRun({ text: 'No reviewer overrides applied.', size: 19, italics: true, color: C.mutedText, font: 'Arial' })] })
  }
  const colW = [1400, 1600, 1600, 4760]
  const hdrCell = (text, w) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: C.brand, type: ShadingType.CLEAR },
    borders: NO_BORDERS,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: C.white, font: 'Arial' })] })],
  })
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colW,
    rows: [
      new TableRow({ children: [hdrCell('Check ID', colW[0]), hdrCell('Original', colW[1]), hdrCell('Override', colW[2]), hdrCell('Reviewer Comment', colW[3])] }),
      ...entries.map(([id, ov], i) => {
        const bg = i % 2 === 0 ? C.white : C.rowAlt
        const cell = (text, w, color = C.bodyText, bold = false) => new TableCell({
          width: { size: w, type: WidthType.DXA },
          borders: thinBorder(),
          shading: { fill: bg, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: safe(text), bold, size: 18, color, font: 'Arial' })] })],
        })
        return new TableRow({ children: [
          cell(id, colW[0], C.brand, true),
          cell(normalizeStatus(ov.originalStatus), colW[1], C.mutedText),
          cell(normalizeStatus(ov.newStatus), colW[2], statusPalette(ov.newStatus).text, true),
          cell(ov.comment || '—', colW[3]),
        ]})
      }),
    ],
  })
}

// ─── Findings table (with override column) ────────────────────────────────────
// Columns: Finding + ID | Status | Notes | Override (if any overrides exist)
function findingsTable(checks, overrides) {
  const hasOverrides = Object.keys(overrides).length > 0
  // Column widths must sum to 9360
  const colW = hasOverrides
    ? [2600, 1100, 3660, 2000]   // Finding | Status | Notes | Override
    : [2800, 1200, 5360]          // Finding | Status | Notes

  // Header row
  const hdrCell = (text, w) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: C.brand, type: ShadingType.CLEAR },
    borders: NO_BORDERS,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 19, color: C.white, font: 'Arial' })] })],
  })

  const headers = hasOverrides
    ? [hdrCell('Finding', colW[0]), hdrCell('Status', colW[1]), hdrCell('Notes', colW[2]), hdrCell('Reviewer Override', colW[3])]
    : [hdrCell('Finding', colW[0]), hdrCell('Status', colW[1]), hdrCell('Notes', colW[2])]

  // Data rows
  const dataRows = checks.map((chk, idx) => {
    const ov             = overrides[chk.id]
    const effectiveStatus = ov?.newStatus ?? chk.status
    const pal            = statusPalette(effectiveStatus)
    const rowBg          = idx % 2 === 0 ? C.white : C.rowAlt

    // Finding cell: label (bold) + id (muted, smaller)
    const findingCell = new TableCell({
      width: { size: colW[0], type: WidthType.DXA },
      borders: thinBorder(),
      shading: { fill: rowBg, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [
        new Paragraph({ children: [new TextRun({ text: safe(chk.label || chk.item), bold: true, size: 18, color: C.bodyText, font: 'Arial' })] }),
        new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: safe(chk.id), size: 15, color: C.mutedText, font: 'Arial' })] }),
      ],
    })

    // Status badge cell: coloured background per status
    const statusCell = new TableCell({
      width: { size: colW[1], type: WidthType.DXA },
      borders: thinBorder(),
      shading: { fill: pal.bg, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: statusLabel(effectiveStatus), bold: true, size: 16, color: pal.text, font: 'Arial' })],
      })],
    })

    // Notes cell: note text, then reviewer comment if flagged
    const noteChildren = [
      new Paragraph({ children: [new TextRun({ text: safe(chk.note || chk.detail) || '—', size: 18, color: C.bodyText, font: 'Arial' })] }),
    ]
    if (ov?.comment) {
      noteChildren.push(new Paragraph({
        spacing: { before: 80 },
        children: [new TextRun({ text: `Reviewer: ${ov.comment}`, size: 17, italics: true, color: C.warning.text, font: 'Arial' })],
      }))
    }
    const notesCell = new TableCell({
      width: { size: colW[2], type: WidthType.DXA },
      borders: thinBorder(),
      shading: { fill: rowBg, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: noteChildren,
    })

    const cells = [findingCell, statusCell, notesCell]

    // Override column — only added when there are any overrides
    if (hasOverrides) {
      const overrideCellChildren = ov
        ? [
            new Paragraph({ children: [
              new TextRun({ text: `${normalizeStatus(ov.originalStatus)} `, size: 17, color: C.mutedText, font: 'Arial' }),
              new TextRun({ text: '→ ', size: 17, color: C.mutedText, font: 'Arial' }),
              new TextRun({ text: normalizeStatus(ov.newStatus), bold: true, size: 17, color: statusPalette(ov.newStatus).text, font: 'Arial' }),
            ]}),
          ]
        : [new Paragraph({ children: [new TextRun({ text: '—', size: 17, color: C.mutedText, font: 'Arial' })] })]

      cells.push(new TableCell({
        width: { size: colW[3], type: WidthType.DXA },
        borders: thinBorder(),
        shading: { fill: ov ? C.warning.bg : rowBg, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        verticalAlign: VerticalAlign.CENTER,
        children: overrideCellChildren,
      }))
    }

    return new TableRow({ children: cells })
  })

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colW,
    rows: [new TableRow({ children: headers }), ...dataRows],
  })
}

// ─── Summary block with coloured left-rule per section ────────────────────────
function summaryBlock(summaryText) {
  if (!summaryText) return []
  const labels  = ['CONSISTENCY:', 'STRUCTURE:', 'PERSONALISATION:', 'COMPLIANCE:']
  const colors  = { 'CONSISTENCY:': C.fail.text, 'STRUCTURE:': C.brand, 'PERSONALISATION:': C.warning.text, 'COMPLIANCE:': C.brandMid }
  const results = []

  labels.forEach((label, idx) => {
    const start = summaryText.indexOf(label)
    if (start === -1) return
    const nextPositions = labels.slice(idx + 1).map(l => summaryText.indexOf(l, start + 1)).filter(p => p > -1)
    const end  = nextPositions.length ? Math.min(...nextPositions) : summaryText.length
    const text = summaryText.slice(start + label.length, end).trim()
    if (!text) return
    const col = colors[label] || C.brand
    results.push(new Paragraph({
      spacing: { before: idx === 0 ? 0 : 120, after: 60 },
      border: { left: { style: BorderStyle.SINGLE, size: 16, color: col, space: 1 } },
      indent: { left: 200 },
      children: [
        new TextRun({ text: label + ' ', bold: true, size: 20, color: col, font: 'Arial' }),
        new TextRun({ text, size: 19, color: C.bodyText, font: 'Arial' }),
      ],
    }))
  })
  if (results.length === 0 && summaryText) {
    results.push(new Paragraph({
      border: { left: { style: BorderStyle.SINGLE, size: 16, color: C.brand, space: 1 } },
      indent: { left: 200 },
      children: [new TextRun({ text: summaryText, size: 19, color: C.bodyText, font: 'Arial' })],
    }))
  }
  return results
}

// ─── Section heading ──────────────────────────────────────────────────────────
function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, font: 'Arial' })],
  })
}

function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, font: 'Arial' })],
  })
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export async function exportToWord(result, overrides = {}) {
  try {
    const checks = result?.checks ?? []
    if (!checks.length) { alert('No review data available to export.'); return }

    // Flatten overrides for easy lookup
    const effectiveOverrides = overrides || {}
    const effectiveChecks = checks.map(c => ({
      ...c,
      status: effectiveOverrides[c.id]?.newStatus ?? c.status,
    }))

    const { PASS, WARNING, FAIL, NA } = countStatuses(checks, effectiveOverrides)
    const clientName   = safe(result.client_name  || 'Client')
    const adviserName  = safe(result.adviser_name  || '')
    const practiceName = safe(result.practice_name || '')
    const adviceType   = safe(result.advice_type   || '')
    const soaDate      = safe(result.date          || '')
    const riskLevel    = safe(result.risk_level    || '')
    const docsReviewed = (result.docs_reviewed || []).join(', ') || 'SOA'
    const reviewMode   = result.mode === 'quick' ? 'Quick Check' : 'Full Review'
    const overrideCount = Object.keys(effectiveOverrides).length
    const today = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })
    const safeClient = clientName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')

    // Group checks by area
    const grouped = {}
    effectiveChecks.forEach(c => {
      const area = normaliseArea(c.area) || 'general'
      if (!grouped[area]) grouped[area] = []
      grouped[area].push(c)
    })

    // Build all findings sections
    const findingsSections = []
    const areasInOrder = [...AREA_ORDER, ...Object.keys(grouped).filter(a => !AREA_ORDER.includes(a))]

    areasInOrder.forEach(area => {
      const areaChecks = grouped[area]
      if (!areaChecks?.length) return
      const label = AREA_LABELS[area] || (area.charAt(0).toUpperCase() + area.slice(1))
      findingsSections.push(subHeading(label))
      findingsSections.push(findingsTable(areaChecks, effectiveOverrides))
      findingsSections.push(spacer(12))
    })

    // ── Document ──────────────────────────────────────────────────────────────
    const doc = new Document({
      styles: {
        default: { document: { run: { font: 'Arial', size: 22, color: C.bodyText } } },
        paragraphStyles: [
          {
            id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 28, bold: true, font: 'Arial', color: C.brand },
            paragraph: {
              spacing: { before: 360, after: 120 },
              outlineLevel: 0,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.brandLight, space: 1 } },
            },
          },
          {
            id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 23, bold: true, font: 'Arial', color: C.brandDark },
            paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 },
          },
        ],
      },

      sections: [{
        properties: {
          page: {
            size:   { width: 12240, height: 15840 },
            margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
          },
        },
        headers: { default: makeHeader(clientName) },
        footers: { default: makeFooter() },

        children: [

          // ── Cover banner ───────────────────────────────────────────────────
          coverBanner(clientName, today),
          spacer(20),

          // ── Document Details ───────────────────────────────────────────────
          sectionHeading('Document Details'),
          metaTable([
            ['Client Name',         clientName],
            ['Adviser',             adviserName],
            ['Practice',            practiceName],
            ['Advice Type',         adviceType],
            ['SOA Date',            soaDate],
            ['Review Date',         today],
            ['Risk Profile',        riskLevel],
            ['Documents Reviewed',  docsReviewed],
            ['Review Mode',         reviewMode],
          ]),
          spacer(16),

          // ── Score Summary ──────────────────────────────────────────────────
          sectionHeading('Compliance Score Summary'),
          ...scoreTable(PASS, WARNING, FAIL, NA),
          spacer(16),

          // ── Overall Assessment ─────────────────────────────────────────────
          sectionHeading('Overall Assessment'),
          ...summaryBlock(result.summary || ''),
          spacer(12),

          // ── AI Disclaimer ──────────────────────────────────────────────────
          sectionHeading('AI Disclaimer'),
          disclaimerBox(),
          spacer(12),

          // ── Reviewer Feedback ──────────────────────────────────────────────
          sectionHeading('Reviewer Feedback'),
          ...(overrideCount > 0 ? [
            new Paragraph({
              spacing: { before: 0, after: 120 },
              children: [new TextRun({
                text: `${overrideCount} reviewer override${overrideCount > 1 ? 's' : ''} applied. Overridden rows are highlighted in the Detailed Findings table below.`,
                size: 19, italics: true, color: C.warning.text, font: 'Arial',
              })],
            }),
          ] : []),
          overridesTable(effectiveOverrides),
          spacer(12),

          // ── Detailed Findings ──────────────────────────────────────────────
          sectionHeading('Detailed Findings'),
          ...findingsSections,

          // ── Footer stamp ───────────────────────────────────────────────────
          spacer(20),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
            spacing: { before: 80 },
            children: [
              new TextRun({ text: `Generated by AstuteIQ  ·  ${today}  ·  Internal use only`, size: 16, italics: true, color: C.mutedText, font: 'Arial' }),
            ],
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `AstuteIQ_Compliance_${safeClient}_${new Date().toISOString().slice(0, 10)}.docx`)

  } catch (err) {
    console.error('[AstuteIQ] Export error:', err)
    alert('Export failed: ' + err.message)
  }
}