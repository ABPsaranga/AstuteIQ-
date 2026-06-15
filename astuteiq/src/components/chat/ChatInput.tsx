import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
} from 'lucide-react'

interface Props {
  onSend: (message: string) => void
  loading: boolean
}

export default function ChatInput({
  onSend,
  loading,
}: Props) {
  const [message, setMessage] =
    useState('')

  const textareaRef =
    useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!textareaRef.current) return

    textareaRef.current.style.height =
      'auto'

    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      160
    )}px`
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()

    if (!trimmed || loading) return

    onSend(trimmed)
    setMessage('')

    if (textareaRef.current) {
      textareaRef.current.style.height =
        'auto'
    }
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900/70 p-4 backdrop-blur">
      <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-950/80 p-2 transition-all focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20">
        <textarea
          ref={textareaRef}
          value={message}
          disabled={loading}
          rows={1}
          placeholder="Ask AstuteIQ Assistant..."
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey
            ) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          className="
            max-h-40
            min-h-[44px]
            flex-1
            resize-none
            bg-transparent
            px-3
            py-2
            text-sm
            text-white
            placeholder:text-slate-500
            outline-none
          "
        />

        <button
          onClick={handleSubmit}
          disabled={
            loading || !message.trim()
          }
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-xl
            bg-gradient-to-r
            from-cyan-600
            to-blue-600
            text-white
            transition-all
            duration-200
            hover:scale-105
            hover:shadow-lg
            disabled:cursor-not-allowed
            disabled:opacity-50
            disabled:hover:scale-100
          "
        >
          {loading ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between px-1">
        <span className="text-xs text-slate-500">
          Press Enter to send
        </span>

        <span className="text-xs text-slate-500">
          Shift + Enter for new line
        </span>
      </div>
    </div>
  )
}