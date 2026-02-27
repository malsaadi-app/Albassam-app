'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Hide sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/auth')
  
  if (isAuthPage) {
    // Auth pages: no sidebar, full screen
    return (
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
    )
  }
  
  // Regular pages: with sidebar
  return (
    <>
      <Sidebar />
      <main className="ds-app-main" style={{
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1
      }}>
        {children}
      </main>
    </>
  )
}
