import { useEffect, useState } from "react"
import { api } from '../lib/api'

export default function ReviewHistoryPage() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.get("/reviews/history").then((res) => {
      setHistory(res.data)
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-display mb-4">History</h1>

      <div className="space-y-3">
        {history.map((h: any) => (
          <div key={h.id} className="bg-black p-4 rounded border border-gray-800">
            <p className="font-mono">{h.filename}</p>
            <p className="text-sm text-gray-400">{h.date}</p>
          </div>
        ))}
      </div>
    </div>
  )
}