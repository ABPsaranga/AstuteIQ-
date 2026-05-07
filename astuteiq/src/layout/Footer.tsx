export default function Footer() {
  return (
    <footer className="bg-surface border-t border-surface-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} AstuteIQ — All rights reserved.
      </div>
    </footer>
  )
}