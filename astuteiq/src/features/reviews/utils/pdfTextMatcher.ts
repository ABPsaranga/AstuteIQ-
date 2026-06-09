import type { ReviewFinding } from '../types'

export interface PageHighlight {
  page:    number
  top:     number   // % from top
  left:    number   // % from left
  width:   number   // % width
  height:  number   // % height
  finding: ReviewFinding
}

/**
 * Maps findings to simulated highlight positions on PDF pages.
 * In production, this would use pdf.js text layer to match excerpts.
 */
export function mapFindingsToHighlights(findings: ReviewFinding[]): PageHighlight[] {
  const highlights: PageHighlight[] = []

  findings.forEach((finding) => {
    finding.pages.forEach((page, idx) => {
      // Spread highlights so they don't stack
      const offset = idx * 15
      highlights.push({
        page,
        top:     15 + offset + Math.random() * 10,
        left:    5,
        width:   90,
        height:  8,
        finding,
      })
    })
  })

  return highlights
}

/**
 * Groups highlights by page number for the PDF viewer.
 */
export function groupHighlightsByPage(
  highlights: PageHighlight[]
): Map<number, PageHighlight[]> {
  const map = new Map<number, PageHighlight[]>()
  for (const h of highlights) {
    const existing = map.get(h.page) ?? []
    map.set(h.page, [...existing, h])
  }
  return map
}
