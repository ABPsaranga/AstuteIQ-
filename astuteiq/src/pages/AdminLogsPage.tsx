// src/pages/AdminLogsPage.tsx

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Shield,
} from 'lucide-react'

const logs = [
  {
    type: 'success',
    message: 'User login successful',
    user: 'admin@astuteiq.com',
    time: '2 minutes ago',
  },
  {
    type: 'warning',
    message: 'Failed login attempt',
    user: 'unknown@email.com',
    time: '10 minutes ago',
  },
  {
    type: 'info',
    message: 'Review completed',
    user: 'paraplanner@company.com',
    time: '30 minutes ago',
  },
]

export default function AdminLogsPage() {
  return (
    <div className="space-y-8 text-slate-300">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Activity Logs
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          System and user activity monitoring
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-5">
          <h2 className="font-semibold text-white">
            Recent Events
          </h2>
        </div>

        <div className="divide-y divide-slate-800">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-5"
            >
              <div>{getIcon(log.type)}</div>

              <div className="flex-1">
                <p className="font-medium text-white">
                  {log.message}
                </p>

                <p className="text-sm text-slate-500">
                  {log.user}
                </p>
              </div>

              <span className="text-xs text-slate-500">
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={18} className="text-green-400" />

    case 'warning':
      return <AlertTriangle size={18} className="text-yellow-400" />

    case 'info':
      return <Activity size={18} className="text-blue-400" />

    default:
      return <Shield size={18} className="text-slate-400" />
  }
}