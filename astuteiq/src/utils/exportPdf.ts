import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

type Issue = {
  id?: number
  title?: string
  page: number
  severity: "low" | "medium" | "high"
  bbox?: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

// 🎨 Severity colors
function getColor(severity: string) {
  if (severity === "high") return rgb(1, 0, 0)        // red
  if (severity === "medium") return rgb(1, 0.7, 0)    // amber
  return rgb(0, 0.8, 0.4)                             // green
}

// 🔥 MAIN EXPORT FUNCTION
export async function exportAnnotatedPDF(
  file: File,
  issues: Issue[]
) {
  try {
    const bytes = await file.arrayBuffer()

    const pdfDoc = await PDFDocument.load(bytes)

    const pages = pdfDoc.getPages()

    // 🔤 Load font (for labels)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    issues.forEach((issue) => {
      if (!issue.bbox) return

      const pageIndex = issue.page - 1
      if (!pages[pageIndex]) return

      const page = pages[pageIndex]
      const { height } = page.getSize()

      const { x1, y1, x2, y2 } = issue.bbox

      // 🔥 Convert coordinates (PDF origin fix)
      const rectX = x1
      const rectY = height - y2
      const rectWidth = x2 - x1
      const rectHeight = y2 - y1

      const color = getColor(issue.severity)

      // 🟥 Draw highlight box
      page.drawRectangle({
        x: rectX,
        y: rectY,
        width: rectWidth,
        height: rectHeight,
        color,
        opacity: 0.25,
        borderWidth: 1,
        borderColor: color,
      })

      // 🏷️ OPTIONAL: Draw label above box
      if (issue.title) {
        page.drawText(issue.title, {
          x: rectX,
          y: rectY + rectHeight + 4,
          size: 8,
          font,
          color: rgb(1, 1, 1),
        })
      }
    })

    const pdfBytes = await pdfDoc.save()

    // ✅ FIXED TYPE ERROR HERE
    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    })

    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "annotated-report.pdf"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // 🧹 cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000)

  } catch (error) {
    console.error("❌ PDF Export Failed:", error)
    alert("Failed to export annotated PDF")
  }
}