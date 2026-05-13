import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx'

import { saveAs } from 'file-saver'



const STATUS_COLORS = {
  PASS: '2DD4A0',
  WARNING: 'FFB347',
  FAIL: 'FF6B6B',
  ISSUE: 'FF6B6B',
  NA: '6B7280',
}

function safe(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function normalizeStatus(status) {
  if (!status) return 'N/A'

  const s = String(status).toUpperCase()

  if (s === 'ISSUE') return 'FAIL'

  return s
}

function countStatuses(checks, overrides = {}) {
  const counts = {
    PASS: 0,
    WARNING: 0,
    FAIL: 0,
    NA: 0,
  }

  checks.forEach((check) => {
    const override = overrides?.[check.id]

    const status = normalizeStatus(
      override?.newStatus || check.status
    )

    if (counts[status] !== undefined) {
      counts[status]++
    }
  })

  return counts
}

function makeCell(text, bold = false, width = 25) {
  return new TableCell({
    width: {
      size: width,
      type: WidthType.PERCENTAGE,
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: safe(text),
            bold,
            size: 20,
          }),
        ],
      }),
    ],
  })
}

export async function exportToWord(result, overrides = {}) {
  if (!result) return

  const metadata = result.review_metadata || {}

  const allChecks = []

  ;(result.compliance_checks || []).forEach((section) => {
    ;(section.checks || []).forEach((check, idx) => {
      allChecks.push({
        ...check,
        id: `${section.category}-${idx}`,
        area: section.category,
      })
    })
  })

  const score = countStatuses(allChecks, overrides)

  const doc = new Document({
    sections: [
      {
        children: [

          // TITLE
          new Paragraph({
            text: 'SOA Compliance Review Report',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),

          // COVER TABLE
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              ['Client Name', safe(metadata.client_names?.join(', '))],
              ['Adviser', safe(metadata.adviser_name)],
              ['Practice', safe(metadata.practice_name)],
              ['Advice Type', safe(metadata.advice_type)],
              ['SOA Date', safe(metadata.soa_date)],
              ['Review Date', safe(metadata.review_date)],
              [
                'Risk Profile',
                safe(result.client_profile?.risk_profile_super),
              ],
              [
                'Documents Reviewed',
                safe(
                  (metadata.soa_scope || []).join(', ')
                ),
              ],
            ].map(
              ([label, value]) =>
                new TableRow({
                  children: [
                    makeCell(label, true, 30),
                    makeCell(value, false, 70),
                  ],
                })
            ),
          }),

          new Paragraph({ text: '' }),

          // SCORE SUMMARY
          new Paragraph({
            text: 'Score Summary',
            heading: HeadingLevel.HEADING_1,
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  makeCell(`PASS: ${score.PASS}`, true),
                  makeCell(`WARNING: ${score.WARNING}`, true),
                  makeCell(`FAIL: ${score.FAIL}`, true),
                  makeCell(`N/A: ${score.NA}`, true),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          // OVERALL ASSESSMENT
          new Paragraph({
            text: 'Overall Assessment',
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph({
            children: [
              new TextRun({
                text:
                  safe(
                    result.overall_compliance_rating?.summary
                  ) || '',
                size: 22,
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          // DISCLAIMER
          new Paragraph({
            text: 'AI Disclaimer',
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph({
            children: [
              new TextRun({
                text:
                  'This report was generated using AI-assisted analysis and must be reviewed by a qualified human reviewer before reliance or presentation to clients.',
                italics: true,
                size: 20,
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          // REVIEWER FEEDBACK SUMMARY
          new Paragraph({
            text: 'Reviewer Feedback Summary',
            heading: HeadingLevel.HEADING_1,
          }),

          ...(Object.keys(overrides).length === 0
            ? [
                new Paragraph({
                  text: 'No reviewer overrides applied.',
                }),
              ]
            : Object.entries(overrides).map(
                ([id, override]) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${id}: `,
                        bold: true,
                      }),
                      new TextRun({
                        text:
                          override.comment ||
                          'Reviewer flagged this finding.',
                      }),
                    ],
                  })
              )),

          new Paragraph({ text: '' }),

          // DETAILED FINDINGS
          new Paragraph({
            text: 'Detailed Findings',
            heading: HeadingLevel.HEADING_1,
          }),

          ...((result.compliance_checks || []).flatMap(
            (section) => {

              const rows = [
                new Paragraph({
                  text: section.category,
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
                        makeCell('Finding', true, 25),
                        makeCell('Status', true, 15),
                        makeCell('Notes', true, 60),
                      ],
                    }),

                    ...(section.checks || []).map(
                      (check, idx) => {

                        const checkId =
                          `${section.category}-${idx}`

                        const override =
                          overrides?.[checkId]

                        const finalStatus =
                          normalizeStatus(
                            override?.newStatus ||
                              check.status
                          )

                        let notes = safe(check.detail)

                        if (override) {
                          notes +=
                            '\n\n[REVIEWER FLAGGED AS INCORRECT]'

                          if (override.comment) {
                            notes +=
                              `\nReviewer Comment: ${override.comment}`
                          }
                        }

                        return new TableRow({
                          children: [
                            makeCell(check.item, false, 25),

                            makeCell(
                              finalStatus,
                              true,
                              15
                            ),

                            makeCell(notes, false, 60),
                          ],
                        })
                      }
                    ),
                  ],
                }),

                new Paragraph({ text: '' }),
              ]

              return rows
            }
          )),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)

  saveAs(
    blob,
    `SOA_Review_${
      metadata.client_names?.[0] || 'Client'
    }.docx`
  )
}