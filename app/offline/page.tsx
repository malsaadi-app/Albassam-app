'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/lib/colors';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        // Auto-redirect when back online
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    };

    checkOnline();

    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: COLORS.background,
      padding: '20px'
    }}>
      <div style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.gray200}`,
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: `0 8px 32px ${COLORS.shadowMd}`
      }}>
        {/* Icon */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto',
            background: isOnline ? COLORS.successLighter : COLORS.dangerLighter,
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px',
            border: `3px solid ${isOnline ? COLORS.success : COLORS.danger}`
          }}>
            {isOnline ? '🌐' : '📡'}
          </div>
        </div>

        {/* Status */}
        <h1 style={{
          color: COLORS.gray900,
          fontSize: '32px',
          marginBottom: '16px',
          fontWeight: '800'
        }}>
          {isOnline ? 'عُدت متصلاً!' : 'أنت غير متصل'}
        </h1>

        <p style={{
          color: COLORS.gray600,
          fontSize: '18px',
          lineHeight: '1.6',
          marginBottom: '32px',
          fontWeight: '500'
        }}>
          {isOnline 
            ? 'يتم إعادة الاتصال الآن...'
            : 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
          }
        </p>

        {/* Animated indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isOnline ? COLORS.success : COLORS.danger,
                animation: isOnline ? `pulse 1.5s ease-in-out ${i * 0.2}s infinite` : 'none',
                opacity: isOnline ? 1 : 0.5
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: COLORS.primary,
              color: COLORS.white,
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: `0 4px 12px ${COLORS.shadowMd}`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${COLORS.shadowMd}`;
              e.currentTarget.style.background = COLORS.primaryLight;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.shadowMd}`;
              e.currentTarget.style.background = COLORS.primary;
            }}
          >
            🔄 إعادة المحاولة
          </button>

          <button
            onClick={() => router.push('/')}
            style={{
              background: COLORS.white,
              color: COLORS.gray900,
              border: `1px solid ${COLORS.gray200}`,
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = COLORS.gray50;
              e.currentTarget.style.borderColor = COLORS.gray300;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = COLORS.white;
              e.currentTarget.style.borderColor = COLORS.gray200;
            }}
          >
            🏠 العودة للرئيسية
          </button>
        </div>

        {/* Info */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: isOnline ? COLORS.successLighter : COLORS.warningLighter,
          borderRadius: '12px',
          border: `1px solid ${isOnline ? COLORS.successLight : COLORS.warningLight}`
        }}>
          <p style={{
            color: isOnline ? COLORS.successText : COLORS.warningText,
            fontSize: '14px',
            fontWeight: '700',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>{isOnline ? '✅' : 'ℹ️'}</span>
            <span>
              {isOnline 
                ? 'يمكنك الآن استخدام جميع الميزات'
                : 'بعض البيانات المحفوظة متاحة دون اتصال'
              }
            </span>
          </p>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
