import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import DesignSystemStyles from './components/ui/DesignSystemStyles'
import ServiceWorkerRegistration from './components/pwa/ServiceWorkerRegistration'
import InstallPrompt from './components/pwa/InstallPrompt'
import OfflineIndicator from './components/pwa/OfflineIndicator'
import PushNotifications from './components/pwa/PushNotifications'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'نظام مدارس الباسم',
  description: 'نظام إدارة المهام والموارد البشرية',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'مدارس الباسم',
  },
  applicationName: 'نظام مدارس الباسم',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#2D1B4E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Design System tokens & motion */}
        <DesignSystemStyles />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="مدارس الباسم" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="مدارس الباسم" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        
        {/* Leaflet CSS */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" crossOrigin="" />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Arial', margin: 0, padding: 0 }}>
        <Providers>
          {/* Service Worker Registration */}
          <ServiceWorkerRegistration />
          
          {/* Sidebar (auto-hides on /auth pages) */}
          <Sidebar />
          <main className="ds-app-main" style={{
            minHeight: '100vh',
            position: 'relative',
            zIndex: 1
          }}>
            <TopBar />
            {children}
          </main>
          
          {/* PWA Features */}
          <InstallPrompt />
          <OfflineIndicator />
          <PushNotifications />
        </Providers>
      </body>
    </html>
  )
}
