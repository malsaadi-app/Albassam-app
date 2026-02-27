'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // For iOS, show instructions after a delay
    if (isIOSDevice) {
      const hasSeenPrompt = localStorage.getItem('ios-install-prompt-shown')
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 3000)
      }
      return
    }

    // For other browsers, handle beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      const hasSeenPrompt = localStorage.getItem('install-prompt-shown')
      if (!hasSeenPrompt) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) {
      return
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
    localStorage.setItem('install-prompt-shown', 'true')
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    if (isIOS) {
      localStorage.setItem('ios-install-prompt-shown', 'true')
    } else {
      localStorage.setItem('install-prompt-shown', 'true')
    }
  }

  if (!showInstallPrompt && !showIOSInstructions) {
    return null
  }

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1D0B3E 0%, #2D1B4E 100%)',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>
            تثبيت التطبيق على iOS
          </h3>
          
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '16px' }}>لتثبيت التطبيق على جهاز iPhone أو iPad:</p>
            
            <ol style={{ paddingRight: '20px', marginBottom: '24px' }}>
              <li style={{ marginBottom: '12px' }}>
                اضغط على زر المشاركة <span style={{ fontSize: '20px' }}>⬆️</span> في أسفل المتصفح
              </li>
              <li style={{ marginBottom: '12px' }}>
                اختر "إضافة إلى الشاشة الرئيسية" <span style={{ fontSize: '20px' }}>➕</span>
              </li>
              <li style={{ marginBottom: '12px' }}>
                اضغط "إضافة" في الأعلى
              </li>
            </ol>

            <p style={{ fontSize: '14px', opacity: 0.8 }}>
              سيظهر التطبيق على الشاشة الرئيسية ويمكنك فتحه مثل أي تطبيق آخر!
            </p>
          </div>

          <button
            onClick={() => {
              setShowIOSInstructions(false)
              handleDismiss()
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #C5A572 0%, #D4AF37 100%)',
              color: '#1D0B3E',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            فهمت
          </button>
        </div>
      </div>
    )
  }

  // Install Prompt Banner
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #2D1B4E 0%, #1D0B3E 100%)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: 9999,
      animation: 'slideUp 0.3s ease-out'
    }}>
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
        📱
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
          تثبيت التطبيق
        </h4>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', margin: 0 }}>
          {isIOS 
            ? 'اضغط للحصول على التعليمات'
            : 'ثبّت التطبيق للوصول السريع والعمل دون اتصال'
          }
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #C5A572 0%, #D4AF37 100%)',
            color: '#1D0B3E',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          تثبيت
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
