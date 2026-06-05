import { Outlet } from 'react-router-dom'
import Sidebar from '../components/UserSidebar'
import Topbar from '../components/UserTopbar'

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col bg-[#070911]">
          <Topbar />

          <main className="flex-1 overflow-hidden p-6 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
