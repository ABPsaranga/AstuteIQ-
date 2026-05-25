export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-bold text-white">
          Privacy Policy
        </h1>

        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Information Collection
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              We collect information necessary to provide compliance review,
              analytics, and platform functionality.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Data Security
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              All uploaded documents and user data are protected using
              enterprise-grade encryption and secure authentication systems.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Data Usage
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              Your data is only used to provide platform services and improve
              system performance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Contact
            </h2>

            <p className="text-sm text-slate-400">
              For privacy inquiries contact:
              support@astuteiq.ai
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}