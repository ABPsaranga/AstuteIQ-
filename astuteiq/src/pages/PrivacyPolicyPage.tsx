import {
  Shield,
  Lock,
  Database,
  Eye,
  Mail,
  FileText,
} from 'lucide-react'

export default function PrivacyPolicyPage() {
  const sections = [
    'Information Collection',
    'Data Usage',
    'Data Security',
    'Your Rights',
    'Cookies & Analytics',
    'Contact',
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
            <Shield className="h-4 w-4" />
            Privacy & Data Protection
          </div>

          <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-slate-400">
            At AstuteIQ, protecting your information is fundamental to how we
            build and operate our platform. This policy explains how we collect,
            use, store, and safeguard your data.
          </p>

          <div className="mt-6 inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-400">
            Last Updated: June 2026
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Contents
              </h3>

              <nav className="space-y-3">
                {sections.map((section) => (
                  <a
                    key={section}
                    href={`#${section.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block text-sm text-slate-400 transition hover:text-cyan-400"
                  >
                    {section}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <Lock className="mb-3 h-8 w-8 text-cyan-400" />
                <h3 className="mb-2 font-semibold text-white">
                  Secure Storage
                </h3>
                <p className="text-sm text-slate-400">
                  Enterprise-grade encryption for data in transit and at rest.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <Database className="mb-3 h-8 w-8 text-cyan-400" />
                <h3 className="mb-2 font-semibold text-white">
                  Data Protection
                </h3>
                <p className="text-sm text-slate-400">
                  Strict controls to ensure confidentiality and integrity.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <Eye className="mb-3 h-8 w-8 text-cyan-400" />
                <h3 className="mb-2 font-semibold text-white">
                  Transparency
                </h3>
                <p className="text-sm text-slate-400">
                  Clear information about how your data is used.
                </p>
              </div>
            </div>

            {/* Policy Content */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 md:p-10">
              <div className="space-y-10">
                <section id="information-collection">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-2xl font-semibold text-white">
                      Information Collection
                    </h2>
                  </div>

                  <p className="mt-4 leading-8 text-slate-400">
                    We collect information necessary to provide compliance
                    reviews, analytics, account management, platform security,
                    and customer support services.
                  </p>
                </section>

                <section id="data-usage">
                  <h2 className="text-2xl font-semibold text-white">
                    Data Usage
                  </h2>

                  <p className="mt-4 leading-8 text-slate-400">
                    Information is used solely to operate, improve, and secure
                    AstuteIQ services, generate compliance insights, and enhance
                    platform performance.
                  </p>
                </section>

                <section id="data-security">
                  <h2 className="text-2xl font-semibold text-white">
                    Data Security
                  </h2>

                  <p className="mt-4 leading-8 text-slate-400">
                    We implement technical, administrative, and organizational
                    safeguards including encryption, secure authentication,
                    access controls, and continuous monitoring.
                  </p>
                </section>

                <section id="your-rights">
                  <h2 className="text-2xl font-semibold text-white">
                    Your Rights
                  </h2>

                  <ul className="mt-4 space-y-3 text-slate-400">
                    <li>• Access your personal information</li>
                    <li>• Request corrections to inaccurate data</li>
                    <li>• Request deletion of eligible information</li>
                    <li>• Withdraw consent where applicable</li>
                    <li>• Request a copy of your stored data</li>
                  </ul>
                </section>

                <section id="cookies-&-analytics">
                  <h2 className="text-2xl font-semibold text-white">
                    Cookies & Analytics
                  </h2>

                  <p className="mt-4 leading-8 text-slate-400">
                    We may use cookies and analytics technologies to improve
                    user experience, maintain security, and understand platform
                    usage patterns.
                  </p>
                </section>

                <section id="contact">
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-cyan-400" />
                      <h2 className="text-xl font-semibold text-white">
                        Contact Us
                      </h2>
                    </div>

                    <p className="mt-3 text-slate-400">
                      Questions regarding privacy or data protection can be
                      directed to:
                    </p>

                    <a
                      href="mailto:support@astuteiq.ai"
                      className="mt-4 inline-flex items-center rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-500"
                    >
                      support@astuteiq.ai
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}