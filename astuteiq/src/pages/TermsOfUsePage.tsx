export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-bold text-white">
          Terms of Use
        </h1>

        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Platform Usage
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              Users must use AstuteIQ in accordance with applicable financial
              services regulations and laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-white">
              User Responsibilities
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              Users are responsible for maintaining the confidentiality of
              account credentials and uploaded client data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Limitation of Liability
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              AstuteIQ provides compliance assistance tools and analytics but
              does not guarantee regulatory outcomes.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}