import { useEffect, useState } from "react"
import { api } from "../lib/api"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    api.get("/admin/users").then(res => setUsers(res.data))
  }, [])

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-serif text-white">Users</h1>

      <div className="bg-[#11111A] rounded-2xl border border-white/10 overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-white/5 text-zinc-400">
            <tr>
              <th className="text-left px-6 py-3">Email</th>
              <th className="text-left px-6 py-3">Role</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u: any) => (
              <tr
                key={u.id}
                className="border-t border-white/5 hover:bg-white/5 transition"
              >
                <td className="px-6 py-4 text-white">{u.email}</td>
                <td className="px-6 py-4">
                  <RoleBadge role={u.role} />
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  )
}

function RoleBadge({ role }: any) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs ${
        role === "admin"
          ? "bg-violet-600/20 text-violet-300"
          : "bg-zinc-700/40 text-zinc-300"
      }`}
    >
      {role}
    </span>
  )
}