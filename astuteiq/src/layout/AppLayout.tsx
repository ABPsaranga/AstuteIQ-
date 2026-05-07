import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="w-full px-4 sm:px-6 lg:px-10 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}