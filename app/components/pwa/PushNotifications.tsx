'use client'

import { useEffect, useState } from 'react'

export default function PushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)

      // Show prompt after some interaction (not immediately)
      const hasAskedPermission = localStorage.getItem('notification-permission-asked')
      if (!hasAskedPermission && Notification.permission === 'default') {
        setTimeout(() => {
          setShowPrompt(true)
        }, 10000) // After 10 seconds
      }
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission()
        setPermission(permission)
        localStorage.setItem('notification-permission-asked', 'true')
        setShowPrompt(false)

        if (permission === 'granted') {
          console.log('✅ Notification permission granted')
          
          // Subscribe to push notifications
          const registration = await navigator.serviceWorker.ready
          
          // Check if already subscribed
          let subscription = await registration.pushManager.getSubscription()
          
          if (!subscription) {
            // Create new subscription (you'll need to add VAPID keys in production)
            try {
              const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
              const subscribeOptions: PushSubscriptionOptionsInit = {
                userVisibleOnly: true
              }
              
              if (vapidKey) {
                subscribeOptions.applicationServerKey = urlBase64ToUint8Array(vapidKey)
              }
              
              subscription = await registration.pushManager.subscribe(subscribeOptions)
              
              console.log('✅ Push subscription created')
              
              // Send subscription to your server
              await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
              }).catch(err => console.log('Server not ready for push subscriptions yet'))
              
            } catch (err) {
              console.log('⚠️ Push subscription not available (VAPID keys needed)')
            }
          }
        }
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('notification-permission-asked', 'true')
  }

  if (!showPrompt || permission !== 'default') {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #2D1B4E 0%, #1D0B3E 100%)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: 9997,
      animation: 'slideDown 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
        {/* Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          🔔
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            تفعيل الإشعارات
          </h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
            احصل على إشعارات فورية بالمهام الجديدة والتحديثات المهمة
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={requestPermission}
              style={{
                background: 'linear-gradient(135deg, #C5A572 0%, #D4AF37 100%)',
                color: '#1D0B3E',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              تفعيل
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ليس الآن
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
  if (!base64String) {
    return new Uint8Array(0)
  }
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
