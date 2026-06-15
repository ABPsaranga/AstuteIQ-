import {
  MessageCircle,
  X,
  Bot,
} from 'lucide-react'

import {
  useState,
  useRef,
  useEffect,
} from 'react'

import ChatInput from './ChatInput'
import ChatMessage from './ChatMessage'

import { sendMessage } from '../../services/chatService'

import type {
  ChatMessage as Message,
} from '../../types/chat'

export default function ChatBot() {
  const [open, setOpen] = useState(false)

  const [loading, setLoading] =
    useState(false)

  const [messages, setMessages] =
    useState<Message[]>([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'Hello! I am the AstuteIQ Assistant. How can I help you today?',
        timestamp: new Date().toISOString(),
      },
    ])

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  const handleSend = async (
    text: string
  ) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [
      ...prev,
      userMessage,
    ])

    setLoading(true)

    try {
      const response =
        await sendMessage(text)

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
        timestamp:
          new Date().toISOString(),
      }

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Unable to contact AstuteIQ Assistant.',
          timestamp:
            new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-cyan-600 p-4 text-white shadow-2xl transition hover:bg-cyan-500"
      >
        {open ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
      </button>

      {/* Chat Window */}

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[650px] w-[400px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

          {/* Header */}

          <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 p-4">
            <Bot className="text-cyan-400" />
            <div>
              <h3 className="font-semibold text-white">
                AstuteIQ Assistant
              </h3>

              <p className="text-xs text-slate-400">
                Compliance Support
              </p>
            </div>
          </div>

          {/* Messages */}

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {loading && (
              <div className="text-sm text-slate-400">
                Assistant is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}

          <ChatInput
            onSend={handleSend}
            loading={loading}
          />
        </div>
      )}
    </>
  )
}