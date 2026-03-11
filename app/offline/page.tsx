'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Offline Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '56px'
        }}>
          📡
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#111827',
          marginBottom: '16px'
        }}>
          لا يوجد اتصال بالإنترنت
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '16px',
          color: '#6B7280',
          lineHeight: '1.8',
          marginBottom: '32px'
        }}>
          يبدو أنك غير متصل بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.
        </p>

        {/* Offline Features */}
        <div style={{
          background: '#F9FAFB',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'right'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px'
          }}>
            💡 ما زال بإمكانك:
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '2'
          }}>
            <li>✅ تصفح البيانات المحفوظة مسبقاً</li>
            <li>✅ عرض الصفحات التي زرتها من قبل</li>
            <li>✅ العمل مع المحتوى المحلي</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🔄 إعادة المحاولة
          </button>

          <Link href="/">
            <button
              style={{
                width: '100%',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ← العودة للرئيسية
            </button>
          </Link>
        </div>

        {/* Help Text */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #E5E7EB',
          fontSize: '13px',
          color: '#9CA3AF',
          lineHeight: '1.6'
        }}>
          <p style={{ margin: 0 }}>
            <strong>نصيحة:</strong> قم بتثبيت التطبيق على جهازك للحصول على تجربة أفضل دون اتصال.
          </p>
        </div>
      </div>
    </div>
  );
}
