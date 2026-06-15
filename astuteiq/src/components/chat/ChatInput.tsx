import { useState } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSend: (message: string) => void
  loading: boolean
}

export default function ChatInput({
  onSend,
  loading,
}: Props) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (!message.trim()) return

    onSend(message)
    setMessage('')
  }

  return (
    <div className="border-t border-slate-800 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          disabled={loading}
          placeholder="Ask AstuteIQ Assistant..."
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit()
            }
          }}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-cyan-600 px-4 text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}