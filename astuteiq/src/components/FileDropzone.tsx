import { useState } from "react"
import { runReview } from "../services/reviewService"

export default function FileDropzone() {
  const [file, setFile] = useState<File | null>(null)

  async function handleUpload() {
    if (!file) return

    const form = new FormData()
    form.append("file", file)

    await runReview(form)
  }

  return (
    <div className="border-dashed border-2 p-10 text-center">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="mt-4 bg-primary px-4 py-2 rounded"
      >
        Upload
      </button>
    </div>
  )
}