import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import api from '../lib/api'

interface AuditLog {
  id: string
  user_email?: string
  action: string
  created_at: string
  details?: string
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    try {
      setLoading(true)
      const res = await api.get('/admin/audit-logs')
      setLogs(res.data?.logs || res.data || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-slate-500 mt-1">Track admin actions and system events</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-950">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Action</th>
              <th className="p-4 text-left">Details</th>
              <th className="p-4 text-left">Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  No audit logs available
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4 text-white">{log.user_email || 'System'}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300 capitalize font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{log.details || '—'}</td>
                  <td className="p-4 text-slate-400 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

      </div>

    </div>
  )
}