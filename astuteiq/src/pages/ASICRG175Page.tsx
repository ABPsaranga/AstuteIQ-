export default function ASICRG175Page() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-bold text-white">
          ASIC RG175 Compliance
        </h1>

        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-sm leading-7 text-slate-400">
            AstuteIQ is designed to support financial advisers and compliance
            teams in aligning Statements of Advice (SOAs) with ASIC Regulatory
            Guide 175 standards.
          </p>

          <div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Key Compliance Areas
            </h2>

            <ul className="list-disc space-y-2 pl-6 text-sm text-slate-400">
              <li>Best interest duty validation</li>
              <li>Appropriateness of advice analysis</li>
              <li>Fee disclosure checks</li>
              <li>Risk profile consistency reviews</li>
              <li>Missing compliance wording detection</li>
              <li>Client objective alignment assessment</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Important Notice
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              AstuteIQ assists with compliance monitoring and review workflows.
              It does not replace licensed legal or compliance advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}