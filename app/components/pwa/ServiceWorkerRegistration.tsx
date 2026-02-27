'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check every minute

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('🔄 New version available')
                  
                  // Show update notification
                  if (confirm('يوجد تحديث جديد للتطبيق. هل تريد إعادة التحميل؟')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error)
        })

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed')
        window.location.reload()
      })

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[Client] Message from SW:', event.data)
        
        if (event.data && event.data.type === 'FORCE_RELOAD') {
          console.log('[Client] Force reload requested by SW')
          // Clear all caches before reload
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name))
          }).then(() => {
            window.location.reload()
          })
        }
      })
    } else {
      console.warn('⚠️ Service Workers not supported')
    }
  }, [])

  return null // This component doesn't render anything
}
