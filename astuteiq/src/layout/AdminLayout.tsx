import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminTopbar from '../components/admin/AdminTopbar'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-h-screen flex-1 flex-col bg-[#070911]">
          <AdminTopbar />

          <main className="flex-1 overflow-hidden p-6 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
