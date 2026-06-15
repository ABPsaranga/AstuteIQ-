import type { ChatMessage as Message } from '../../types/chat'

interface Props {
  message: Message
}

export default function ChatMessage({
  message,
}: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
          isUser
            ? 'bg-cyan-600 text-white'
            : 'bg-slate-800 text-slate-200'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}