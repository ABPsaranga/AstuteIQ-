import { Link } from 'react-router-dom'
import {
  Mail,
  ShieldCheck,
  FileSearch,
  ArrowUpRight,
  Globe,
  Clock3,
} from 'lucide-react'

const FOOTER_LINKS = {
  Product: [
    { label: 'Run Review', to: '/soa-analysis' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Review History', to: '/history' },
  ],

  Company: [
    { label: 'Home', to: '/' },
    { label: 'Settings', to: '/settings' },
    { label: 'Support', to: '/support' },
  ],

  Compliance: [
    { label: 'ASIC RG175', to: '/asic-rg175' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Use', to: '/terms-of-use' },
  ],
}

const SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: '/assets/social/linkedin.gif',
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: '/assets/social/twitter.gif',
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: '/assets/social/facebook.gif',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: '/assets/social/instagram.gif',
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/94703572917',
    icon: '/assets/social/whatsapp.gif',
  },
]

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-slate-800/70 bg-[#0b0b14]">

      {/* Background */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,15,26,0.98) 0%, rgba(11,11,20,1) 100%)',
        }}
      />

      {/* Glow */}
      <div
        className="
          pointer-events-none absolute left-1/2 top-0
          h-[220px] w-[550px] -translate-x-1/2
          opacity-20 blur-3xl
        "
        style={{
          background:
            'radial-gradient(circle, rgba(107,47,217,0.45) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-14">

        {/* Top */}
        <div
          className="
            grid grid-cols-1 gap-12
            border-b border-slate-800/70 pb-12
            md:grid-cols-2
            lg:grid-cols-5
          "
        >

          {/* Brand */}
          <div className="space-y-6 lg:col-span-2">

            <div>
              <Link
                to="/"
                className="
                  inline-flex items-center
                  text-3xl font-bold tracking-tight text-white
                "
                style={{
                  fontFamily:
                    "'DM Serif Display', Georgia, serif",
                }}
              >
                Astute
                <span className="text-violet-400">
                  IQ
                </span>
              </Link>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
                AI-powered SOA compliance review platform built for
                Australian and New Zealand financial planning
                practices.
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">

              <div
                className="
                  inline-flex items-center gap-2
                  rounded-xl border border-emerald-400/20
                  bg-emerald-400/10
                  px-3 py-2
                  text-xs font-medium text-emerald-400
                "
              >
                <ShieldCheck size={14} />
                ASIC RG175 aligned
              </div>

              <div
                className="
                  inline-flex items-center gap-2
                  rounded-xl border border-violet-500/20
                  bg-violet-500/10
                  px-3 py-2
                  text-xs font-medium text-violet-300
                "
              >
                <FileSearch size={14} />
                39+ compliance checks
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">

              <a
                href="mailto:support@astuteiq.com"
                className="
                  inline-flex items-center gap-2
                  text-sm text-slate-400
                  transition-colors hover:text-white
                "
              >
                <Mail size={14} />
                support@astuteiq.com
              </a>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">

                <div className="flex items-center gap-1.5">
                  <Globe size={13} />
                  Australia & NZ
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock3 size={13} />
                  24/7 Monitoring
                </div>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(FOOTER_LINKS).map(
            ([section, links]) => (
              <div key={section}>
                <h3
                  className="
                    mb-4 text-sm font-semibold
                    tracking-wide text-white
                  "
                >
                  {section}
                </h3>

                <div className="space-y-3">
                  {links.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="
                        group flex items-center gap-1.5
                        text-sm text-slate-400
                        transition-colors hover:text-white
                      "
                    >
                      <span>{link.label}</span>

                      <ArrowUpRight
                        size={13}
                        className="
                          -translate-x-1 opacity-0
                          transition-all
                          group-hover:translate-x-0
                          group-hover:opacity-100
                        "
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Bottom */}
        <div
          className="
            flex flex-col items-center justify-between gap-5
            pt-6
            md:flex-row
          "
        >

          {/* Copyright */}
          <div className="text-center text-xs text-slate-500 md:text-left">
            © {new Date().getFullYear()} AstuteIQ.
            All rights reserved.

            <span className="hidden sm:inline">
              {' '}
              · Built for internal financial planning compliance
              workflows.
            </span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">

            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="
                  group flex h-11 w-11 items-center justify-center
                  rounded-xl border border-slate-800
                  bg-[#0f0f1a]
                  transition-all duration-200
                  hover:-translate-y-1
                  hover:border-violet-500/40
                  hover:bg-slate-800/70
                  hover:shadow-lg hover:shadow-violet-500/10
                "
              >
                <img
                  src={social.icon}
                  alt={social.name}
                  className="
                    h-5 w-5 object-contain
                    opacity-75 transition-all duration-200
                    group-hover:scale-110
                    group-hover:opacity-100
                  "
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </a>
            ))}

          </div>
        </div>
      </div>
    </footer>
  )
}