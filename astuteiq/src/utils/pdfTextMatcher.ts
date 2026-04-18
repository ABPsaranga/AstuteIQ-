import type { TextItem } from "pdfjs-dist/types/src/display/api"

type Rect = {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  height: number
}

export function findQuoteRects(
  textItems: TextItem[],
  quote: string
): Rect[] {
  if (!quote) return []

  const normalized = quote.toLowerCase().trim()

  return textItems
    .filter((item) =>
      item.str.toLowerCase().includes(normalized)
    )
    .map((item) => {
      const [, , , , x, y] = item.transform

      return {
        x1: x,
        y1: y,
        x2: x + item.width,
        y2: y + item.height,
        width: item.width,
        height: item.height,
      }
    })
}