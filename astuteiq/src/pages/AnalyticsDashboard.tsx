import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  calculateComplianceScore,
  getSeverityBreakdown,
} from "../utils/complianceScore"

export default function AnalyticsDashboard() {
  const [issues, setIssues] = useState<any[]>([])
  const [score, setScore] = useState(100)
  const [breakdown, setBreakdown] = useState({
    high: 0,
    medium: 0,
    low: 0,
  })

  // 🔥 Load latest report (mock / later from DB)
  useEffect(() => {
    const saved = localStorage.getItem("latest_report")

    if (saved) {
      const parsed = JSON.parse(saved)

      setIssues(parsed)
      setScore(calculateComplianceScore(parsed))
      setBreakdown(getSeverityBreakdown(parsed))
    }
  }, [])

  return (
    <div className="p-6 text-white space-y-6">

      {/* 🔥 SCORE CARD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-[#0C0C11] rounded-xl border border-white/10"
      >
        <h2 className="text-lg mb-2">Compliance Score</h2>

        <div className="flex items-center gap-6">
          <div className="text-5xl font-bold text-violet-400">
            {score}
          </div>

          <div className="text-sm text-zinc-400">
            {score > 80
              ? "Low Risk"
              : score > 50
              ? "Moderate Risk"
              : "High Risk"}
          </div>
        </div>

        {/* progress bar */}
        <div className="mt-4 w-full h-3 bg-white/10 rounded">
          <div
            className="h-3 bg-violet-500 rounded"
            style={{ width: `${score}%` }}
          />
        </div>
      </motion.div>

      {/* 🔥 BREAKDOWN */}
      <div className="grid grid-cols-3 gap-4">

        <Card title="High Risk" value={breakdown.high} color="red" />
        <Card title="Medium Risk" value={breakdown.medium} color="yellow" />
        <Card title="Low Risk" value={breakdown.low} color="green" />

      </div>

      {/* 🔥 ISSUE TABLE */}
      <div className="bg-[#0C0C11] p-4 rounded-xl border border-white/10">
        <h2 className="mb-3">Detected Issues</h2>

        <table className="w-full text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="text-left">Issue</th>
              <th>Severity</th>
              <th>Confidence</th>
            </tr>
          </thead>

          <tbody>
            {issues.map((i, idx) => (
              <tr key={idx} className="border-t border-white/5">
                <td className="py-2">{i.title}</td>
                <td className="text-center">{i.severity}</td>
                <td className="text-center">{i.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 🔥 reusable card
function Card({ title, value, color }: any) {
  const colors: any = {
    red: "text-red-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
  }

  return (
    <div className="p-4 bg-[#0C0C11] rounded-xl border border-white/10">
      <h3 className="text-sm text-zinc-500">{title}</h3>
      <div className={`text-2xl font-bold ${colors[color]}`}>
        {value}
      </div>
    </div>
  )
}