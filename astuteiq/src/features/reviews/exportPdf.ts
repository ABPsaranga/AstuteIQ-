import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx'
import { saveAs } from 'file-saver'

/* ================= TYPES ================= */

export type Finding = {
  section: string
  title: string
  status: 'PASS' | 'WARN' | 'FAIL'
  issue: string
  recommendation: string
}

export type ReportData = {
  clientName: string
  adviser: string
  reviewer: string
  date: string
  findings: Finding[]
}

/* ================= HELPERS ================= */

function statusColor(status: string) {
  if (status === 'PASS') return '2ecc71'
  if (status === 'WARN') return 'f1c40f'
  return 'e74c3c'
}

function statusLabel(status: string) {
  if (status === 'PASS') return 'Compliant'
  if (status === 'WARN') return 'Partially Compliant'
  return 'Non-Compliant'
}

function calculateRisk(findings: Finding[]) {
  const fail = findings.filter(f => f.status === 'FAIL').length
  const warn = findings.filter(f => f.status === 'WARN').length

  if (fail > 2) return 'HIGH RISK'
  if (fail > 0 || warn > 2) return 'MEDIUM RISK'
  return 'LOW RISK'
}

/* ================= EXPORT ================= */

export async function exportDocx(report: ReportData) {
  const risk = calculateRisk(report.findings)

  const doc = new Document({
    sections: [
      {
        children: [

          new Paragraph({
            text: 'Statement of Advice Compliance Audit Report',
            heading: HeadingLevel.TITLE,
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Prepared in accordance with ASIC RG175 and Corporations Act s961B',
                italics: true,
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          new Paragraph({ text: `Client: ${report.clientName}` }),
          new Paragraph({ text: `Adviser: ${report.adviser}` }),
          new Paragraph({ text: `Reviewer: ${report.reviewer}` }),
          new Paragraph({ text: `Date: ${report.date}` }),

          new Paragraph({ text: '' }),

          new Paragraph({
            text: 'Executive Summary',
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Overall Risk Rating: ${risk}`,
                bold: true,
              }),
            ],
          }),

          new Paragraph({
            text:
              'This report assesses compliance against best interest duty, fee disclosure, and client suitability obligations.',
          }),

          new Paragraph({ text: '' }),

          new Paragraph({
            text: 'Detailed Findings',
            heading: HeadingLevel.HEADING_1,
          }),

          ...buildSections(report.findings),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `ASIC_Compliance_Report_${Date.now()}.docx`)
}

/* ================= SECTION BUILDER ================= */

function buildSections(findings: Finding[]) {
  const grouped = findings.reduce((acc: any, f) => {
    if (!acc[f.section]) acc[f.section] = []
    acc[f.section].push(f)
    return acc
  }, {})

  return Object.keys(grouped).flatMap((section) => [
    new Paragraph({
      text: section,
      heading: HeadingLevel.HEADING_2,
    }),
    createTable(grouped[section]),
  ])
}

/* ================= TABLE ================= */

function createTable(findings: Finding[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell('Check'),
          headerCell('Status'),
          headerCell('Issue'),
          headerCell('Recommendation'),
        ],
      }),
      ...findings.map(f => new TableRow({
        children: [
          cell(f.title),
          statusCell(f.status),
          cell(f.issue),
          cell(f.recommendation),
        ],
      })),
    ],
  })
}

/* ================= CELLS ================= */

function headerCell(text: string) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true })],
      }),
    ],
    borders: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    },
  })
}

function cell(text: string) {
  return new TableCell({
    children: [new Paragraph(text)],
  })
}

function statusCell(status: 'PASS' | 'WARN' | 'FAIL') {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: statusLabel(status),
            bold: true,
            color: 'ffffff',
          }),
        ],
      }),
    ],
    shading: {
      fill: statusColor(status),
    },
  })
}