import {
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-bold text-white">
          Support
        </h1>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <Mail className="mb-4 text-emerald-400" />

            <h2 className="mb-2 text-lg font-semibold text-white">
              Email Support
            </h2>

            <p className="text-sm text-slate-400">
              support@astuteiq.ai
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <Phone className="mb-4 text-sky-400" />

            <h2 className="mb-2 text-lg font-semibold text-white">
              Phone
            </h2>

            <p className="text-sm text-slate-400">
              +61 000 000 000
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <MessageCircle className="mb-4 text-violet-400" />

            <h2 className="mb-2 text-lg font-semibold text-white">
              Live Chat
            </h2>

            <p className="text-sm text-slate-400">
              Available Monday – Friday
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}