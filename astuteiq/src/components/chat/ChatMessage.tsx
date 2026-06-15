import type { ChatMessage as Message } from '../../types/chat'
import { Bot, User } from 'lucide-react'

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-600/20 border border-cyan-500/30">
          <Bot className="h-4 w-4 text-cyan-400" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg transition-all duration-200 ${
          isUser
            ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-br-md'
            : 'bg-slate-800/80 border border-slate-700 text-slate-100 rounded-bl-md backdrop-blur-sm'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 border border-slate-600">
          <User className="h-4 w-4 text-slate-300" />
        </div>
      )}
    </div>
  )
}