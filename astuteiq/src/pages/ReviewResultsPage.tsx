import { useEffect, useState } from "react"
import ResultsTable from "../components/ResultsTable"
import { api } from '../lib/api'

export default function ReviewResultsPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    api.get("/reviews/latest").then((res) => {
      setData(res.data.results)
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-display mb-4">Results</h1>
      <ResultsTable data={data} />
    </div>
  )
}