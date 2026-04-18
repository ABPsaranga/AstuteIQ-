export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        <Card title="Users" value="120" />
        <Card title="Reviews" value="540" />
        <Card title="High Risk" value="80" />
        <Card title="System Health" value="Good" />
      </div>

      <div className="p-6 bg-[#0C0C11] rounded-xl border border-white/10">
        <h2 className="mb-2">Admin Actions</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Manage users and monitor system.
        </p>

        <a href="/admin/users" className="px-4 py-2 bg-violet-600 rounded-lg">
          Manage Users
        </a>
      </div>
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="p-4 bg-[#0C0C11] rounded-xl border border-white/10">
      <p className="text-sm text-zinc-400">{title}</p>
      <h2 className="text-xl mt-2">{value}</h2>
    </div>
  )
}