import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react'
import { useAuthStore } from '../features/auth/store'

export default function TermsOfUsePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const handleBack = () => {
    const role = user?.role?.toLowerCase()

    if (role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">

      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <button
            onClick={handleBack}
            className="mb-8 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <ShieldCheck size={28} className="text-violet-400" />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-white">
                Terms of Use
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                These Terms of Use govern access to and use of the AstuteIQ
                platform. By accessing, registering for, or using AstuteIQ,
                you agree to comply with these terms, applicable laws,
                industry regulations, and professional obligations.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Effective Date: June 2026</span>
                <span>•</span>
                <span>Version 1.0</span>
                <span>•</span>
                <span>AstuteIQ Compliance Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Notice */}
        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <FileText size={18} className="mt-1 text-amber-400" />

            <div>
              <h3 className="font-semibold text-amber-300">
                Important Compliance Notice
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-100/80">
                AstuteIQ provides workflow automation, compliance assistance,
                analytics, and document review capabilities. The platform does
                not provide legal, financial, regulatory, or professional
                advice. All outputs must be reviewed and verified by qualified
                professionals before implementation or client use.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              1. Acceptance of Terms
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              By accessing, registering for, or using AstuteIQ, you agree to be
              bound by these Terms of Use and all applicable laws and
              regulations. If you do not agree to these terms, you must
              immediately discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              2. Eligibility
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              AstuteIQ is intended for use by authorized financial advisers,
              paraplanners, compliance personnel, administrators, and other
              approved professionals. Users must ensure that their use of the
              platform complies with all applicable regulatory, legal, and
              professional obligations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              3. User Responsibilities
            </h2>

            <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-slate-400">
              <li>Maintain the confidentiality of account credentials and access tokens.</li>
              <li>Ensure all uploaded information is accurate, lawful, and authorized for processing.</li>
              <li>Protect client information in accordance with privacy and data protection laws.</li>
              <li>Promptly notify AstuteIQ of any unauthorized access or suspected security incidents.</li>
              <li>Remain solely responsible for all activities conducted under their account.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              4. Acceptable Use Policy
            </h2>

            <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-slate-400">
              <li>Use the platform for any unlawful or fraudulent activity.</li>
              <li>Upload malicious software, ransomware, malware, or harmful code.</li>
              <li>Attempt unauthorized access to systems, databases, or user accounts.</li>
              <li>Reverse engineer, copy, or exploit platform functionality.</li>
              <li>Disrupt, impair, or compromise service availability.</li>
              <li>Submit false, misleading, or unauthorized client information.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              5. Regulatory Compliance
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              AstuteIQ provides compliance support, workflow automation,
              analytics, and document management tools. The platform does not
              provide legal, financial, regulatory, or professional advice.
              Users remain solely responsible for ensuring compliance with all
              applicable regulations, licensing obligations, and professional
              standards.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              6. Intellectual Property
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              All platform content, software, designs, trademarks, logos,
              documentation, workflows, and proprietary technologies are owned
              by AstuteIQ or its licensors and are protected by applicable
              intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              7. Service Availability
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              While AstuteIQ strives to provide reliable and uninterrupted
              services, we do not guarantee continuous availability,
              uninterrupted access, or error-free operation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              8. Data Security
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              AstuteIQ implements commercially reasonable security controls to
              protect platform data. However, no electronic transmission or
              storage system can be guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              9. Limitation of Liability
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              To the fullest extent permitted by law, AstuteIQ shall not be
              liable for indirect, incidental, consequential, special, or
              punitive damages arising from use of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              10. Indemnification
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              Users agree to indemnify and hold harmless AstuteIQ, its officers,
              employees, affiliates, and agents from claims arising from misuse
              of the platform or violations of applicable laws.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              11. Suspension and Termination
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              AstuteIQ reserves the right to suspend, restrict, or terminate
              access where there is misuse, security risk, or breach of these
              Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              12. Changes to These Terms
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              AstuteIQ may modify these Terms periodically. Continued use of the
              platform following updates constitutes acceptance of the revised
              Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              13. Contact Information
            </h2>

            <p className="text-sm leading-7 text-slate-400">
              Questions regarding these Terms may be directed through AstuteIQ's
              official support channels available within the platform.
            </p>
          </section>

        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            © 2026 AstuteIQ. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}