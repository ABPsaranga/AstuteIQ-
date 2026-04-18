import StatusBadge from "./StatusBadge"

export default function ResultsTable({ data }: any) {
  return (
    <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900 text-left">
          <tr>
            <th className="p-3">Rule</th>
            <th>Status</th>
            <th>Message</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i} className="border-t border-gray-800">
              <td className="p-3">{row.rule}</td>
              <td><StatusBadge status={row.status} /></td>
              <td>{row.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}