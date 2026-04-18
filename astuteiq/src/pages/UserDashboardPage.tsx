export default function UserDashboardPage() {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">User Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Total Reviews" value="24" />
        <Card title="High Risk" value="5" />
        <Card title="Avg Score" value="Medium" />
      </div>

      <div className="p-6 rounded-xl bg-[#0C0C11] border border-white/10">
        <h2 className="mb-2">Start New Analysis</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Upload SOA and analyze instantly.
        </p>
        <a href="/run" className="px-4 py-2 bg-violet-600 rounded-lg">
          Run Analysis
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