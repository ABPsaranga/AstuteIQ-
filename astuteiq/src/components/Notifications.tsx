import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

interface Notification {
  id:        string
  type:      'success' | 'error' | 'info'
  title:     string
  message:   string
  createdAt: Date
  read:      boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'success', title: 'Review complete',
    message: 'SOA_Johnson_2024.pdf scored 91%.',
    createdAt: new Date(Date.now() - 600_000), read: false,
  },
  {
    id: 'n2', type: 'error', title: 'Review failed',
    message: 'SOA_Williams.pdf could not be processed.',
    createdAt: new Date(Date.now() - 3_600_000), read: false,
  },
  {
    id: 'n3', type: 'info', title: 'New feature',
    message: 'Enterprise batch upload is now available.',
    createdAt: new Date(Date.now() - 86_400_000), read: true,
  },
]

const ICONS = {
  success: <CheckCircle size={15} className="text-green-400 shrink-0 mt-0.5" />,
  error:   <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />,
  info:    <Info        size={15} className="text-brand-400 shrink-0 mt-0.5" />,
}

export default function Notifications() {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS)

  const dismiss = (id: string) =>
    setItems((prev) => prev.filter((n) => n.id !== id))

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No notifications
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li
          key={n.id}
          className={`flex gap-3 p-3 rounded-lg border transition-colors ${
            n.read
              ? 'bg-surface border-surface-border'
              : 'bg-surface-hover border-surface-border'
          }`}
        >
          {ICONS[n.type]}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`}>
              {n.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
            <p className="text-xs text-slate-600 mt-1">
              {format(n.createdAt, 'dd MMM, h:mm a')}
            </p>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            className="text-slate-600 hover:text-slate-400 shrink-0"
          >
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  )
}
