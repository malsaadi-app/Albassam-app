'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { COLORS } from '@/lib/colors'
import { useI18n } from '@/lib/useI18n'
import { FloatingInput } from '@/components/ui/FormEnhanced'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const { locale: language, setLocale: setLanguage, dir, t: tt } = useI18n()

  useEffect(() => {
    const next = searchParams.get('next')
    if (next) {
      if (next.startsWith('/hr')) {
        setRedirectMessage(tt('needsHRAuth'))
      } else {
        setRedirectMessage(tt('needsAuth'))
      }
    }
  }, [searchParams, language, tt])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || tt('loginFailed'))
      return
    }

    const next = searchParams.get('next')
    router.push(next || '/dashboard')
    router.refresh()
  }

  const currentLang = {
    title: tt('loginTitle'),
    subtitle: tt('loginSubtitle'),
    username: tt('username'),
    password: tt('password'),
    login: `🔐 ${tt('login')}`,
    loading: tt('loggingIn'),
    usernamePlaceholder: language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username',
    passwordPlaceholder: language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password',
  }

  return (
    <main dir={dir} style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Language Selector */}
      <div style={{
        position: 'absolute',
        top: '24px',
        [language === 'ar' ? 'left' : 'right']: '24px',
        display: 'flex',
        gap: '8px',
        background: COLORS.white,
        border: `1px solid ${COLORS.gray200}`,
        borderRadius: '12px',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        zIndex: 10
      }}>
        <button
          onClick={() => setLanguage('ar')}
          aria-label="العربية"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: language === 'ar' ? COLORS.primary : 'transparent',
            color: language === 'ar' ? COLORS.white : COLORS.gray600,
            fontSize: '14px',
            fontWeight: language === 'ar' ? '600' : '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🇸🇦 العربية
        </button>
        <button
          onClick={() => setLanguage('en')}
          aria-label="English"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: language === 'en' ? COLORS.primary : 'transparent',
            color: language === 'en' ? COLORS.white : COLORS.gray600,
            fontSize: '14px',
            fontWeight: language === 'en' ? '600' : '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🇬🇧 English
        </button>
      </div>

      <div style={{
        maxWidth: '440px',
        width: '100%',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ 
              position: 'relative', 
              width: '100px', 
              height: '100px',
              background: COLORS.white,
              borderRadius: '24px',
              padding: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: `1px solid ${COLORS.gray200}`
            }}>
              <Image
                src="/logo.jpg"
                alt="Albassam Schools"
                fill
                style={{ objectFit: 'contain', padding: '8px' }}
                priority
              />
            </div>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: COLORS.gray900,
            marginBottom: '8px',
            letterSpacing: '-0.5px'
          }}>
            {currentLang.title}
          </h1>
          <p style={{ color: COLORS.gray500, fontSize: '16px', fontWeight: '500' }}>
            {currentLang.subtitle}
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.gray200}`,
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          {redirectMessage && (
            <div style={{
              background: '#FEF3C7',
              border: `1px solid #FCD34D`,
              borderRadius: '12px',
              padding: '14px 16px',
              color: '#92400E',
              fontSize: '14px',
              marginBottom: '24px',
              textAlign: 'center',
              fontWeight: '600',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              ⚠️ {redirectMessage}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <FloatingInput
              label={currentLang.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              clearable
              onClear={() => setUsername('')}
            />

            <FloatingInput
              label={currentLang.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div style={{
                background: '#FEE2E2',
                border: `1px solid #FCA5A5`,
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#991B1B',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: '600',
                animation: 'shake 0.3s ease-out'
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading 
                  ? COLORS.gray300 
                  : `linear-gradient(135deg, ${COLORS.primary} 0%, #764ba2 100%)`,
                border: 'none',
                borderRadius: '12px',
                color: COLORS.white,
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading 
                  ? 'none'
                  : '0 4px 16px rgba(45, 27, 78, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(45, 27, 78, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(45, 27, 78, 0.3)'
                }
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  {currentLang.loading}
                </span>
              ) : (
                currentLang.login
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          animation: 'fadeIn 0.5s ease-out 0.2s backwards'
        }}>
          <p style={{ 
            color: COLORS.gray400, 
            fontSize: '13px',
            fontWeight: '500'
          }}>
            © 2026 {language === 'ar' ? 'مدارس الباسم' : 'Albassam Schools'} - {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </p>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main dir="rtl" style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: `4px solid ${COLORS.primary}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
