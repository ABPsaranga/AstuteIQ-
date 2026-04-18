import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"

export default function AppLayout({ children }: any) {
  return (
    <div className="flex h-screen bg-[#050507] text-white">

      {/* SIDEBAR (ONLY ONCE) */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        <Topbar />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}