import { AdminSidebar } from '@/components/admin-sidebar'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-14 lg:pt-0">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </SessionProvider>
  )
}
