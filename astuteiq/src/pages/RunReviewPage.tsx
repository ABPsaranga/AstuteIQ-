import { useState, useRef, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { motion } from "framer-motion"
import { explainIssue } from "../services/reviewService"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

type Issue = {
  id: number
  title: string
  description: string
  severity: "low" | "medium" | "high"
  confidence: number
  page: number
  bbox?: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

export default function RunReviewPage() {
  const [file, setFile] = useState<File | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [explanation, setExplanation] = useState<any>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const [pdfSize, setPdfSize] = useState({ width: 1, height: 1 })
  const [renderSize, setRenderSize] = useState({ width: 1, height: 1 })

  function handleFile(e: any) {
    setFile(e.target.files[0])
  }

  function onLoad({ numPages }: any) {
    setNumPages(numPages)
  }

  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    setRenderSize({
      width: rect.width,
      height: rect.height,
    })
  }, [file, pageNumber])

  async function runAnalysis() {
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("http://localhost:8000/api/analyze", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    setIssues(data.results || [])
    setLoading(false)
  }

  function getSeverityColor(sev: string) {
    if (sev === "high") return "#FF6B6B"
    if (sev === "medium") return "#FFB347"
    return "#2DD4A0"
  }

  function scaleBBox(bbox: any) {
    const scaleX = renderSize.width / pdfSize.width
    const scaleY = renderSize.height / pdfSize.height

    return {
      x: bbox.x1 * scaleX,
      y: renderSize.height - bbox.y2 * scaleY,
      width: (bbox.x2 - bbox.x1) * scaleX,
      height: (bbox.y2 - bbox.y1) * scaleY,
    }
  }

  async function handleSelect(issue: Issue) {
    setSelectedIssue(issue)
    setPageNumber(issue.page)

    const res = await explainIssue(issue)
    setExplanation(res)
  }

  // ============================
  // 📊 COMPLIANCE SCORE
  // ============================

  const score =
    100 -
    issues.reduce((acc, i) => {
      if (i.severity === "high") return acc + 15
      if (i.severity === "medium") return acc + 8
      return acc + 3
    }, 0)

  const chartData = [
    { name: "High", value: issues.filter(i => i.severity === "high").length },
    { name: "Medium", value: issues.filter(i => i.severity === "medium").length },
    { name: "Low", value: issues.filter(i => i.severity === "low").length },
  ]

  const COLORS = ["#FF6B6B", "#FFB347", "#2DD4A0"]

  // ============================
  // 📤 EXPORT PDF
  // ============================

  async function exportPDF() {
    if (!reportRef.current) return

    const canvas = await html2canvas(reportRef.current)
    const imgData = canvas.toDataURL("image/png")

    const pdf = new jsPDF()
    pdf.addImage(imgData, "PNG", 10, 10, 180, 0)

    pdf.save("compliance-report.pdf")
  }

  return (
    <div className="flex h-screen bg-[#0B0B14] text-white">

      {/* LEFT PDF */}
      <div className="flex-1 p-4 border-r border-white/10 overflow-auto">

        {!file && (
          <div className="h-full flex items-center justify-center">
            <input type="file" onChange={handleFile} />
          </div>
        )}

        {file && (
          <>
            <button
              onClick={runAnalysis}
              className="mb-3 px-4 py-2 bg-violet-600 rounded"
            >
              {loading ? "Analyzing..." : "Run Analysis"}
            </button>

            <div ref={containerRef} className="relative">

              <Document file={file} onLoadSuccess={onLoad}>
                <Page
                  pageNumber={pageNumber}
                  onLoadSuccess={(page) => {
                    const viewport = page.getViewport({ scale: 1 })
                    setPdfSize({
                      width: viewport.width,
                      height: viewport.height,
                    })
                  }}
                />
              </Document>

              {/* Highlights */}
              {issues
                .filter(i => i.page === pageNumber && i.bbox)
                .map((issue) => {
                  const box = scaleBBox(issue.bbox)

                  return (
                    <div
                      key={issue.id}
                      onClick={() => handleSelect(issue)}
                      className="absolute cursor-pointer"
                      style={{
                        left: box.x,
                        top: box.y,
                        width: box.width,
                        height: box.height,
                        border: `2px solid ${getSeverityColor(issue.severity)}`,
                        background: `${getSeverityColor(issue.severity)}33`,
                      }}
                    />
                  )
                })}
            </div>
          </>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[420px] p-4 space-y-4 overflow-auto" ref={reportRef}>

        <h2 className="text-lg font-semibold">Compliance Score</h2>

        <div className="text-4xl font-bold text-violet-400">
          {Math.max(score, 0)}%
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={chartData} dataKey="value">
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Issues */}
        <h3 className="mt-4 font-semibold">Issues</h3>

        {issues.map(i => (
          <div
            key={i.id}
            onClick={() => handleSelect(i)}
            className="p-3 bg-[#0C0C11] rounded cursor-pointer"
          >
            <div className="flex justify-between">
              <span>{i.title}</span>
              <span style={{ color: getSeverityColor(i.severity) }}>
                {i.severity}
              </span>
            </div>
          </div>
        ))}

        {/* Explanation */}
        {explanation && (
          <div className="mt-4 text-sm space-y-2">
            <h3 className="text-violet-400">AI Explanation</h3>
            <p>{explanation.summary}</p>
            <p>{explanation.fix}</p>
          </div>
        )}

        {/* Export */}
        <button
          onClick={exportPDF}
          className="mt-4 w-full py-2 bg-blue-600 rounded"
        >
          Export Full Report PDF
        </button>
      </div>
    </div>
  )
}