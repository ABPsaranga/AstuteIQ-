"use client"
import { useState } from "react"
import { Document, Page } from "react-pdf"
import { motion } from "framer-motion"
import jsPDF from "jspdf"

type Issue = {
  id: number
  text: string
  explanation: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  confidence: number
  position: { top: number; left: number; width: number; height: number }
}

export default function SOAAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(false)

  // 🔥 Upload + Analyze
  const handleAnalyze = async () => {
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    setIssues(data.issues)
    setLoading(false)
  }

  // 📤 Export PDF report
  const exportReport = () => {
    const doc = new jsPDF()

    doc.text("SOA Analysis Report", 10, 10)

    issues.forEach((issue, i) => {
      doc.text(
        `${i + 1}. ${issue.text} (${issue.severity})`,
        10,
        20 + i * 10
      )
    })

    doc.save("report.pdf")
  }

  return (
    <div className="flex h-screen bg-[#050507] text-white">

      {/* LEFT → PDF VIEW */}
      <div className="flex-1 p-4 border-r border-white/10 overflow-auto">

        {!file ? (
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        ) : (
          <div className="relative">

            <Document file={file}>
              <Page pageNumber={1} />
            </Document>

            {/* 🔥 Highlight overlays */}
            {issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="absolute border-2 cursor-pointer"
                style={{
                  top: issue.position.top,
                  left: issue.position.left,
                  width: issue.position.width,
                  height: issue.position.height,
                  borderColor:
                    issue.severity === "HIGH"
                      ? "red"
                      : issue.severity === "MEDIUM"
                      ? "orange"
                      : "yellow",
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          className="mt-4 px-4 py-2 bg-violet-600 rounded"
        >
          {loading ? "Analyzing..." : "Analyze SOA"}
        </button>
      </div>

      {/* RIGHT → AI PANEL */}
      <div className="w-96 p-4">

        <h2 className="text-lg font-semibold mb-4">AI Insights</h2>

        {selectedIssue ? (
          <motion.div
            key={selectedIssue.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[#0C0C11] rounded-xl border border-white/10"
          >
            <p className="text-sm mb-2">{selectedIssue.text}</p>

            <p className="text-xs text-zinc-400 mb-2">
              {selectedIssue.explanation}
            </p>

            <div className="flex justify-between text-xs">
              <span>Severity: {selectedIssue.severity}</span>
              <span>Confidence: {selectedIssue.confidence}%</span>
            </div>
          </motion.div>
        ) : (
          <p className="text-sm text-zinc-500">
            Click a highlighted issue
          </p>
        )}

        {/* 📤 Export */}
        <button
          onClick={exportReport}
          className="mt-6 w-full py-2 bg-indigo-600 rounded"
        >
          Export Report
        </button>

      </div>
    </div>
  )
}