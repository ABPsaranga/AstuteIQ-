export default function SummaryCard({ title, value }: any) {
  return (
    <div className="bg-black p-4 rounded-xl border border-gray-800">
      <h3 className="text-sm text-gray-400">{title}</h3>
      <p className="text-2xl text-primary font-display">{value}</p>
    </div>
  )
}