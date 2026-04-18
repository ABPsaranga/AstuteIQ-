export default function StatusBadge({ status }: { status: string }) {
  const map: any = {
    PASS: "bg-green",
    FAIL: "bg-red",
    WARN: "bg-amber",
  }

  return (
    <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>
      {status}
    </span>
  )
}