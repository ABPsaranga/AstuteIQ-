import { useEffect, useState } from "react"
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  type IHighlight,
  type ScaledPosition,
} from "react-pdf-highlighter"

type Issue = {
  id: number
  title: string
  description: string
  severity: string
  confidence: number
  page: number
  quote?: string
}

// 🔥 Find matching text
function findHighlightPosition(textItems: any[], quote: string) {
  if (!quote) return null

  const q = quote.toLowerCase()

  for (let item of textItems) {
    if (item.str.toLowerCase().includes(q)) {
      return {
        x1: item.transform[4],
        y1: item.transform[5],
        x2: item.transform[4] + item.width,
        y2: item.transform[5] + item.height,
        width: item.width,
        height: item.height,
      }
    }
  }

  return null
}

export default function PDFHighlighterViewer({
  fileUrl,
  issues,
}: {
  fileUrl: string
  issues: Issue[]
}) {
  const [highlights, setHighlights] = useState<IHighlight[]>([])

  return (
    <PdfLoader
      url={fileUrl}
      beforeLoad={<div className="text-white p-4">Loading PDF...</div>}
    >
      {(pdfDocument) => {
        // 🔥 Build highlights ONCE
        useEffect(() => {
          async function buildHighlights() {
            const results: IHighlight[] = []

            for (const issue of issues) {
              try {
                const page = await pdfDocument.getPage(issue.page)
                const textContent = await page.getTextContent()

                const match = findHighlightPosition(
                  textContent.items,
                  issue.quote || ""
                )

                if (!match) continue

                results.push({
                  id: String(issue.id),

                  content: {
                    text: issue.quote || "",
                  },

                  position: {
                    pageNumber: issue.page,
                    boundingRect: match,
                    rects: [match],
                  },

                  comment: {
                    text: `${issue.title} (${issue.severity})`,
                    emoji: "⚠️", // ✅ REQUIRED
                  },
                })
              } catch (err) {
                console.error("Highlight error:", err)
              }
            }

            setHighlights(results)
          }

          buildHighlights()
        }, [issues, pdfDocument])

        return (
          <PdfHighlighter
                pdfDocument={pdfDocument}
                highlights={highlights}
                enableAreaSelection={() => false}
                highlightTransform={(highlight) => (
                    <Highlight
                        key={highlight.id}
                        position={highlight.position}
                        comment={highlight.comment}
                        isScrolledTo={false} // ✅ REQUIRED FIX
                    />
                )} onScrollChange={function (): void {
                    throw new Error("Function not implemented.")
                } } scrollRef={function (scrollTo: (highlight: IHighlight) => void): void {
                    throw new Error("Function not implemented.")
                } } onSelectionFinished={function (position: ScaledPosition, content: { text?: string; image?: string }, hideTipAndSelection: () => void, transformSelection: () => void) {
                    throw new Error("Function not implemented.")
                } }          />
        )
      }}
    </PdfLoader>
  )
}