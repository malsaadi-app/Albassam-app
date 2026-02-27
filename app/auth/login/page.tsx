'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { COLORS } from '@/lib/colors';
import { useI18n } from '@/lib/useI18n';

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const { locale: language, setLocale: setLanguage, dir, t: tt } = useI18n();

  useEffect(() => {
    const next = searchParams.get('next')
    if (next) {
      if (next.startsWith('/hr')) {
        setRedirectMessage(tt('needsHRAuth'))
      } else {
        setRedirectMessage(tt('needsAuth'))
      }
    }
  }, [searchParams, language])

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
      background: COLORS.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Language Selector */}
      <div style={{
        position: 'absolute',
        top: '20px',
        [language === 'ar' ? 'left' : 'right']: '20px',
        display: 'flex',
        gap: '8px',
        background: COLORS.white,
        border: `1px solid ${COLORS.gray200}`,
        borderRadius: '12px',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
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
        maxWidth: '420px',
        width: '100%',
        background: COLORS.white,
        border: `1px solid ${COLORS.gray200}`,
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: `0 8px 32px ${COLORS.shadowMd}`
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: COLORS.gray900,
            marginBottom: '8px'
          }}>
            {currentLang.title}
          </h1>
          <p style={{ color: COLORS.gray500, fontSize: '16px' }}>
            {currentLang.subtitle}
          </p>
        </div>

        {redirectMessage && (
          <div style={{
            background: COLORS.warningLighter,
            border: `1px solid ${COLORS.warningLight}`,
            borderRadius: '12px',
            padding: '12px',
            color: COLORS.warningText,
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ {redirectMessage}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              color: COLORS.gray600,
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {currentLang.username}
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.gray200}`,
                background: COLORS.white,
                color: COLORS.gray900,
                fontSize: '16px',
                outline: 'none',
                textAlign: language === 'ar' ? 'right' : 'left'
              }}
              placeholder={currentLang.usernamePlaceholder}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              color: COLORS.gray600,
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {currentLang.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.gray200}`,
                background: COLORS.white,
                color: COLORS.gray900,
                fontSize: '16px',
                outline: 'none',
                textAlign: language === 'ar' ? 'right' : 'left'
              }}
              placeholder={currentLang.passwordPlaceholder}
            />
          </div>

          {error && (
            <div style={{
              background: COLORS.dangerLighter,
              border: `1px solid ${COLORS.dangerLight}`,
              borderRadius: '12px',
              padding: '12px',
              color: COLORS.dangerText,
              fontSize: '14px',
              textAlign: 'center'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? COLORS.gray300 : COLORS.primary,
              border: 'none',
              borderRadius: '12px',
              color: COLORS.white,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 12px ${COLORS.shadowMd}`,
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? currentLang.loading : currentLang.login}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main dir="rtl" style={{
        minHeight: '100vh',
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: COLORS.gray600, fontSize: '20px' }}>جاري التحميل...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
