'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';

export default function StagesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="إدارة المراحل"
          breadcrumbs={['الرئيسية', 'سير العمل', 'المراحل']}
        />

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏗️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
            صفحة إدارة المراحل
          </h2>
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            هذه الصفحة قيد التطوير. سيتم إضافة وظائف إدارة المراحل قريباً.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/workflows"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#3B82F6',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
            >
              العودة لسير العمل
            </Link>
            <Link
              href="/branches"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'white',
                color: '#3B82F6',
                border: '1px solid #3B82F6',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              إدارة الفروع والمراحل
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              💡
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                معلومة مفيدة
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                يمكنك حالياً إدارة المراحل من خلال صفحة <strong>الفروع</strong>. كل فرع يحتوي على مجموعة من المراحل التي يمكن تعديلها وإضافة مراحل جديدة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
