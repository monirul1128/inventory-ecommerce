import { AdminSidebar } from '@/components/admin-sidebar'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </SessionProvider>
  )
}
