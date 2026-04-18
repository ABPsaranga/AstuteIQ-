export default function StatCard({ title, value }: any) {
  return (
    <div className="bg-black border border-gray-800 p-4 rounded-xl">
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className="text-2xl font-display text-primary">{value}</h2>
    </div>
  )
}