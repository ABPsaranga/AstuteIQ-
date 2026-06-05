import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react'

import api from '../lib/api'

interface RolePermission {
  role: string
  permissions: string[]
}

interface PermissionsResponse {
  roles: string[]
  permissions: Record<string, string[]>
  available_permissions: string[]
}

export default function AdminPermissionsPage() {
  const [roles, setRoles] = useState<RolePermission[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = async () => {
    try {
      setLoading(true)

      const res = await api.get<PermissionsResponse>(
        '/admin/permissions'
      )

      const rolesList = (res.data.roles || []).map((role) => ({
        role,
        permissions: res.data.permissions?.[role] || [],
      }))

      setRoles(rolesList)
      setAvailablePermissions(
        res.data.available_permissions || []
      )

      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  const togglePermission = (
    roleName: string,
    permission: string
  ) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.role !== roleName) return role

        const exists = role.permissions.includes(permission)

        return {
          ...role,
          permissions: exists
            ? role.permissions.filter((p) => p !== permission)
            : [...role.permissions, permission],
        }
      })
    )
  }

  const saveRolePermissions = async (
    roleName: string,
    permissions: string[]
  ) => {
    try {
      setSavingRole(roleName)

      await api.put(
        `/admin/permissions/${roleName}`,
        {
          permissions,
        }
      )

      await loadPermissions()
    } catch (err) {
      console.error(err)
      setError(`Failed to save ${roleName} permissions`)
    } finally {
      setSavingRole(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Loading permissions...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Permissions Management
          </h1>

          <p className="mt-1 text-slate-500">
            Manage role-based access control in real time
          </p>
        </div>

        <button
          onClick={loadPermissions}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle
            size={18}
            className="text-red-400"
          />

          <span className="text-red-300">
            {error}
          </span>
        </div>
      )}

      {roles.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
          No roles returned from backend.
        </div>
      )}

      <div className="space-y-6">
        {roles.map((roleItem) => (
          <div
            key={roleItem.role}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={22}
                  className="text-violet-400"
                />

                <div>
                  <h2 className="text-lg font-semibold text-white capitalize">
                    {roleItem.role}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {roleItem.permissions.length} permissions assigned
                  </p>
                </div>
              </div>

              <button
                disabled={
                  savingRole === roleItem.role
                }
                onClick={() =>
                  saveRolePermissions(
                    roleItem.role,
                    roleItem.permissions
                  )
                }
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-500 disabled:opacity-60"
              >
                <Save size={16} />

                {savingRole === roleItem.role
                  ? 'Saving...'
                  : 'Save'}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {availablePermissions.map(
                (permission) => {
                  const enabled =
                    roleItem.permissions.includes(
                      permission
                    )

                  return (
                    <label
                      key={permission}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                        enabled
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      <span className="text-sm text-slate-200">
                        {permission}
                      </span>

                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() =>
                          togglePermission(
                            roleItem.role,
                            permission
                          )
                        }
                        className="h-4 w-4"
                      />
                    </label>
                  )
                }
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}